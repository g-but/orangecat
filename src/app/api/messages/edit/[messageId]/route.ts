/**
 * Message Edit API Endpoint
 *
 * PATCH /api/messages/edit/[messageId]
 * Updates a message's content and sets edited_at timestamp
 *
 * Created: 2025-12-12
 * Last Modified: 2025-12-14
 * Last Modified Summary: Moved to /edit/[messageId] to avoid route conflict
 */

import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import {
  apiSuccess,
  apiNotFound,
  apiForbidden,
  apiValidationError,
  apiRateLimited,
  handleApiError,
} from '@/lib/api/standardResponse';
import {  rateLimitWriteAsync , retryAfterSeconds } from '@/lib/rate-limit';
import { logger } from '@/utils/logger';
import { z } from 'zod';
import { DATABASE_TABLES } from '@/config/database-tables';
import { validateUUID, getValidationError } from '@/lib/api/validation';

// Schema for editing a message
const editMessageSchema = z.object({
  content: z.string().min(1).max(1000),
});

export const PATCH = withAuth(async (
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ messageId: string }> }
) => {
  const { messageId } = await params;
  const idValidation = getValidationError(validateUUID(messageId, 'message ID'));
  if (idValidation) {return idValidation;}
  try {
    const { user, supabase } = req;

    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {
      const retryAfter = retryAfterSeconds(rl);
      return apiRateLimited('Too many requests. Please slow down.', retryAfter);
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = editMessageSchema.safeParse(body);

    if (!validation.success) {
      return apiValidationError('Invalid request data', {
        fields: validation.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const { content } = validation.data;

    // Verify user is the sender of this message
    const { data: message, error: messageError } = await (supabase
      .from(DATABASE_TABLES.MESSAGES))
      .select('id, sender_id, conversation_id, is_deleted')
      .eq('id', messageId)
      .single();

    if (messageError || !message) {
      return apiNotFound('Message not found');
    }

    if (message.is_deleted) {
      return apiValidationError('Cannot edit deleted message');
    }

    if (message.sender_id !== user.id) {
      return apiForbidden('You can only edit your own messages');
    }

    // Update message content and set edited_at
    const { data: updatedMessage, error: updateError } = await (supabase
      .from(DATABASE_TABLES.MESSAGES))
      .update({
        content,
        edited_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .eq('sender_id', user.id) // Double-check ownership
      .select()
      .single();

    if (updateError || !updatedMessage) {
      logger.error('Failed to update message', { error: updateError, messageId, userId: user.id }, 'Messages');
      return handleApiError(updateError || new Error('Update returned no data'));
    }

    return apiSuccess({ message: updatedMessage });
  } catch (error) {
    logger.error('Error editing message', { error, messageId: (await params).messageId, userId: req.user.id }, 'Messages');
    return handleApiError(error);
  }
});

