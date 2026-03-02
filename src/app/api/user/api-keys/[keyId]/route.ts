/**
 * Single API Key Management
 *
 * DELETE - Remove an API key
 * PATCH - Update API key (set as primary)
 *
 * Last Modified: 2026-01-28
 * Last Modified Summary: Refactored to use withAuth middleware
 */

import { createApiKeyService } from '@/services/ai/api-key-service';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { z } from 'zod';
import { logger } from '@/utils/logger';
import { apiSuccess, apiBadRequest, apiInternalError } from '@/lib/api/standardResponse';

interface RouteContext {
  params: Promise<{ keyId: string }>;
}

const updateKeySchema = z.object({
  isPrimary: z.boolean().optional(),
});

/**
 * DELETE /api/user/api-keys/[keyId]
 * Delete an API key
 */
export const DELETE = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { keyId } = await context.params;
    const { user, supabase } = request;

    const keyService = createApiKeyService(supabase);
    const success = await keyService.deleteKey(user.id, keyId);

    if (!success) {
      return apiBadRequest('Failed to delete key');
    }

    return apiSuccess({ success: true });
  } catch (error) {
    logger.error('Error deleting API key', error, 'ApiKeysAPI');
    return apiInternalError('Internal server error');
  }
});

/**
 * PATCH /api/user/api-keys/[keyId]
 * Update an API key (e.g., set as primary)
 */
export const PATCH = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { keyId } = await context.params;
    const { user, supabase } = request;

    const body = await request.json();
    const result = updateKeySchema.safeParse(body);

    if (!result.success) {
      return apiBadRequest('Validation failed', result.error.flatten());
    }

    const keyService = createApiKeyService(supabase);

    if (result.data.isPrimary) {
      const success = await keyService.setPrimary(user.id, keyId);
      if (!success) {
        return apiBadRequest('Failed to set primary key');
      }
    }

    return apiSuccess({ success: true });
  } catch (error) {
    logger.error('Error updating API key', error, 'ApiKeysAPI');
    return apiInternalError('Internal server error');
  }
});
