/**
 * AI Assistant Rating API
 *
 * POST /api/ai-assistants/[id]/rate - Submit or update a rating
 * DELETE /api/ai-assistants/[id]/rate - Remove user's rating
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { DATABASE_TABLES } from '@/config/database-tables';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const ratingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  review: z.string().max(1000).optional().nullable(),
});

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: assistantId } = await params;
    const supabase = await createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = ratingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { rating, review } = result.data;

    // Verify assistant exists and is active
    const { data: assistant, error: assistantError } = await (supabase
      .from(DATABASE_TABLES.AI_ASSISTANTS) as any)
      .select('id, status')
      .eq('id', assistantId)
      .single();

    if (assistantError || !assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    // Check if user has used this assistant (has conversations)
    const { data: conversations, error: convError } = await (supabase
      .from(DATABASE_TABLES.AI_CONVERSATIONS) as any)
      .select('id')
      .eq('assistant_id', assistantId)
      .eq('user_id', user.id)
      .limit(1);

    if (convError || !conversations || conversations.length === 0) {
      return NextResponse.json(
        {
          error: 'You must use this assistant before rating it',
        },
        { status: 403 }
      );
    }

    // Upsert rating (insert or update)
    const { data: ratingData, error: ratingError } = await (supabase
      .from(DATABASE_TABLES.AI_ASSISTANT_RATINGS) as any)
      .upsert(
        {
          assistant_id: assistantId,
          user_id: user.id,
          rating,
          review,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'assistant_id,user_id',
        }
      )
      .select()
      .single();

    if (ratingError) {
      console.error('Error saving rating:', ratingError);
      return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: ratingData,
    });
  } catch (error) {
    console.error('Rating error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: assistantId } = await params;
    const supabase = await createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error: deleteError } = await (supabase
      .from(DATABASE_TABLES.AI_ASSISTANT_RATINGS) as any)
      .delete()
      .eq('assistant_id', assistantId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting rating:', deleteError);
      return NextResponse.json({ error: 'Failed to delete rating' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete rating error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
