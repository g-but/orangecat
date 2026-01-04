import { withOptionalAuth } from '@/lib/api/withAuth';
import { fetchConversationSummary } from '@/features/messaging/service.server';
import {
  apiSuccess,
  handleApiError,
} from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';

export const GET = withOptionalAuth(async (
  _req,
  { params }: { params: Promise<{ conversationId: string }> }
) => {
  try {
    const { conversationId } = await params;
    const conversation = await fetchConversationSummary(conversationId);
    return apiSuccess({ conversation });
  } catch (error) {
    logger.error('Conversation summary error', { error, conversationId: (await params).conversationId }, 'Messages');
    return handleApiError(error);
  }
});
