import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { timelineService } from '@/services/timeline';
import {
  apiSuccess,
  apiValidationError,
  handleApiError,
} from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import { z } from 'zod';

const interactionSchema = z.object({
  action: z.enum(['like', 'share', 'comment']),
  eventId: z.string().min(1),
  content: z.string().max(2000).optional(),
  parentCommentId: z.string().uuid().optional(),
  shareText: z.string().max(500).optional(),
  visibility: z.enum(['public', 'private', 'followers']).optional(),
});

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { user } = req;
    const body = await req.json();
    const validation = interactionSchema.safeParse(body);

    if (!validation.success) {
      return apiValidationError('Invalid request data', {
        fields: validation.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const { action, eventId, content, parentCommentId, shareText, visibility } = validation.data;

    let result;

    switch (action) {
      case 'like':
        result = await timelineService.toggleLike(eventId, user.id);
        break;

      case 'share':
        result = await timelineService.shareEvent(eventId, user.id, shareText, visibility);
        break;

      case 'comment':
        if (!content?.trim()) {
          return apiValidationError('Comment content is required');
        }
        result = await timelineService.addComment(eventId, content.trim(), parentCommentId, user.id);
        break;

      default:
        return apiValidationError('Invalid action');
    }

    if (result.success) {
      return apiSuccess(result);
    } else {
      return apiValidationError(result.error || 'Action failed');
    }
  } catch (error) {
    logger.error('Timeline interaction error', { error, userId: req.user.id }, 'Timeline');
    return handleApiError(error);
  }
});

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { user: _user } = req;
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const eventId = searchParams.get('eventId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0);

    if (!action || !eventId) {
      return apiValidationError('Missing required parameters: action and eventId');
    }

    let result;

    switch (action) {
      case 'comments':
        result = await timelineService.getEventComments(eventId, limit, offset);
        break;

      default:
        return apiValidationError('Invalid action');
    }

    return apiSuccess(result);
  } catch (error) {
    logger.error('Timeline GET interaction error', { error, userId: req.user.id }, 'Timeline');
    return handleApiError(error);
  }
});
