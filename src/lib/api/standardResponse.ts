/**
 * STANDARD API RESPONSE WRAPPER
 *
 * Provides consistent response format across all API endpoints
 * Part of Priority 0: Foundation improvements
 *
 * Created: 2025-10-23
 */

import { NextResponse } from 'next/server';
import { logger } from '@/utils/logger';

// =====================================================================
// TYPES
// =====================================================================

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  metadata?: {
    timestamp: string;
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: string;
  };
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// =====================================================================
// SUCCESS RESPONSES
// =====================================================================

/**
 * Cache configuration presets
 */
export const CACHE_PRESETS = {
  // No caching - always fresh
  NONE: 'no-store, must-revalidate',

  // Short cache - 1 minute CDN, 5 minutes stale-while-revalidate
  SHORT: 's-maxage=60, stale-while-revalidate=300',

  // Medium cache - 5 minutes CDN, 30 minutes stale-while-revalidate
  MEDIUM: 's-maxage=300, stale-while-revalidate=1800',

  // Long cache - 1 hour CDN, 24 hours stale-while-revalidate
  LONG: 's-maxage=3600, stale-while-revalidate=86400',

  // Static - 1 day CDN, 1 week stale-while-revalidate
  STATIC: 's-maxage=86400, stale-while-revalidate=604800',
} as const;

/**
 * Create a successful API response with standard format
 */
export function apiSuccess<T>(
  data: T,
  options?: Omit<ApiSuccessResponse['metadata'], 'timestamp'> & {
    status?: number;
    headers?: HeadersInit;
    cache?: string | keyof typeof CACHE_PRESETS;
  }
): NextResponse<ApiSuccessResponse<T>> {
  const { status, headers, cache, ...metadata } = options || {};
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata,
    },
  };

  // Build headers with cache control if specified
  const responseHeaders = new Headers(headers || {});

  if (cache) {
    const cacheValue =
      typeof cache === 'string' ? cache : CACHE_PRESETS[cache] || CACHE_PRESETS.NONE;
    responseHeaders.set('Cache-Control', cacheValue);
  }

  return NextResponse.json(response, {
    status: status || 200,
    headers: responseHeaders,
  });
}

/**
 * Create a paginated success response
 */
export function apiSuccessPaginated<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): NextResponse<ApiSuccessResponse<T[]>> {
  return apiSuccess(data, { page, limit, total });
}

/**
 * Create a 201 Created response
 */
export function apiCreated<T>(
  data: T,
  metadata?: Omit<ApiSuccessResponse['metadata'], 'timestamp'>
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata,
    },
  };

  return NextResponse.json(response, { status: 201 });
}

/**
 * Create a 204 No Content response
 */
export function apiNoContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

// =====================================================================
// ERROR RESPONSES
// =====================================================================

/**
 * Create a standardized error response
 */
export function apiError(
  message: string,
  code: string = 'INTERNAL_ERROR',
  status: number = 500,
  details?: any
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
    metadata: {
      timestamp: new Date().toISOString(),
    },
  };

  // Log error for monitoring
  logger.error(`API Error [${code}]: ${message}`, { details, status });

  return NextResponse.json(response, { status });
}

/**
 * 400 Bad Request
 */
export function apiBadRequest(
  message: string = 'Bad request',
  details?: any
): NextResponse<ApiErrorResponse> {
  return apiError(message, 'BAD_REQUEST', 400, details);
}

/**
 * 401 Unauthorized
 */
export function apiUnauthorized(
  message: string = 'Unauthorized',
  details?: any
): NextResponse<ApiErrorResponse> {
  return apiError(message, 'UNAUTHORIZED', 401, details);
}

/**
 * 403 Forbidden
 */
export function apiForbidden(
  message: string = 'Forbidden',
  details?: any
): NextResponse<ApiErrorResponse> {
  return apiError(message, 'FORBIDDEN', 403, details);
}

/**
 * 404 Not Found
 */
export function apiNotFound(
  message: string = 'Not found',
  details?: any
): NextResponse<ApiErrorResponse> {
  return apiError(message, 'NOT_FOUND', 404, details);
}

/**
 * 409 Conflict
 */
export function apiConflict(
  message: string = 'Conflict',
  details?: any
): NextResponse<ApiErrorResponse> {
  return apiError(message, 'CONFLICT', 409, details);
}

/**
 * 422 Unprocessable Entity (Validation Error)
 */
export function apiValidationError(
  message: string = 'Validation failed',
  details?: any
): NextResponse<ApiErrorResponse> {
  return apiError(message, 'VALIDATION_ERROR', 422, details);
}

/**
 * 429 Too Many Requests
 */
export function apiRateLimited(
  message: string = 'Too many requests',
  retryAfter?: number
): NextResponse<ApiErrorResponse> {
  const response = apiError(message, 'RATE_LIMITED', 429, { retryAfter });

  if (retryAfter) {
    response.headers.set('Retry-After', retryAfter.toString());
  }

  return response;
}

/**
 * 500 Internal Server Error
 */
export function apiInternalError(
  message: string = 'Internal server error',
  details?: any
): NextResponse<ApiErrorResponse> {
  return apiError(message, 'INTERNAL_ERROR', 500, details);
}

/**
 * 503 Service Unavailable
 */
export function apiServiceUnavailable(
  message: string = 'Service unavailable',
  details?: any
): NextResponse<ApiErrorResponse> {
  return apiError(message, 'SERVICE_UNAVAILABLE', 503, details);
}

// =====================================================================
// UTILITY FUNCTIONS
// =====================================================================

/**
 * Handle standard Supabase errors and convert to API responses
 */
export function handleSupabaseError(error: any): NextResponse<ApiErrorResponse> {
  logger.error('Supabase error', error);

  // Not found
  if (error.code === 'PGRST116') {
    return apiNotFound('Resource not found');
  }

  // Unique constraint violation
  if (error.code === '23505') {
    return apiConflict('Resource already exists');
  }

  // Foreign key violation
  if (error.code === '23503') {
    return apiBadRequest('Invalid reference');
  }

  // Row level security violation
  if (error.code === '42501' || error.message?.includes('row-level security')) {
    return apiForbidden('Access denied');
  }

  // Default to internal error
  return apiInternalError('Database error', {
    code: error.code,
    hint: error.hint,
  });
}

/**
 * Handle validation errors (Zod)
 */
export function handleValidationError(error: any): NextResponse<ApiErrorResponse> {
  if (error.errors && Array.isArray(error.errors)) {
    return apiValidationError('Validation failed', {
      fields: error.errors.map((err: any) => ({
        field: err.path?.join('.'),
        message: err.message,
      })),
    });
  }

  return apiBadRequest('Invalid input', error);
}

/**
 * Catch-all error handler
 */
export function handleApiError(error: any): NextResponse<ApiErrorResponse> {
  // Validation errors (Zod)
  if (error.name === 'ZodError') {
    return handleValidationError(error);
  }

  // Supabase errors
  if (error.code || error.hint) {
    return handleSupabaseError(error);
  }

  // Custom error with status
  if (error.status && error.message) {
    return apiError(error.message, error.code || 'ERROR', error.status);
  }

  // Unknown error
  logger.error('Unhandled API error', error);
  return apiInternalError('An unexpected error occurred');
}

// =====================================================================
// TYPE GUARDS
// =====================================================================

/**
 * Check if response is successful
 */
export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> {
  return response.success === true;
}

/**
 * Check if response is an error
 */
export function isApiError(response: ApiResponse): response is ApiErrorResponse {
  return response.success === false;
}
