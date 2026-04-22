/**
 * AI Assistant Reviews API
 *
 * GET /api/ai-assistants/[id]/reviews - Get reviews for an assistant
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';
import { apiNotFound, apiInternalError, apiSuccess } from '@/lib/api/standardResponse';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: assistantId } = await params;
    const supabase = await createServerClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const url = new URL(request.url);

    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
    const offset = (page - 1) * limit;
    const sortBy = url.searchParams.get('sort') || 'recent';

    const { data: { user } } = await supabase.auth.getUser();

    const { data: assistant, error: assistantError } = await db
      .from(DATABASE_TABLES.AI_ASSISTANTS).select('id, average_rating, total_ratings').eq('id', assistantId).single();
    if (assistantError || !assistant) {return apiNotFound('Assistant not found');}

    let query = db
      .from(DATABASE_TABLES.AI_ASSISTANT_RATINGS)
      .select(`id, rating, review, created_at, updated_at, user:profiles!ai_assistant_ratings_user_id_fkey(id, username, name, avatar_url)`, { count: 'exact' })
      .eq('assistant_id', assistantId);

    if (sortBy === 'rating_high') {query = query.order('rating', { ascending: false });}
    else if (sortBy === 'rating_low') {query = query.order('rating', { ascending: true });}
    else {query = query.order('created_at', { ascending: false });}

    query = query.range(offset, offset + limit - 1);

    const [{ data: reviews, count, error: reviewsError }, { data: distribution }, { data: myRating }] = await Promise.all([
      query,
      db.from(DATABASE_TABLES.AI_ASSISTANT_RATINGS).select('rating').eq('assistant_id', assistantId),
      user ? db.from(DATABASE_TABLES.AI_ASSISTANT_RATINGS).select('id, rating, review, created_at').eq('assistant_id', assistantId).eq('user_id', user.id).single() : Promise.resolve({ data: null }),
    ]);

    if (reviewsError) {
      logger.error('Error fetching reviews', reviewsError, 'AIAssistantReviewsAPI');
      return apiInternalError('Failed to fetch reviews');
    }

    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    distribution?.forEach((r: { rating: number }) => {
      if (r.rating >= 1 && r.rating <= 5) {ratingDistribution[r.rating as keyof typeof ratingDistribution]++;}
    });

    return apiSuccess({
      reviews,
      summary: { averageRating: assistant.average_rating, totalRatings: assistant.total_ratings, distribution: ratingDistribution },
      userRating: myRating || null,
      pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
    });
  } catch (error) {
    logger.error('Fetch reviews error', error, 'AIAssistantReviewsAPI');
    return apiInternalError('Internal server error');
  }
}
