/**
 * AI Conversation Detail API
 *
 * GET /api/ai-assistants/[id]/conversations/[convId] - Get conversation with messages
 * PUT /api/ai-assistants/[id]/conversations/[convId] - Update conversation (title, archive)
 * DELETE /api/ai-assistants/[id]/conversations/[convId] - Delete conversation
 */


import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { DATABASE_TABLES } from '@/config/database-tables';
import { z } from 'zod';
import { logger } from '@/utils/logger';
import { apiSuccess, apiNotFound, apiBadRequest, apiInternalError, apiRateLimited } from '@/lib/api/standardResponse';
import {  rateLimitWriteAsync , retryAfterSeconds } from '@/lib/rate-limit';
import { validateUUID, getValidationError } from '@/lib/api/validation';

interface RouteContext {
  params: Promise<{ id: string; convId: string }>;
}

const updateConversationSchema = z.object({
  title: z.string().max(200).optional(),
  status: z.enum(['active', 'archived']).optional(),
});

export const GET = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  const { id: assistantId, convId } = await context.params;
  const aIdV = getValidationError(validateUUID(assistantId, 'assistant ID'));
  if (aIdV) {return aIdV;}
  const cIdV = getValidationError(validateUUID(convId, 'conversation ID'));
  if (cIdV) {return cIdV;}
  try {
    const { user, supabase } = request;

    const { data: conversation, error: convError } = await supabase
      .from(DATABASE_TABLES.AI_CONVERSATIONS)
      .select('*')
      .eq('id', convId).eq('assistant_id', assistantId).eq('user_id', user.id)
      .single();

    if (convError || !conversation) {return apiNotFound('Conversation not found');}

    const [{ data: messages, error: msgError }, { data: assistant }] = await Promise.all([
      supabase.from(DATABASE_TABLES.AI_MESSAGES).select('*').eq('conversation_id', convId).order('created_at', { ascending: true }),
      supabase.from(DATABASE_TABLES.AI_ASSISTANTS).select('id, title, avatar_url, pricing_model, price_per_message, price_per_1k_tokens').eq('id', assistantId).single(),
    ]);

    if (msgError) {
      logger.error('Error fetching messages', msgError, 'AIConversationAPI');
      return apiInternalError('Failed to fetch messages');
    }

    return apiSuccess({ ...(conversation as Record<string, unknown>), messages: messages || [], assistant });
  } catch (error) {
    logger.error('Get conversation error', error, 'AIConversationAPI');
    return apiInternalError();
  }
});

export const PUT = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  const { id: assistantId, convId } = await context.params;
  const aIdV = getValidationError(validateUUID(assistantId, 'assistant ID'));
  if (aIdV) {return aIdV;}
  const cIdV = getValidationError(validateUUID(convId, 'conversation ID'));
  if (cIdV) {return cIdV;}
  try {
    const { user, supabase } = request;

    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {return apiRateLimited('Too many requests. Please slow down.', retryAfterSeconds(rl));}

    const body = await request.json();
    const result = updateConversationSchema.safeParse(body);
    if (!result.success) {return apiBadRequest('Validation failed', result.error.flatten());}

    const { data: conversation, error } = await supabase.from(DATABASE_TABLES.AI_CONVERSATIONS)
      .update({ ...result.data, updated_at: new Date().toISOString() })
      .eq('id', convId).eq('assistant_id', assistantId).eq('user_id', user.id)
      .select().single();

    if (error) {
      logger.error('Error updating conversation', error, 'AIConversationAPI');
      return apiInternalError('Failed to update conversation');
    }
    if (!conversation) {return apiNotFound('Conversation not found');}

    return apiSuccess(conversation);
  } catch (error) {
    logger.error('Update conversation error', error, 'AIConversationAPI');
    return apiInternalError();
  }
});

export const DELETE = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  const { id: assistantId, convId } = await context.params;
  const aIdV = getValidationError(validateUUID(assistantId, 'assistant ID'));
  if (aIdV) {return aIdV;}
  const cIdV = getValidationError(validateUUID(convId, 'conversation ID'));
  if (cIdV) {return cIdV;}
  try {
    const { user, supabase } = request;

    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {return apiRateLimited('Too many requests. Please slow down.', retryAfterSeconds(rl));}

    const { error } = await supabase
      .from(DATABASE_TABLES.AI_CONVERSATIONS)
      .delete()
      .eq('id', convId).eq('assistant_id', assistantId).eq('user_id', user.id);

    if (error) {
      logger.error('Error deleting conversation', error, 'AIConversationAPI');
      return apiInternalError('Failed to delete conversation');
    }

    return apiSuccess({ message: 'Conversation deleted' });
  } catch (error) {
    logger.error('Delete conversation error', error, 'AIConversationAPI');
    return apiInternalError();
  }
});
