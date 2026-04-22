/**
 * Conversation Messages API Route
 *
 * GET  /api/messages/[conversationId] - Fetch messages with pagination
 * POST /api/messages/[conversationId] - Send a new message
 */

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
  fetchConversationContext,
  verifyParticipantAndReactivate,
} from '@/features/messaging/api-helpers.server';
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

const sendMessageSchema = z.object({
  content: z.string().min(VALIDATION.MESSAGE_MIN_LENGTH).max(VALIDATION.MESSAGE_MAX_LENGTH),
  messageType: z
    .enum([MESSAGE_TYPES.TEXT, MESSAGE_TYPES.IMAGE, MESSAGE_TYPES.FILE, MESSAGE_TYPES.SYSTEM])
    .default(MESSAGE_TYPES.TEXT),
  metadata: z.record(z.unknown()).optional(),
  senderActorId: z.string().uuid().optional(),
});

/** GET - Fetch messages for a conversation with cursor-based pagination */
export const GET = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<{ conversationId: string }> }) => {
    const { conversationId } = await params;
    try {
      const { user } = req;
      const { searchParams } = new URL(req.url);
      const cursor = searchParams.get('cursor');
      const limitParam = searchParams.get('limit');
      const limit = Math.min(
        parseInt(limitParam || String(PAGINATION.MESSAGES_DEFAULT), 10) || PAGINATION.MESSAGES_DEFAULT,
        PAGINATION.MESSAGES_MAX
      );

      const admin = createAdminClient();

      // Verify participant access
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
        return convExists ? apiForbidden('Access denied') : apiNotFound('Conversation not found');
      }

      const [{ messages, pagination }, ctx] = await Promise.all([
        svcFetchMessages(conversationId, user.id, cursor || undefined, limit),
        fetchConversationContext(admin, conversationId, user.id),
      ]);

      if (!ctx) return apiNotFound('Conversation not found');

      return apiSuccess({
        conversation: { ...ctx.conversation, participants: ctx.formattedParticipants, unread_count: ctx.unreadCount },
        messages,
        pagination,
      });
    } catch (error) {
      logger.error('Messages GET error', { error, conversationId, userId: req.user.id }, 'Messages');
      return handleApiError(error);
    }
  }
);

/** POST - Send a new message to the conversation */
export const POST = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<{ conversationId: string }> }) => {
    const { conversationId } = await params;
    try {
      const { user } = req;

      const rateLimitResult = enforceRateLimit('MESSAGE_SEND', user.id);
      if (!rateLimitResult.allowed) {
        const retryAfter = rateLimitResult.retryAfterMs
          ? Math.ceil(rateLimitResult.retryAfterMs / 1000)
          : undefined;
        const response = apiRateLimited('Rate limit exceeded. Please slow down.', retryAfter);
        Object.entries(getRateLimitHeaders(rateLimitResult)).forEach(([k, v]) => response.headers.set(k, v));
        return response;
      }

      const body = await req.json();
      const validation = sendMessageSchema.safeParse(body);
      if (!validation.success) {
        return apiValidationError('Invalid request data', {
          fields: validation.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })),
        });
      }

      const { content, messageType, metadata, senderActorId } = validation.data;
      const admin = createAdminClient();

      const membership = await verifyParticipantAndReactivate(admin, conversationId, user.id);
      if (membership === 'not_found') return apiForbidden('Not a participant in this conversation');

      const newId = await svcSendMessage(conversationId, user.id, content, messageType, metadata || null, senderActorId || null);
      return apiCreated({ id: newId }, { headers: getRateLimitHeaders(rateLimitResult) });
    } catch (error) {
      logger.error('Messages POST error', { error, conversationId, userId: req.user.id }, 'Messages');
      return handleApiError(error);
    }
  }
);
