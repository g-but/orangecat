/**
 * AI Assistant Conversations API
 *
 * GET /api/ai-assistants/[id]/conversations - List user's conversations with this assistant
 * POST /api/ai-assistants/[id]/conversations - Create a new conversation
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify assistant exists
    const { data: assistant, error: assistantError } = await supabase
      .from('ai_assistants')
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
      console.error('Error fetching conversations:', error);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: conversations || [],
    });
  } catch (error) {
    console.error('Conversations API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: assistantId } = await params;
    const supabase = await createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify assistant exists and is active
    const { data: assistant, error: assistantError } = await supabase
      .from('ai_assistants')
      .select('id, title, status, system_prompt, welcome_message')
      .eq('id', assistantId)
      .single();

    if (assistantError || !assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    if (assistant.status !== 'active') {
      return NextResponse.json({ error: 'Assistant is not active' }, { status: 400 });
    }

    // Create new conversation
    const { data: conversation, error: createError } = await supabase
      .from(DATABASE_TABLES.AI_CONVERSATIONS)
      .insert({
        assistant_id: assistantId,
        user_id: user.id,
        status: 'active',
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating conversation:', createError);
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }

    // Add system prompt as first message if exists
    if (assistant.system_prompt) {
      await supabase
        .from(DATABASE_TABLES.AI_MESSAGES)
        .insert({
          conversation_id: conversation.id,
          role: 'system',
          content: assistant.system_prompt,
        });
    }

    // Add welcome message if exists
    if (assistant.welcome_message) {
      await supabase
        .from(DATABASE_TABLES.AI_MESSAGES)
        .insert({
          conversation_id: conversation.id,
          role: 'assistant',
          content: assistant.welcome_message,
        });
    }

    return NextResponse.json({
      success: true,
      data: conversation,
    }, { status: 201 });
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
