/**
 * My Cat Actions API
 *
 * Endpoints for managing pending actions and action history.
 *
 * GET /api/cat/actions - Get pending actions and recent history
 * POST /api/cat/actions - Execute an action directly (requires permission)
 *
 * Created: 2026-01-21
 * Last Modified: 2026-01-21
 * Last Modified Summary: Initial implementation
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createActionExecutor } from '@/services/cat';
import { DATABASE_TABLES } from '@/config/database-tables';
import { z } from 'zod';
import { logger } from '@/utils/logger';
import {
  apiSuccess,
  apiUnauthorized,
  apiBadRequest,
  apiNotFound,
  apiForbidden,
  apiInternalError,
  apiRateLimited,
} from '@/lib/api/standardResponse';
import { rateLimitWriteAsync } from '@/lib/rate-limit';

// Validation schema
const executeActionSchema = z.object({
  actionId: z.string().min(1),
  parameters: z.record(z.unknown()),
  conversationId: z.string().uuid().optional(),
  messageId: z.string().uuid().optional(),
});

/**
 * GET /api/cat/actions
 * Get pending actions and recent action history
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized('Unauthorized');
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const actionId = searchParams.get('actionId') || undefined;
    const status = searchParams.get('status') || undefined;

    const executor = createActionExecutor(supabase);

    // Get pending actions and history in parallel
    const [pendingActions, history] = await Promise.all([
      executor.getPendingActions(user.id),
      executor.getActionHistory(user.id, { limit, actionId, status }),
    ]);

    return apiSuccess({
      pendingActions,
      history,
    });
  } catch (error) {
    logger.error('Get cat actions error', error, 'CatActionsAPI');
    return apiInternalError('Failed to get actions');
  }
}

/**
 * POST /api/cat/actions
 * Execute an action directly (requires permission)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized('Unauthorized');
    }

    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {
      const retryAfter = Math.ceil((rl.resetTime - Date.now()) / 1000);
      return apiRateLimited('Too many requests. Please slow down.', retryAfter);
    }

    const body = await request.json();
    const parseResult = executeActionSchema.safeParse(body);

    if (!parseResult.success) {
      return apiBadRequest('Invalid request', parseResult.error.errors);
    }

    // Get user's actor ID
    const { data: actor, error: actorError } = (await supabase
      .from(DATABASE_TABLES.ACTORS)
      .select('id')
      .eq('user_id', user.id)
      .single()) as { data: { id: string } | null; error: unknown };

    if (actorError || !actor) {
      return apiNotFound('Actor not found');
    }

    const executor = createActionExecutor(supabase);
    const result = await executor.executeAction(user.id, actor.id, parseResult.data);

    if (result.success) {
      return apiSuccess(result);
    } else {
      const safeError = result.status === 'denied' ? 'Action not permitted' : 'Action could not be executed';
      return result.status === 'denied' ? apiForbidden(safeError) : apiBadRequest(safeError);
    }
  } catch (error) {
    logger.error('Execute cat action error', error, 'CatActionsAPI');
    return apiInternalError('Failed to execute action');
  }
}
