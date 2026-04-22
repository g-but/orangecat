/**
 * My Cat Permissions API
 *
 * GET    /api/cat/permissions - Get user's permission summary
 * POST   /api/cat/permissions - Grant permission for an action/category
 * DELETE /api/cat/permissions - Revoke permission for an action/category
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createPermissionService } from '@/services/cat';
import { CAT_ACTIONS, ACTION_CATEGORIES, ACTION_CATEGORY_KEYS, type ActionCategory } from '@/config/cat-actions';
import { z } from 'zod';
import { logger } from '@/utils/logger';
import { apiSuccess, apiUnauthorized, apiBadRequest, apiInternalError, apiRateLimited } from '@/lib/api/standardResponse';
import { rateLimitWriteAsync } from '@/lib/rate-limit';

const categorySchema = z.enum(ACTION_CATEGORY_KEYS);

const grantPermissionSchema = z.object({
  actionId: z.string().min(1),
  category: categorySchema,
  requiresConfirmation: z.boolean().optional(),
  dailyLimit: z.number().int().positive().optional(),
  maxSatsPerAction: z.number().int().positive().optional(),
});

const revokePermissionSchema = z.object({
  actionId: z.string().min(1),
  category: categorySchema,
});

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return apiUnauthorized();

    const permissionService = createPermissionService(supabase);
    const summary = await permissionService.getPermissionSummary(user.id);
    const availableActions = Object.values(CAT_ACTIONS)
      .filter(a => a.enabled)
      .map(a => ({ id: a.id, name: a.name, description: a.description, category: a.category, riskLevel: a.riskLevel, requiresConfirmation: a.requiresConfirmation }));
    const categories = Object.entries(ACTION_CATEGORIES).map(([key, value]) => ({ id: key, ...value }));

    return apiSuccess({ summary, availableActions, categories });
  } catch (error) {
    logger.error('Get cat permissions error', error, 'CatPermissionsAPI');
    return apiInternalError('Failed to get permissions');
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return apiUnauthorized();

    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) return apiRateLimited('Too many requests. Please slow down.', Math.ceil((rl.resetTime - Date.now()) / 1000));

    const body = await request.json();
    const parseResult = grantPermissionSchema.safeParse(body);
    if (!parseResult.success) return apiBadRequest('Invalid request', parseResult.error.errors);

    const { actionId, category, requiresConfirmation, dailyLimit, maxSatsPerAction } = parseResult.data;

    if (actionId !== '*') {
      const action = CAT_ACTIONS[actionId];
      if (!action) return apiBadRequest(`Unknown action: ${actionId}`);
      if (action.category !== category) return apiBadRequest(`Action ${actionId} is not in category ${category}`);
    }

    const permissionService = createPermissionService(supabase);
    if (actionId === '*') {
      await permissionService.grantCategory(user.id, category as ActionCategory, { requiresConfirmation: requiresConfirmation ?? true, dailyLimit });
    } else {
      await permissionService.grantPermission(user.id, actionId, category as ActionCategory, { requiresConfirmation: requiresConfirmation ?? true, dailyLimit, maxSatsPerAction });
    }

    return apiSuccess({ summary: await permissionService.getPermissionSummary(user.id) });
  } catch (error) {
    logger.error('Grant cat permission error', error, 'CatPermissionsAPI');
    return apiInternalError('Failed to grant permission');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return apiUnauthorized();

    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) return apiRateLimited('Too many requests. Please slow down.', Math.ceil((rl.resetTime - Date.now()) / 1000));

    const body = await request.json();
    const parseResult = revokePermissionSchema.safeParse(body);
    if (!parseResult.success) return apiBadRequest('Invalid request', parseResult.error.errors);

    const { actionId, category } = parseResult.data;
    const permissionService = createPermissionService(supabase);

    if (actionId === '*') {
      await permissionService.revokeCategory(user.id, category as ActionCategory);
    } else {
      await permissionService.revokePermission(user.id, actionId, category as ActionCategory);
    }

    return apiSuccess({ summary: await permissionService.getPermissionSummary(user.id) });
  } catch (error) {
    logger.error('Revoke cat permission error', error, 'CatPermissionsAPI');
    return apiInternalError('Failed to revoke permission');
  }
}
