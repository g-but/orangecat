/**
 * Cat Chat History API
 *
 * GET  /api/cat/history - Fetch recent messages for UI display
 * DELETE /api/cat/history - Clear conversation history
 */

import {
  getMessagesForDisplay,
  clearDefaultConversation,
} from '@/services/cat/conversation-history';
import { apiSuccess, apiRateLimited, handleApiError } from '@/lib/api/standardResponse';
import { rateLimitWriteAsync } from '@/lib/rate-limit';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  const { user, supabase } = request;
  try {
    const messages = await getMessagesForDisplay(supabase, user.id);
    return apiSuccess(messages);
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withAuth(async (request: AuthenticatedRequest) => {
  const { user, supabase } = request;

  const rl = await rateLimitWriteAsync(user.id);
  if (!rl.success) {
    const retryAfter = Math.ceil((rl.resetTime - Date.now()) / 1000);
    return apiRateLimited('Too many requests. Please slow down.', retryAfter);
  }

  try {
    await clearDefaultConversation(supabase, user.id);
    return apiSuccess({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
});
