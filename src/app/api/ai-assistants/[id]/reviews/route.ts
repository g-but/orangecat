/**
 * AI Assistant Reviews API
 *
 * GET /api/ai-assistants/[id]/reviews - Get reviews for an assistant
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { DATABASE_TABLES } from '@/config/database-tables';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: assistantId } = await params;
    const supabase = await createServerClient();
    const url = new URL(request.url);

    // Pagination
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
    const offset = (page - 1) * limit;

    // Sort options
    const sortBy = url.searchParams.get('sort') || 'recent'; // recent, rating_high, rating_low

    // Get current user (optional - for showing if they've rated)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Verify assistant exists
    const { data: assistant, error: assistantError } = await (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(DATABASE_TABLES.AI_ASSISTANTS) as any)
      .select('id, average_rating, total_ratings')
      .eq('id', assistantId)
      .single();

    if (assistantError || !assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    // Build query
    let query = (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(DATABASE_TABLES.AI_ASSISTANT_RATINGS) as any)
      .select(
        `
        id,
        rating,
        review,
        created_at,
        updated_at,
        user:profiles!ai_assistant_ratings_user_id_fkey(
          id,
          username,
          name,
          avatar_url
        )
      `,
        { count: 'exact' }
      )
      .eq('assistant_id', assistantId);

    // Apply sorting
    if (sortBy === 'rating_high') {
      query = query.order('rating', { ascending: false });
    } else if (sortBy === 'rating_low') {
      query = query.order('rating', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: reviews, count, error: reviewsError } = await query;

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }

    // Get rating distribution
    const { data: distribution } = await (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(DATABASE_TABLES.AI_ASSISTANT_RATINGS) as any)
      .select('rating')
      .eq('assistant_id', assistantId);

    const ratingDistribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    distribution?.forEach((r: { rating: number }) => {
      if (r.rating >= 1 && r.rating <= 5) {
        ratingDistribution[r.rating as keyof typeof ratingDistribution]++;
      }
    });

    // Get current user's rating if authenticated
    let userRating = null;
    if (user) {
      const { data: myRating } = await (supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(DATABASE_TABLES.AI_ASSISTANT_RATINGS) as any)
        .select('id, rating, review, created_at')
        .eq('assistant_id', assistantId)
        .eq('user_id', user.id)
        .single();

      userRating = myRating;
    }

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        summary: {
          averageRating: assistant.average_rating,
          totalRatings: assistant.total_ratings,
          distribution: ratingDistribution,
        },
        userRating,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
    });
  } catch (error) {
    console.error('Fetch reviews error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
