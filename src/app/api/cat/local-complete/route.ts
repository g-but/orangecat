/**
 * POST /api/cat/local-complete — persist an exchange answered by a LOCAL
 * model (Ollama / LM Studio in the user's browser).
 *
 * The inference happened on the user's machine; this endpoint only writes
 * the finished user+assistant pair into conversation history so local chats
 * appear in history like any other — nothing is metered, no quota debited.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/utils/logger';
import { apiBadRequest, apiInternalError, apiSuccess } from '@/lib/api/standardResponse';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { createRateLimitResponse, rateLimitWriteAsync } from '@/lib/rate-limit';
import { saveMessages } from '@/services/cat/conversation-history';
import { AI_MESSAGE_MAX_CHARS } from '@/lib/validation/ai';

const completeSchema = z.object({
  conversationId: z.string().uuid(),
  message: z.string().min(1).max(AI_MESSAGE_MAX_CHARS),
  reply: z.string().min(1).max(100_000),
  /** `local:<runtime>:<model>` id the client actually used. */
  model: z.string().min(1).max(200),
});

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  const { user, supabase } = request;
  try {
    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {
      return createRateLimitResponse(rl) as NextResponse;
    }

    const body = await (request as NextRequest).json();
    const parsed = completeSchema.safeParse(body);
    if (!parsed.success) {
      return apiBadRequest('Invalid request', parsed.error.flatten());
    }
    const { conversationId, message, reply, model } = parsed.data;

    await saveMessages(supabase, conversationId, user.id, [
      { role: 'user', content: message },
      { role: 'assistant', content: reply, model_used: model, provider: 'local' },
    ]);

    return apiSuccess({ saved: true });
  } catch (error) {
    logger.error('Cat local-complete failed', { error }, 'cat/local-complete');
    return apiInternalError('Could not save the local exchange');
  }
});
