/**
 * Conversation Messages API Route
 *
 * GET /api/messages/[conversationId] - Fetch messages with pagination
 * POST /api/messages/[conversationId] - Send a new message
 *
 * @module api/messages/[conversationId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';
import {
  fetchMessages as svcFetchMessages,
  sendMessage as svcSendMessage,
} from '@/features/messaging/service.server';
import {
  enforceRateLimit,
  getRateLimitHeaders,
  PAGINATION,
  VALIDATION,
  MESSAGE_TYPES,
  PARTICIPANT_ROLES,
} from '@/features/messaging/lib';

// Schema for sending a message
const sendMessageSchema = z.object({
  content: z.string().min(VALIDATION.MESSAGE_MIN_LENGTH).max(VALIDATION.MESSAGE_MAX_LENGTH),
  messageType: z.enum([MESSAGE_TYPES.TEXT, MESSAGE_TYPES.IMAGE, MESSAGE_TYPES.FILE, MESSAGE_TYPES.SYSTEM]).default(MESSAGE_TYPES.TEXT),
  metadata: z.record(z.any()).optional(),
});

/**
 * GET - Fetch messages for a conversation with cursor-based pagination
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const { searchParams } = new URL(request.url);

    // Parse pagination params
    const cursor = searchParams.get('cursor');
    const limitParam = searchParams.get('limit');
    const limit = Math.min(
      parseInt(limitParam || String(PAGINATION.MESSAGES_DEFAULT), 10) || PAGINATION.MESSAGES_DEFAULT,
      PAGINATION.MESSAGES_MAX
    );

    // Authenticate user
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client for participant check to bypass RLS
    const admin = createAdminClient();

    // Verify user is a participant
    const { data: participant, error: partError } = await admin
      .from('conversation_participants')
      .select('user_id, last_read_at, is_active')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (partError || !participant) {
      const { data: convExists } = await admin
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .maybeSingle();

      if (!convExists) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch messages using service
    const { messages, pagination } = await svcFetchMessages(
      conversationId,
      cursor || undefined,
      limit
    );

    // Get conversation info
    const { data: conv, error: convError } = await admin
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Fetch participants
    const { data: participants } = await admin
      .from('conversation_participants')
      .select(
        `
        user_id,
        role,
        joined_at,
        last_read_at,
        is_active,
        profiles:user_id (id, username, name, avatar_url)
      `
      )
      .eq('conversation_id', conversationId);

    // Format participants
    const formattedParticipants = (participants || []).map((p: any) => ({
      user_id: p.user_id,
      username: p.profiles?.username || '',
      name: p.profiles?.name || '',
      avatar_url: p.profiles?.avatar_url || '',
      role: p.role,
      joined_at: p.joined_at,
      last_read_at: p.last_read_at,
      is_active: p.is_active,
    }));

    // Calculate unread count
    const userParticipant = formattedParticipants.find((p) => p.user_id === user.id);
    let unreadCount = 0;
    if (userParticipant?.last_read_at) {
      const { count } = await admin
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .gt('created_at', userParticipant.last_read_at)
        .eq('is_deleted', false);
      unreadCount = count || 0;
    }

    return NextResponse.json({
      conversation: {
        ...conv,
        participants: formattedParticipants,
        unread_count: unreadCount,
      },
      messages,
      pagination,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[api/messages/[id]] GET error:', message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST - Send a new message to the conversation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;

    // Authenticate user
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = enforceRateLimit('MESSAGE_SEND', user.id);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please slow down.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const validation = sendMessageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { content, messageType, metadata } = validation.data;

    // Use admin client to bypass RLS for participant check
    const admin = createAdminClient();

    // Check membership (with auto-reactivation for soft-deleted participants)
    const { data: participantMaybe, error: partError } = await admin
      .from('conversation_participants')
      .select('user_id, is_active')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (partError || !participantMaybe) {
      // Not a participant - cannot send
      return NextResponse.json(
        { error: 'Not a participant in this conversation' },
        { status: 403 }
      );
    }

    // Reactivate if soft-deleted
    if ((participantMaybe as any).is_active === false) {
      await admin
        .from('conversation_participants')
        .update({ is_active: true, last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);
    }

    // Send message
    const newId = await svcSendMessage(
      conversationId,
      user.id,
      content,
      messageType,
      metadata || null
    );

    return NextResponse.json(
      { success: true, id: newId },
      { headers: getRateLimitHeaders(rateLimitResult) }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[api/messages/[id]] POST error:', message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
