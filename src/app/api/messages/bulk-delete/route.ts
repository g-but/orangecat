import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth'
import { createServerClient } from '@/lib/supabase/server'
import {
  apiSuccess,
  apiValidationError,
  apiForbidden,
  handleApiError,
} from '@/lib/api/standardResponse'
import { logger } from '@/utils/logger'
import { z } from 'zod'
import { DATABASE_TABLES } from '@/config/database-tables'

const bulkDeleteSchema = z.object({
  conversationId: z.string().min(1),
  ids: z.array(z.string().min(1)).min(1),
})

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { user } = req
    const supabase = await createServerClient()

    const body = await req.json().catch(() => ({}))
    const validation = bulkDeleteSchema.safeParse(body)

    if (!validation.success) {
      return apiValidationError('Invalid request', {
        fields: validation.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      })
    }

    const { conversationId, ids } = validation.data

    // Verify user is participant
    const { data: participant } = await (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(DATABASE_TABLES.CONVERSATION_PARTICIPANTS) as any)
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()
    if (!participant) {
      return apiForbidden('Access denied')
    }

    // Soft delete messages (only messages sent by current user)
    // PURE RLS: relies on 'Message senders can update their messages' policy
    const { error: updErr, data } = await (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(DATABASE_TABLES.MESSAGES) as any)
      .update({ is_deleted: true })
      .in('id', ids)
      .eq('conversation_id', conversationId)
      .eq('sender_id', user.id)
      .select('id')

    if (updErr) {
      logger.error('Failed to delete messages', { error: updErr, conversationId, userId: user.id, messageIds: ids }, 'Messages')
      return handleApiError(updErr)
    }

    return apiSuccess({ deleted: data?.length || 0 })
  } catch (error) {
    logger.error('Bulk delete messages error', { error, userId: req.user.id }, 'Messages')
    return handleApiError(error)
  }
})
