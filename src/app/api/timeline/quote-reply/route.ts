import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { timelineService } from '@/services/timeline';
import {
  apiSuccess,
  apiValidationError,
  handleApiError,
} from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import { z } from 'zod';

const quoteReplySchema = z.object({
  parentPostId: z.string().min(1),
  content: z.string().min(1).max(2000),
  quotedContent: z.string().max(2000).optional(),
  visibility: z.enum(['public', 'private', 'followers']).optional().default('public'),
});

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { user } = req;
    const body = await req.json();
    const validation = quoteReplySchema.safeParse(body);

    if (!validation.success) {
      return apiValidationError('Invalid request data', {
        fields: validation.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const { parentPostId, content, quotedContent, visibility } = validation.data;

    // Create quote reply using the service
    const result = await timelineService.createQuoteReply(
      parentPostId,
      user.id,
      content.trim(),
      quotedContent?.trim() || '',
      visibility
    );

    if (result.success && result.event) {
      // Fetch the enriched event for the response
      const enrichedResult = await timelineService.getEventById(result.event.id);

      if (enrichedResult.success && enrichedResult.event) {
        return apiSuccess({ event: enrichedResult.event });
      }
    }

    return apiValidationError(result.error || 'Failed to create quote reply');
  } catch (error) {
    logger.error('Quote reply creation error', { error, userId: req.user.id }, 'Timeline');
    return handleApiError(error);
  }
});




