import { NextResponse } from 'next/server'
import { logger } from '@/utils/logger'

/**
 * Standardized API Response Helpers
 * 
 * Eliminates DRY violations by providing consistent error and success responses.
 * Used across all API routes for consistent response formatting.
 * 
 * ♻️ REFACTORED: Eliminates ~35 instances of similar error responses
 */

// Standard error types
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
  UNSUPPORTED_MEDIA_TYPE: 'UNSUPPORTED_MEDIA_TYPE'
} as const

// Standard HTTP status codes
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
  SERVICE_UNAVAILABLE: 503
} as const

interface ErrorResponseData {
  error: string
  type?: string
  details?: any
  timestamp?: string
  requestId?: string
}

interface SuccessResponseData {
  success?: boolean
  data?: any
  message?: string
  meta?: any
  timestamp?: string
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  message: string,
  status: number,
  type?: string,
  details?: any
): NextResponse {
  const responseData: ErrorResponseData = {
    error: message,
    timestamp: new Date().toISOString()
  }

  if (type) {responseData.type = type}
  if (details) {responseData.details = details}

  return NextResponse.json(responseData, { status })
}

/**
 * Create standardized success response
 */
export function createSuccessResponse(
  data?: any,
  status: number = HttpStatus.OK,
  message?: string,
  meta?: any
): NextResponse {
  const responseData: SuccessResponseData = {
    success: true,
    timestamp: new Date().toISOString()
  }

  if (data !== undefined) {responseData.data = data}
  if (message) {responseData.message = message}
  if (meta) {responseData.meta = meta}

  return NextResponse.json(responseData, { status })
}

// Pre-configured error responses for common scenarios
export const ApiResponses = {
  // Authentication & Authorization
  authenticationRequired: () => createErrorResponse(
    'Authentication required',
    HttpStatus.UNAUTHORIZED,
    ErrorTypes.AUTHENTICATION_REQUIRED
  ),

  authorizationFailed: (message = 'Insufficient permissions') => createErrorResponse(
    message,
    HttpStatus.FORBIDDEN,
    ErrorTypes.AUTHORIZATION_FAILED
  ),

  // Validation
  validationError: (message: string, details?: any) => createErrorResponse(
    message,
    HttpStatus.BAD_REQUEST,
    ErrorTypes.VALIDATION_ERROR,
    details
  ),

  badRequest: (message = 'Bad request') => createErrorResponse(
    message,
    HttpStatus.BAD_REQUEST,
    ErrorTypes.BAD_REQUEST
  ),

  // Resource handling
  notFound: (resource = 'Resource') => createErrorResponse(
    `${resource} not found`,
    HttpStatus.NOT_FOUND,
    ErrorTypes.NOT_FOUND
  ),

  conflict: (message = 'Resource conflict') => createErrorResponse(
    message,
    HttpStatus.CONFLICT,
    ErrorTypes.CONFLICT
  ),

  // Rate limiting
  rateLimitExceeded: (message = 'Rate limit exceeded') => createErrorResponse(
    message,
    HttpStatus.RATE_LIMITED,
    ErrorTypes.RATE_LIMIT_EXCEEDED
  ),

  // Server errors
  internalServerError: (message = 'Internal server error') => createErrorResponse(
    message,
    HttpStatus.INTERNAL_SERVER_ERROR,
    ErrorTypes.INTERNAL_SERVER_ERROR
  ),

  serviceUnavailable: (message = 'Service temporarily unavailable') => createErrorResponse(
    message,
    HttpStatus.SERVICE_UNAVAILABLE
  ),

  // File upload errors
  fileTooLarge: (maxSize?: string) => createErrorResponse(
    `File too large${maxSize ? `. Maximum size: ${maxSize}` : ''}`,
    HttpStatus.PAYLOAD_TOO_LARGE,
    ErrorTypes.FILE_TOO_LARGE
  ),

  unsupportedMediaType: (supportedTypes?: string[]) => createErrorResponse(
    `Unsupported media type${supportedTypes ? `. Supported: ${supportedTypes.join(', ')}` : ''}`,
    HttpStatus.UNSUPPORTED_MEDIA_TYPE,
    ErrorTypes.UNSUPPORTED_MEDIA_TYPE
  ),

  // Success responses
  success: (data?: any, message?: string) => createSuccessResponse(
    data,
    HttpStatus.OK,
    message
  ),

  created: (data?: any, message?: string) => createSuccessResponse(
    data,
    HttpStatus.CREATED,
    message || 'Resource created successfully'
  ),

  accepted: (message = 'Request accepted for processing') => createSuccessResponse(
    undefined,
    HttpStatus.ACCEPTED,
    message
  ),

  noContent: () => new NextResponse(null, { status: HttpStatus.NO_CONTENT })
}

/**
 * Utility to handle async operations with standardized error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorMessage?: string
): Promise<T | NextResponse> {
  try {
    return await operation()
  } catch (error: any) {
    logger.error('API operation failed', { error: error?.message, stack: error?.stack }, 'API')
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
      return ApiResponses.validationError(error.message, error.details)
    }
    
    if (error.code === 'PGRST116') { // Supabase not found
      return ApiResponses.notFound()
    }
    
    if (error.status === 429) {
      return ApiResponses.rateLimitExceeded()
    }
    
    return ApiResponses.internalServerError(errorMessage)
  }
}