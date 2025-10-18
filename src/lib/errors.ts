export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, public field?: string) {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class AuthError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTH_ERROR')
    this.name = 'AuthError'
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT')
    this.name = 'ConflictError'
  }
}

import { errorHandler, createErrorContext } from './error-handler'

export function handleApiError(error: unknown, request?: any): Response {
  const context = createErrorContext(request)

  // Use the new error handler for consistent logging and processing
  errorHandler.handle(error as Error, context)

  // For API responses, still return the old format for backward compatibility
  if (error instanceof ApiError) {
    return new Response(
      JSON.stringify({
        error: error.message,
        code: error.code,
        ...(error instanceof ValidationError && error.field && { field: error.field })
      }),
      {
        status: error.statusCode,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY'
        }
      }
    )
  }

  // Unknown error - don't expose internal details
  return new Response(
    JSON.stringify({
      error: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR'
    }),
    {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      }
    }
  )
}
