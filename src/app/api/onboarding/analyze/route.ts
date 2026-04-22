import { logger } from '@/utils/logger';
import { withOptionalAuth } from '@/lib/api/withAuth';
import { apiSuccess, apiValidationError, handleApiError } from '@/lib/api/standardResponse';
import { z } from 'zod';
import { analyzeDescription } from '@/services/onboarding/analyzeDescription';

const analysisRequestSchema = z.object({
  description: z.string().trim().min(1).max(5000),
});

export const POST = withOptionalAuth(async req => {
  try {
    const body = await req.json();
    const validation = analysisRequestSchema.safeParse(body);

    if (!validation.success) {
      return apiValidationError('Invalid request data', {
        fields: validation.error.issues.map(issue => ({ field: issue.path.join('.'), message: issue.message })),
      });
    }

    return apiSuccess(analyzeDescription(validation.data.description));
  } catch (error) {
    logger.error('Error analyzing description', { error }, 'Onboarding');
    return handleApiError(error);
  }
});
