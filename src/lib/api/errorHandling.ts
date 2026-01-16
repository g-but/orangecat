/**
 * STRUCTURED ERROR HANDLING SYSTEM
 *
 * Provides comprehensive error handling with:
 * - Structured error codes and messages
 * - Consistent error response format
 * - Proper HTTP status codes
 * - Correlation IDs for debugging
 * - Security-conscious error exposure
 *
 * 🛡️ SECURITY: Never exposes internal system details
 * 🔍 DEBUGGING: Comprehensive logging with correlation IDs
 * 📊 MONITORING: Structured error data for analytics
 */

import { NextResponse } from 'next/server'
import { logger } from '@/utils/logger'

/**
 * Error codes for consistent error handling across the application
 */
export enum ErrorCode {
  // Authentication & Authorization
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_INVALID = 'AUTH_INVALID',
  AUTH_EXPIRED = 'AUTH_EXPIRED',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_INSUFFICIENT_PERMISSIONS',

  // Validation Errors
  VALIDATION_MISSING_FIELD = 'VALIDATION_MISSING_FIELD',
  VALIDATION_INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT',
  VALIDATION_INVALID_VALUE = 'VALIDATION_INVALID_VALUE',
  VALIDATION_TOO_LONG = 'VALIDATION_TOO_LONG',
  VALIDATION_TOO_SHORT = 'VALIDATION_TOO_SHORT',

  // Resource Errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',

  // Business Logic
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INVALID_OPERATION = 'INVALID_OPERATION',

  // System Errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
}

/**
 * Structured error class with correlation tracking
 */
export class ApiError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly correlationId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public readonly details?: Record<string, any>
  public readonly timestamp: string

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number,
    options?: {
      correlationId?: string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      details?: Record<string, any>
      cause?: Error
    }
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.statusCode = statusCode
    this.correlationId = options?.correlationId || this.generateCorrelationId()
    this.details = options?.details
    this.timestamp = new Date().toISOString()

    // Log the error for debugging (internal only)
    logger.error(`API Error [${this.correlationId}]: ${this.code}`, {
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      stack: this.stack
    }, 'ApiError')

    // Maintain proper stack trace
    if (options?.cause) {
      this.cause = options.cause
    }
  }

  private generateCorrelationId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Convert to safe response data (removes internal details)
   */
  toResponseData(): ApiErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.getUserSafeMessage(),
        correlationId: this.correlationId,
        timestamp: this.timestamp
      }
    }
  }

  private getUserSafeMessage(): string {
    // Return user-safe messages that don't expose internal details
    switch (this.code) {
      case ErrorCode.AUTH_REQUIRED:
        return 'Authentication required'
      case ErrorCode.AUTH_INVALID:
        return 'Invalid authentication credentials'
      case ErrorCode.AUTH_EXPIRED:
        return 'Authentication expired'
      case ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS:
        return 'Insufficient permissions for this operation'
      case ErrorCode.VALIDATION_MISSING_FIELD:
        return 'Required field is missing'
      case ErrorCode.VALIDATION_INVALID_FORMAT:
        return 'Invalid data format provided'
      case ErrorCode.VALIDATION_INVALID_VALUE:
        return 'Invalid value provided'
      case ErrorCode.RESOURCE_NOT_FOUND:
        return 'Requested resource not found'
      case ErrorCode.RESOURCE_ALREADY_EXISTS:
        return 'Resource already exists'
      case ErrorCode.RATE_LIMIT_EXCEEDED:
        return 'Rate limit exceeded. Please try again later.'
      case ErrorCode.TOO_MANY_REQUESTS:
        return 'Too many requests. Please slow down.'
      case ErrorCode.DATABASE_ERROR:
        return 'Database operation failed'
      case ErrorCode.EXTERNAL_SERVICE_ERROR:
        return 'External service temporarily unavailable'
      case ErrorCode.INTERNAL_SERVER_ERROR:
        return 'Internal server error occurred'
      case ErrorCode.SERVICE_UNAVAILABLE:
        return 'Service temporarily unavailable'
      default:
        return 'An unexpected error occurred'
    }
  }
}

/**
 * Structured API error response format
 */
export interface ApiErrorResponse {
  error: {
    code: ErrorCode
    message: string
    correlationId: string
    timestamp: string
  }
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: ApiError | Error | string,
  statusCode?: number
): NextResponse<ApiErrorResponse> {
  let apiError: ApiError

  if (error instanceof ApiError) {
    apiError = error
  } else if (error instanceof Error) {
    // Convert unknown errors to structured errors
    apiError = new ApiError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      error.message,
      statusCode || 500,
      { cause: error }
    )
  } else {
    // Convert string errors
    apiError = new ApiError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      error,
      statusCode || 500
    )
  }

  const responseData = apiError.toResponseData()

  return NextResponse.json(responseData, {
    status: apiError.statusCode,
    headers: {
      'X-Correlation-ID': apiError.correlationId,
      'Content-Type': 'application/json'
    }
  })
}

/**
 * Helper functions for common error scenarios
 */
export const ErrorHelpers = {
  authenticationRequired: (correlationId?: string): ApiError => {
    return new ApiError(
      ErrorCode.AUTH_REQUIRED,
      'Authentication required',
      401,
      { correlationId }
    )
  },

  validationError: (field: string, reason: string, correlationId?: string): ApiError => {
    const message = `Validation failed for ${field}: ${reason}`
    return new ApiError(
      ErrorCode.VALIDATION_INVALID_VALUE,
      message,
      400,
      { correlationId, details: { field, reason } }
    )
  },

  resourceNotFound: (resource: string, correlationId?: string): ApiError => {
    const message = `${resource} not found`
    return new ApiError(
      ErrorCode.RESOURCE_NOT_FOUND,
      message,
      404,
      { correlationId, details: { resource } }
    )
  },

  rateLimitExceeded: (retryAfterSeconds: number = 60, correlationId?: string): ApiError => {
    return new ApiError(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      `Rate limit exceeded. Retry after ${retryAfterSeconds} seconds.`,
      429,
      {
        correlationId,
        details: { retryAfterSeconds }
      }
    )
  },

  databaseError: (operation: string, correlationId?: string): ApiError => {
    return new ApiError(
      ErrorCode.DATABASE_ERROR,
      'Database operation failed',
      500,
      {
        correlationId,
        details: { operation }
      }
    )
  },

  insufficientPermissions: (resource: string, correlationId?: string): ApiError => {
    const message = `Insufficient permissions to access ${resource}`
    return new ApiError(
      ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS,
      message,
      403,
      {
        correlationId,
        details: { resource }
      }
    )
  }
}

/**
 * Wrap async functions with structured error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorContext?: {
    operation?: string
    correlationId?: string
    fallbackErrorCode?: ErrorCode
    fallbackStatusCode?: number
  }
): Promise<T> {
  const { operation: operationName, correlationId, fallbackErrorCode, fallbackStatusCode } = errorContext || {}

  try {
    return await operation()
  } catch (error) {
    const contextInfo = {
      operation: operationName,
      correlationId,
      timestamp: new Date().toISOString()
    }

    if (error instanceof ApiError) {
      // Re-throw structured errors as-is
      throw error
    }

    // Log the error with context
    logger.error(`Operation failed: ${operationName || 'unknown'}`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ...contextInfo
    }, 'ErrorHandler')

    // Convert to structured error
    const fallbackCode = fallbackErrorCode || ErrorCode.INTERNAL_SERVER_ERROR
    const fallbackStatus = fallbackStatusCode || 500

    throw new ApiError(
      fallbackCode,
      'Operation failed',
      fallbackStatus,
      {
        correlationId,
        details: contextInfo
      }
    )
  }
}

/**
 * Type guard to check if response is an error response
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isErrorResponse(response: any): response is ApiErrorResponse {
  return response && response.error && response.error.code && response.error.message
}

/**
 * Extract correlation ID from headers
 */
export function getCorrelationIdFromHeaders(headers: Headers): string | undefined {
  return headers.get('X-Correlation-ID') || undefined
}

/**
 * Add correlation ID to headers
 */
export function addCorrelationIdToHeaders(headers: Headers, correlationId: string): void {
  headers.set('X-Correlation-ID', correlationId)
}








