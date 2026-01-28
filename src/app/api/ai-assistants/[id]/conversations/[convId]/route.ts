/**
 * AI Conversation Detail API
 *
 * GET /api/ai-assistants/[id]/conversations/[convId] - Get conversation with messages
 * PUT /api/ai-assistants/[id]/conversations/[convId] - Update conversation (title, archive)
 * DELETE /api/ai-assistants/[id]/conversations/[convId] - Delete conversation
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
  params: Promise<{ id: string; convId: string }>;
}

const updateConversationSchema = z.object({
  title: z.string().max(200).optional(),
  status: z.enum(['active', 'archived']).optional(),
});

export const GET = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id: assistantId, convId } = await context.params;
    const { user, supabase } = request;

    // Get conversation with messages
    const { data: conversation, error: convError } = await supabase
      .from(DATABASE_TABLES.AI_CONVERSATIONS)
      .select('*')
      .eq('id', convId)
      .eq('assistant_id', assistantId)
      .eq('user_id', user.id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Get messages
    const { data: messages, error: msgError } = await supabase
      .from(DATABASE_TABLES.AI_MESSAGES)
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (msgError) {
      logger.error('Error fetching messages', msgError, 'AIConversationAPI');
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Get assistant info
    const { data: assistant } = await supabase
      .from(DATABASE_TABLES.AI_ASSISTANTS)
      .select('id, title, avatar_url, pricing_model, price_per_message, price_per_1k_tokens')
      .eq('id', assistantId)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        ...(conversation as Record<string, unknown>),
        messages: messages || [],
        assistant,
      },
    });
  } catch (error) {
    logger.error('Get conversation error', error, 'AIConversationAPI');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const PUT = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id: assistantId, convId } = await context.params;
    const { user, supabase } = request;

    const body = await request.json();
    const result = updateConversationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    // Update conversation
    const { data: conversation, error } = await (
      supabase.from(DATABASE_TABLES.AI_CONVERSATIONS) as any
    )
      .update({
        ...result.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', convId)
      .eq('assistant_id', assistantId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating conversation', error, 'AIConversationAPI');
      return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 });
    }

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    logger.error('Update conversation error', error, 'AIConversationAPI');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const DELETE = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id: assistantId, convId } = await context.params;
    const { user, supabase } = request;

    // Delete conversation (cascade deletes messages)
    const { error } = await supabase
      .from(DATABASE_TABLES.AI_CONVERSATIONS)
      .delete()
      .eq('id', convId)
      .eq('assistant_id', assistantId)
      .eq('user_id', user.id);

    if (error) {
      logger.error('Error deleting conversation', error, 'AIConversationAPI');
      return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted',
    });
  } catch (error) {
    logger.error('Delete conversation error', error, 'AIConversationAPI');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
