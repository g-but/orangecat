/**
 * User API Keys Management
 *
 * GET - List user's API keys
 * POST - Add a new API key
 *
 * Last Modified: 2026-01-28
 * Last Modified Summary: Refactored to use withAuth middleware
 */

import { createApiKeyService } from '@/services/ai/api-key-service';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { z } from 'zod';
import { logger } from '@/utils/logger';
import {
  apiSuccess,
  apiCreated,
  apiBadRequest,
  apiInternalError,
} from '@/lib/api/standardResponse';

const addKeySchema = z.object({
  provider: z
    .enum(['openrouter', 'anthropic', 'openai', 'google', 'xai', 'groq', 'together', 'deepseek'])
    .default('openrouter'),
  keyName: z.string().min(1).max(50).default('Default'),
  apiKey: z.string().min(10).max(500),
  isPrimary: z.boolean().default(true),
});

/**
 * GET /api/user/api-keys
 * List all API keys for the current user
 */
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { user, supabase } = request;

    const keyService = createApiKeyService(supabase);
    const keys = await keyService.getKeys(user.id);

    // Also get platform usage
    const platformUsage = await keyService.checkPlatformUsage(user.id);

    return apiSuccess({
      keys,
      platformUsage,
      hasByok: keys.some(k => k.is_valid && k.is_primary),
    });
  } catch (error) {
    logger.error('Error fetching API keys', error, 'ApiKeysAPI');
    return apiInternalError('Internal server error');
  }
});

/**
 * POST /api/user/api-keys
 * Add a new API key
 */
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { user, supabase } = request;

    const body = await request.json();
    const result = addKeySchema.safeParse(body);

    if (!result.success) {
      return apiBadRequest('Validation failed', result.error.flatten());
    }

    const { provider, keyName, apiKey, isPrimary } = result.data;

    const keyService = createApiKeyService(supabase);
    const addResult = await keyService.addKey({
      userId: user.id,
      provider,
      keyName,
      apiKey,
      isPrimary,
    });

    if (!addResult.success) {
      return apiBadRequest(addResult.error || 'Failed to add API key');
    }

    return apiCreated(addResult.key);
  } catch (error) {
    logger.error('Error adding API key', error, 'ApiKeysAPI');
    return apiInternalError('Internal server error');
  }
});
