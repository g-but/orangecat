/**
 * API Key Validation Endpoint
 *
 * POST - Validate an API key without saving it
 *
 * Last Modified: 2026-01-28
 * Last Modified Summary: Refactored to use withAuth middleware
 */

import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { apiBadRequest, apiSuccess, apiInternalError } from '@/lib/api/standardResponse';
import { createApiKeyService } from '@/services/ai/api-key-service';
import { z } from 'zod';
import { logger } from '@/utils/logger';

const validateSchema = z.object({
  apiKey: z.string().min(10).max(500),
});

/**
 * POST /api/user/api-keys/validate
 * Validate an API key without saving
 */
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { supabase } = request;

    const body = await request.json();
    const result = validateSchema.safeParse(body);

    if (!result.success) {
      return apiBadRequest('Validation failed', result.error.flatten());
    }

    const { apiKey } = result.data;

    const keyService = createApiKeyService(supabase);
    const validation = await keyService.validateKeyWithProvider(apiKey);

    return apiSuccess({
      isValid: validation.isValid,
      error: validation.error,
      rateLimits: validation.rateLimits,
    });
  } catch (error) {
    logger.error('Error validating API key', error, 'ApiKeysValidateAPI');
    return apiInternalError();
  }
});
