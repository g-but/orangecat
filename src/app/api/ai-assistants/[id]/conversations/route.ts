/**
 * AI Assistant Conversations API
 *
 * GET /api/ai-assistants/[id]/conversations - List user's conversations with this assistant
 * POST /api/ai-assistants/[id]/conversations - Create a new conversation
 *
 * Last Modified: 2026-01-28
 * Last Modified Summary: Refactored to use withAuth middleware
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { DATABASE_TABLES } from '@/config/database-tables';
import { STATUS } from '@/config/database-constants';
import { logger } from '@/utils/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id: assistantId } = await context.params;
    const { user, supabase } = request;

    // Verify assistant exists
    const { data: assistant, error: assistantError } = await supabase
      .from(DATABASE_TABLES.AI_ASSISTANTS)
      .select('id, title, status')
      .eq('id', assistantId)
      .single();

    if (assistantError || !assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    // Get user's conversations with this assistant
    const { data: conversations, error } = await supabase
      .from(DATABASE_TABLES.AI_CONVERSATIONS)
      .select('*')
      .eq('assistant_id', assistantId)
      .eq('user_id', user.id)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) {
      logger.error('Error fetching conversations', error, 'AIConversationsAPI');
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: conversations || [],
    });
  } catch (error) {
    logger.error('Conversations API error', error, 'AIConversationsAPI');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const POST = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id: assistantId } = await context.params;
    const { user, supabase } = request;

    // Verify assistant exists and is active
    const { data: assistant, error: assistantError } = await (
      supabase.from(DATABASE_TABLES.AI_ASSISTANTS) as any
    )
      .select('id, title, status, system_prompt, welcome_message')
      .eq('id', assistantId)
      .single();

    if (assistantError || !assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    if (assistant.status !== STATUS.AI_ASSISTANTS.ACTIVE) {
      return NextResponse.json({ error: 'Assistant is not active' }, { status: 400 });
    }

    // Create new conversation
    const { data: conversation, error: createError } = await (
      supabase.from(DATABASE_TABLES.AI_CONVERSATIONS) as any
    )
      .insert({
        assistant_id: assistantId,
        user_id: user.id,
        status: 'active',
      })
      .select()
      .single();

    if (createError) {
      logger.error('Error creating conversation', createError, 'AIConversationsAPI');
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }

    // Add system prompt as first message if exists
    if (assistant.system_prompt) {
      await (supabase.from(DATABASE_TABLES.AI_MESSAGES) as any).insert({
        conversation_id: conversation.id,
        role: 'system',
        content: assistant.system_prompt,
      });
    }

    // Add welcome message if exists
    if (assistant.welcome_message) {
      await (supabase.from(DATABASE_TABLES.AI_MESSAGES) as any).insert({
        conversation_id: conversation.id,
        role: 'assistant',
        content: assistant.welcome_message,
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: conversation,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Create conversation error', error, 'AIConversationsAPI');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
