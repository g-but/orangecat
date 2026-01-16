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
import { createServerClient } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiNotFound,
  apiForbidden,
  apiValidationError,
  handleApiError,
} from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import { z } from 'zod';
import { DATABASE_TABLES } from '@/config/database-tables';

// Schema for editing a message
const editMessageSchema = z.object({
  content: z.string().min(1).max(1000),
});

export const PATCH = withAuth(async (
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ messageId: string }> }
) => {
  try {
    const { messageId } = await params;
    const { user } = req;
    const supabase = await createServerClient();

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(DATABASE_TABLES.MESSAGES) as any)
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(DATABASE_TABLES.MESSAGES) as any)
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


