/**
 * API Response Helpers — Thin delegation layer
 *
 * All implementations live in standardResponse.ts (SSOT).
 * This file re-exports an object-based API for existing callers.
 *
 * New code should import from '@/lib/api/standardResponse' directly.
 */

import { NextResponse } from 'next/server';
import {
  apiSuccess,
  apiCreated,
  apiNoContent,
  apiBadRequest,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiConflict,
  apiRateLimited,
  apiInternalError,
  apiServiceUnavailable,
  apiValidationError,
  handleApiError as handleApiErrorImpl,
} from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';

// Constants for backwards compatibility
export const ErrorTypes = {
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  AUTHORIZATION_FAILED: 'AUTHORIZATION_FAILED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  CONFLICT: 'CONFLICT',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UNSUPPORTED_MEDIA_TYPE: 'UNSUPPORTED_MEDIA_TYPE',
} as const;

export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RATE_LIMITED: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Pre-configured error responses (delegates to standardResponse)
export const ApiResponses = {
  authenticationRequired: () => apiUnauthorized(),
  authorizationFailed: (message = 'Insufficient permissions') => apiForbidden(message),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validationError: (message: string, details?: any) => apiValidationError(message, details),
  badRequest: (message = 'Bad request') => apiBadRequest(message),
  notFound: (resource = 'Resource') => apiNotFound(`${resource} not found`),
  conflict: (message = 'Resource conflict') => apiConflict(message),
  rateLimitExceeded: (message = 'Rate limit exceeded') => apiRateLimited(message),
  internalServerError: (message = 'Internal server error') => apiInternalError(message),
  serviceUnavailable: (message = 'Service temporarily unavailable') =>
    apiServiceUnavailable(message),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fileTooLarge: (maxSize?: string) =>
    apiBadRequest(`File too large${maxSize ? `. Maximum size: ${maxSize}` : ''}`),
  unsupportedMediaType: (supportedTypes?: string[]) =>
    apiBadRequest(
      `Unsupported media type${supportedTypes ? `. Supported: ${supportedTypes.join(', ')}` : ''}`
    ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  success: (data?: any, message?: string) => apiSuccess(data ?? null),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  created: (data?: any, message?: string) => apiCreated(data ?? null),
  accepted: (message = 'Request accepted for processing') =>
    apiSuccess({ message }, { status: 202 }),
  noContent: () => apiNoContent(),
};

// Re-export helper functions (delegate to standardResponse)
export function createErrorResponse(
  message: string,
  status: number,
  type?: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details?: any
): NextResponse {
  return apiBadRequest(message, details);
}

export function createSuccessResponse(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any,
  status: number = 200,
  message?: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: any
): NextResponse {
  return apiSuccess(data ?? null, { status });
}

export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorMessage?: string
): Promise<T | NextResponse> {
  try {
    return await operation();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    logger.error('API operation failed', { error: error?.message }, 'API');
    return handleApiErrorImpl(error);
  }
}
