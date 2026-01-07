/**
 * Conversation Messages API Route
 *
 * GET /api/messages/[conversationId] - Fetch messages with pagination
 * POST /api/messages/[conversationId] - Send a new message
 *
 * @module api/messages/[conversationId]
 */

import { NextRequest } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';
import { DATABASE_TABLES } from '@/config/database-tables';
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
} from '@/features/messaging/lib';
import {
  apiSuccess,
  apiCreated,
  apiNotFound,
  apiForbidden,
  apiValidationError,
  apiRateLimited,
  handleApiError,
} from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import type { Database } from '@/types/database';

// Schema for sending a message
const sendMessageSchema = z.object({
  content: z.string().min(VALIDATION.MESSAGE_MIN_LENGTH).max(VALIDATION.MESSAGE_MAX_LENGTH),
  messageType: z
    .enum([MESSAGE_TYPES.TEXT, MESSAGE_TYPES.IMAGE, MESSAGE_TYPES.FILE, MESSAGE_TYPES.SYSTEM])
    .default(MESSAGE_TYPES.TEXT),
  metadata: z.record(z.any()).optional(),
  senderActorId: z.string().uuid().optional(), // Optional: send as specific actor
});

/**
 * GET - Fetch messages for a conversation with cursor-based pagination
 */
export const GET = withAuth(async (
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) => {
  const { conversationId } = await params;
  try {
    const { searchParams } = new URL(req.url);
    const { user } = req;

    // Parse pagination params
    const cursor = searchParams.get('cursor');
    const limitParam = searchParams.get('limit');
    const limit = Math.min(
      parseInt(limitParam || String(PAGINATION.MESSAGES_DEFAULT), 10) ||
        PAGINATION.MESSAGES_DEFAULT,
      PAGINATION.MESSAGES_MAX
    );

    // Use admin client for participant check to bypass RLS
    const admin = createAdminClient();

    // Verify user is a participant
    const { data: participant, error: partError } = await admin
      .from(DATABASE_TABLES.CONVERSATION_PARTICIPANTS)
      .select('user_id, last_read_at, is_active')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (partError || !participant) {
      const { data: convExists } = await admin
        .from(DATABASE_TABLES.CONVERSATIONS)
        .select('id')
        .eq('id', conversationId)
        .maybeSingle();

      if (!convExists) {
        return apiNotFound('Conversation not found');
      }
      return apiForbidden('Access denied');
    }

    // Fetch messages using service
    const { messages, pagination } = await svcFetchMessages(
      conversationId,
      user.id,
      cursor || undefined,
      limit
    );

    // Get conversation info
    const { data: conv, error: convError } = await admin
      .from(DATABASE_TABLES.CONVERSATIONS)
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conv) {
      return apiNotFound('Conversation not found');
    }

    // Fetch participants
    const { data: participants } = await admin
      .from(DATABASE_TABLES.CONVERSATION_PARTICIPANTS)
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
    const userParticipant = formattedParticipants.find(p => p.user_id === user.id);
    let unreadCount = 0;
    if (userParticipant?.last_read_at) {
      const { count } = await admin
        .from(DATABASE_TABLES.MESSAGES)
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .gt('created_at', userParticipant.last_read_at)
        .eq('is_deleted', false);
      unreadCount = count || 0;
    }

    return apiSuccess({
      conversation: {
        ...(conv as Record<string, unknown>),
        participants: formattedParticipants,
        unread_count: unreadCount,
      },
      messages,
      pagination,
    });
  } catch (error) {
    logger.error('Messages GET error', { error, conversationId, userId: req.user.id }, 'Messages');
    return handleApiError(error);
  }
});

/**
 * POST - Send a new message to the conversation
 */
export const POST = withAuth(async (
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) => {
  const { conversationId } = await params;
  try {
    const { user } = req;

    // Rate limiting
    const rateLimitResult = enforceRateLimit('MESSAGE_SEND', user.id);
    if (!rateLimitResult.allowed) {
      const retryAfter = rateLimitResult.retryAfterMs
        ? Math.ceil(rateLimitResult.retryAfterMs / 1000)
        : undefined;
      const response = apiRateLimited('Rate limit exceeded. Please slow down.', retryAfter);
      // Add rate limit headers
      const headers = getRateLimitHeaders(rateLimitResult);
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    // Parse and validate body
    const body = await req.json();
    const validation = sendMessageSchema.safeParse(body);

    if (!validation.success) {
      return apiValidationError('Invalid request data', {
        fields: validation.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const { content, messageType, metadata, senderActorId } = validation.data;

    // Use admin client to bypass RLS for participant check
    const admin = createAdminClient();

    // Check membership (with auto-reactivation for soft-deleted participants)
    const { data: participantMaybe, error: partError } = await admin
      .from(DATABASE_TABLES.CONVERSATION_PARTICIPANTS)
      .select('user_id, is_active')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (partError || !participantMaybe) {
      // Not a participant - cannot send
      return apiForbidden('Not a participant in this conversation');
    }

    // Reactivate if soft-deleted
    if (participantMaybe && typeof participantMaybe === 'object' && 'is_active' in participantMaybe && (participantMaybe as { is_active?: boolean }).is_active === false) {
      const updateData: Database['public']['Tables']['conversation_participants']['Update'] = {
        is_active: true,
        last_read_at: new Date().toISOString(),
      };
      const updateQuery = admin
        .from(DATABASE_TABLES.CONVERSATION_PARTICIPANTS)
        .update(updateData as any)
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);
      await (updateQuery as any);
    }

    // Send message (optionally as a specific actor)
    const newId = await svcSendMessage(
      conversationId,
      user.id,
      content,
      messageType,
      metadata || null,
      senderActorId || null
    );

    return apiCreated(
      { id: newId },
      {
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );
  } catch (error) {
    logger.error('Messages POST error', { error, conversationId, userId: req.user.id }, 'Messages');
    return handleApiError(error);
  }
});
