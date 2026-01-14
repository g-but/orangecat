/**
 * AI Conversation Detail API
 *
 * GET /api/ai-assistants/[id]/conversations/[convId] - Get conversation with messages
 * PUT /api/ai-assistants/[id]/conversations/[convId] - Update conversation (title, archive)
 * DELETE /api/ai-assistants/[id]/conversations/[convId] - Delete conversation
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { DATABASE_TABLES } from '@/config/database-tables';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string; convId: string }>;
}

const updateConversationSchema = z.object({
  title: z.string().max(200).optional(),
  status: z.enum(['active', 'archived']).optional(),
});

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: assistantId, convId } = await params;
    const supabase = await createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      console.error('Error fetching messages:', msgError);
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
    console.error('Get conversation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: assistantId, convId } = await params;
    const supabase = await createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    const { data: conversation, error } = await (supabase
      .from(DATABASE_TABLES.AI_CONVERSATIONS) as any)
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
      console.error('Error updating conversation:', error);
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
    console.error('Update conversation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: assistantId, convId } = await params;
    const supabase = await createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete conversation (cascade deletes messages)
    const { error } = await supabase
      .from(DATABASE_TABLES.AI_CONVERSATIONS)
      .delete()
      .eq('id', convId)
      .eq('assistant_id', assistantId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting conversation:', error);
      return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted',
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
