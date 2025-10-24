/**
 * LEGACY ERROR CLASSES - DEPRECATED
 *
 * These classes are maintained for backward compatibility.
 * New code should use the standardResponse helpers from @/lib/api/standardResponse
 *
 * Migration: Replace throws with direct returns using apiUnauthorized(), apiNotFound(), etc.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class AuthError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTH_ERROR');
    this.name = 'AuthError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

import { errorHandler, createErrorContext } from './error-handler';
import {
  apiUnauthorized,
  apiNotFound,
  apiConflict,
  apiValidationError,
  apiInternalError,
  handleApiError as handleApiErrorNew,
  type ApiErrorResponse,
} from './api/standardResponse';
import { NextResponse } from 'next/server';

/**
 * Handle API errors using standardized response format
 *
 * This is a compatibility wrapper that converts old error classes
 * to the new standardResponse format
 */
export function handleApiError(error: unknown, request?: any): NextResponse<ApiErrorResponse> {
  const context = createErrorContext(request);

  // Use the new error handler for consistent logging and processing
  errorHandler.handle(error as Error, context);

  // Handle custom error classes (legacy)
  if (error instanceof AuthError) {
    return apiUnauthorized(error.message);
  }

  if (error instanceof NotFoundError) {
    return apiNotFound(error.message);
  }

  if (error instanceof ValidationError) {
    return apiValidationError(error.message, error.field ? { field: error.field } : undefined);
  }

  if (error instanceof ConflictError) {
    return apiConflict(error.message);
  }

  if (error instanceof ApiError) {
    return apiInternalError(error.message, { code: error.code });
  }

  // Use the new comprehensive error handler for everything else
  return handleApiErrorNew(error);
}
