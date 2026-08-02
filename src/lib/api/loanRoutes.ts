/**
 * Shared helpers for the `/api/loans/*` route handlers.
 *
 * Centralises the two blocks every loan route repeated verbatim: JSON-body
 * parsing + Zod validation, and mapping a loan-domain failure result to its
 * HTTP response. The reason→status contract lives here, once, so adding a new
 * domain failure reason updates every route at the same time.
 */

import type { NextResponse } from 'next/server';
import type { z } from 'zod';
import {
  apiBadRequest,
  apiForbidden,
  apiInternalError,
  apiNotFound,
  apiRateLimited,
  apiValidationError,
  type ApiErrorResponse,
} from '@/lib/api/standardResponse';
import { rateLimitWriteAsync, retryAfterSeconds } from '@/lib/rate-limit';
import { logger } from '@/utils/logger';

type ErrorResponse = NextResponse<ApiErrorResponse>;

/** Failure arm shared by loan-domain results (`{ ok: false, reason, message }`). */
export interface LoanDomainFailure {
  reason: string;
  message: string;
}

/**
 * Map a loan-domain failure to an HTTP response. Single source of truth for the
 * reason→status contract used by every `/api/loans` route. Unknown reasons are
 * treated as internal errors and logged with the supplied label.
 */
export function loanDomainFailureResponse(
  failure: LoanDomainFailure,
  logLabel: string
): ErrorResponse {
  switch (failure.reason) {
    case 'loan_not_found':
    case 'not_found':
      return apiNotFound(failure.message);
    case 'forbidden':
    case 'below_minimum':
      return apiForbidden(failure.message);
    case 'invalid_state':
      return apiBadRequest(failure.message);
    default:
      logger.error(`${logLabel} failed`, { message: failure.message }, 'LoansAPI');
      return apiInternalError(failure.message);
  }
}

/**
 * Per-user write quota shared by every mutating `/api/loans` route. Returns the
 * 429 response to send, or null when the caller is within quota.
 */
export async function loanWriteRateLimit(userId: string): Promise<ErrorResponse | null> {
  const rl = await rateLimitWriteAsync(userId);
  if (!rl.success) {
    return apiRateLimited('Too many requests. Please slow down.', retryAfterSeconds(rl));
  }
  return null;
}

/**
 * Read and Zod-validate a JSON request body. Returns the parsed data, or an
 * error response to return directly. Set `allowEmpty` for endpoints where an
 * absent body is valid (it defaults to `{}` before validation).
 */
export async function parseLoanBody<S extends z.ZodTypeAny>(
  request: Request,
  schema: S,
  options?: { allowEmpty?: boolean }
): Promise<{ ok: true; data: z.infer<S> } | { ok: false; response: ErrorResponse }> {
  let body: unknown = {};
  try {
    const text = await request.text();
    if (text.trim()) {
      body = JSON.parse(text);
    } else if (!options?.allowEmpty) {
      return { ok: false, response: apiBadRequest('Invalid JSON body') };
    }
  } catch {
    return { ok: false, response: apiBadRequest('Invalid JSON body') };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, response: apiValidationError('Invalid request', parsed.error.flatten()) };
  }
  return { ok: true, data: parsed.data };
}
