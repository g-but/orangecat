/**
 * Open/Create Conversation API Route
 *
 * POST /api/messages/open
 *
 * Creates or finds an existing conversation based on participants:
 * - Self (empty or just creator): Notes to Self
 * - Direct (one other user): Find existing or create new
 * - Group (2+ other users): Always create new
 *
 * @module api/messages/open
 */

import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import {
  openOrCreateConversation,
  enforceRateLimit,
  getRateLimitHeaders,
  VALIDATION,
} from '@/features/messaging/lib';
import {
  apiSuccess,
  apiValidationError,
  apiRateLimited,
  handleApiError,
} from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { user } = req;

    // Rate limiting
    const rateLimitResult = enforceRateLimit('CONVERSATION_CREATE', user.id);
    if (!rateLimitResult.allowed) {
      const retryAfter = rateLimitResult.retryAfterMs
        ? Math.ceil(rateLimitResult.retryAfterMs / 1000)
        : undefined;
      const response = apiRateLimited(
        'Rate limit exceeded. Please wait before creating more conversations.',
        retryAfter
      );
      const headers = getRateLimitHeaders(rateLimitResult);
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    // Parse request body
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const rawParticipantIds = Array.isArray(body?.participantIds) ? body.participantIds : [];
    const title = typeof body?.title === 'string' ? body.title : null;

    // Validate participant count
    if (rawParticipantIds.length > VALIDATION.MAX_PARTICIPANTS) {
      return apiValidationError(`Maximum ${VALIDATION.MAX_PARTICIPANTS} participants allowed`);
    }

    // Validate title length
    if (title && title.length > VALIDATION.TITLE_MAX_LENGTH) {
      return apiValidationError(`Title must be less than ${VALIDATION.TITLE_MAX_LENGTH} characters`);
    }

    // Filter to valid string IDs
    const validParticipantIds = rawParticipantIds.filter(
      (id): id is string => typeof id === 'string' && id.trim().length > 0
    );

    // Open or create conversation
    const result = await openOrCreateConversation(user.id, validParticipantIds, title);

    const response = apiSuccess({
      conversationId: result.conversationId,
      isExisting: result.isExisting,
    });
    
    // Add rate limit headers
    const headers = getRateLimitHeaders(rateLimitResult);
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  } catch (error) {
    logger.error('Open conversation error', { error, userId: req.user.id }, 'Messages');
    return handleApiError(error);
  }
});
