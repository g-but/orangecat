/**
 * AI Assistant Rating API
 *
 * POST /api/ai-assistants/[id]/rate - Submit or update a rating
 * DELETE /api/ai-assistants/[id]/rate - Remove user's rating
 *
 * Last Modified: 2026-01-28
 * Last Modified Summary: Refactored to use withAuth middleware
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { DATABASE_TABLES } from '@/config/database-tables';
import { z } from 'zod';
import { logger } from '@/utils/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const ratingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  review: z.string().max(1000).optional().nullable(),
});

export const POST = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id: assistantId } = await context.params;
    const { user, supabase } = request;

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
    const { data: assistant, error: assistantError } = await (
      supabase.from(DATABASE_TABLES.AI_ASSISTANTS) as any
    )
      .select('id, status')
      .eq('id', assistantId)
      .single();

    if (assistantError || !assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    // Check if user has used this assistant (has conversations)
    const { data: conversations, error: convError } = await (
      supabase.from(DATABASE_TABLES.AI_CONVERSATIONS) as any
    )
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
    const { data: ratingData, error: ratingError } = await (
      supabase.from(DATABASE_TABLES.AI_ASSISTANT_RATINGS) as any
    )
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
      logger.error('Error saving rating', ratingError, 'AIAssistantRateAPI');
      return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: ratingData,
    });
  } catch (error) {
    logger.error('Rating error', error, 'AIAssistantRateAPI');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const DELETE = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id: assistantId } = await context.params;
    const { user, supabase } = request;

    const { error: deleteError } = await (
      supabase.from(DATABASE_TABLES.AI_ASSISTANT_RATINGS) as any
    )
      .delete()
      .eq('assistant_id', assistantId)
      .eq('user_id', user.id);

    if (deleteError) {
      logger.error('Error deleting rating', deleteError, 'AIAssistantRateAPI');
      return NextResponse.json({ error: 'Failed to delete rating' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Delete rating error', error, 'AIAssistantRateAPI');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
