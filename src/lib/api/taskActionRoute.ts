/**
 * Task Action Route Factory
 *
 * Shared POST prologue for /api/tasks/[id]/{attention,complete,request}:
 * task-ID validation, auth, write rate-limiting, body parsing + Zod
 * validation, and the exception envelope. Each route supplies only its
 * action-specific handler.
 *
 * Created: 2026-08-02
 * Last Modified: 2026-08-02
 * Last Modified Summary: Extracted from triplicated task action routes (jscpd dedup)
 */

import type { NextResponse } from 'next/server';
import type { z } from 'zod';
import type { User } from '@supabase/supabase-js';
import type { AnySupabaseClient } from '@/lib/supabase/types';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { apiValidationError, apiInternalError, apiRateLimited } from '@/lib/api/standardResponse';
import { rateLimitWriteAsync, retryAfterSeconds } from '@/lib/rate-limit';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { logger } from '@/utils/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export interface TaskActionContext<TData> {
  taskId: string;
  user: User;
  supabase: AnySupabaseClient;
  data: TData;
}

/**
 * Build a POST handler for a task action route.
 *
 * `routeName` is used verbatim in the exception log so log lines stay
 * byte-identical to the pre-factory routes.
 */
export function createTaskActionRoute<TSchema extends z.ZodTypeAny>(options: {
  schema: TSchema;
  routeName: string;
  handler: (ctx: TaskActionContext<z.infer<TSchema>>) => Promise<NextResponse>;
}) {
  const { schema, routeName, handler } = options;

  return withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
    const { id: taskId } = await context.params;
    const idValidation = getValidationError(validateUUID(taskId, 'task ID'));
    if (idValidation) {
      return idValidation;
    }
    const { user, supabase } = request;
    try {
      const rl = await rateLimitWriteAsync(user.id);
      if (!rl.success) {
        return apiRateLimited('Too many requests. Please slow down.', retryAfterSeconds(rl));
      }

      const body = await request.json().catch(() => ({}));
      const result = schema.safeParse(body);
      if (!result.success) {
        return apiValidationError('Validation failed', result.error.flatten());
      }

      return await handler({ taskId, user, supabase, data: result.data });
    } catch (err) {
      logger.error(`Exception in ${routeName}`, { error: err }, 'TasksAPI');
      return apiInternalError();
    }
  });
}
