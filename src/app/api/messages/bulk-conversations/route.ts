import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth'
import { createServerClient } from '@/lib/supabase/server'
import {
  apiSuccess,
  apiValidationError,
  handleApiError,
} from '@/lib/api/standardResponse'
import { logger } from '@/utils/logger'
import { z } from 'zod'
import { DATABASE_TABLES } from '@/config/database-tables'

const bulkConversationsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  action: z.enum(['leave', 'delete']).optional().default('leave'),
})

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { user } = req
    const supabase = await createServerClient()

    const body = await req.json().catch(() => ({}))
    const validation = bulkConversationsSchema.safeParse(body)

    if (!validation.success) {
      return apiValidationError('Invalid request', {
        fields: validation.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      })
    }

    const { ids } = validation.data

    // Default behavior: leave conversations (soft remove for this user)
    // PURE RLS: relies on 'Users can update their own participation' policy
    const { error: updErr, data } = await (supabase
      .from(DATABASE_TABLES.CONVERSATION_PARTICIPANTS) as any)
      .update({ is_active: false })
      .in('conversation_id', ids)
      .eq('user_id', user.id)
      .select('conversation_id')

    if (updErr) {
      logger.error('Failed to update conversations', { error: updErr, userId: user.id, conversationIds: ids }, 'Messages')
      return handleApiError(updErr)
    }

    return apiSuccess({ updated: data?.length || 0 })
  } catch (error) {
    logger.error('Bulk conversations error', { error, userId: req.user.id }, 'Messages')
    return handleApiError(error)
  }
})
