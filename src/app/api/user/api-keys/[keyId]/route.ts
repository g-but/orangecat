/**
 * Single API Key Management
 *
 * DELETE - Remove an API key
 * PATCH - Update API key (set as primary)
 *
 * Last Modified: 2026-01-28
 * Last Modified Summary: Refactored to use withAuth middleware
 */

import { NextResponse } from 'next/server';
import { createApiKeyService } from '@/services/ai/api-key-service';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { z } from 'zod';
import { logger } from '@/utils/logger';

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
      return NextResponse.json({ error: 'Failed to delete key' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting API key', error, 'ApiKeysAPI');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const keyService = createApiKeyService(supabase);

    if (result.data.isPrimary) {
      const success = await keyService.setPrimary(user.id, keyId);
      if (!success) {
        return NextResponse.json({ error: 'Failed to set primary key' }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error updating API key', error, 'ApiKeysAPI');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
