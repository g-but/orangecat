/**
 * COMPREHENSIVE ERROR HANDLING SYSTEM
 *
 * Provides consistent error handling patterns across the application:
 * - Centralized error types and codes
 * - Proper error logging and monitoring
 * - User-friendly error messages
 * - Error recovery strategies
 * - Performance impact tracking
 *
 * Created: 2025-10-17
 * Last Modified: 2025-10-17
 */

import { logger } from '@/utils/logger'

// ==================== ERROR TYPES & CODES ====================

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATABASE = 'database',
  NETWORK = 'network',
  BUSINESS_LOGIC = 'business_logic',
  EXTERNAL_SERVICE = 'external_service',
  SYSTEM = 'system'
}

export interface ErrorContext {
  userId?: string
  requestId?: string
  ipAddress?: string
  userAgent?: string
  url?: string
  method?: string
  timestamp?: string
  additionalData?: Record<string, unknown>
  // Common additional error context fields
  field?: string
  promise?: string
  originalError?: string
}

// Base error class with enhanced context
export class AppError extends Error {
  public readonly code: string
  public readonly category: ErrorCategory
  public readonly severity: ErrorSeverity
  public readonly context?: ErrorContext
  public readonly isOperational: boolean
  public readonly retryable: boolean

  constructor(
    message: string,
    code: string,
    category: ErrorCategory = ErrorCategory.SYSTEM,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: ErrorContext,
    isOperational: boolean = true,
    retryable: boolean = false
  ) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.category = category
    this.severity = severity
    this.context = context
    this.isOperational = isOperational
    this.retryable = retryable

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor)
  }
}

// Specific error types
export class ValidationError extends AppError {
  constructor(message: string, field?: string, context?: ErrorContext) {
    super(
      message,
      'VALIDATION_ERROR',
      ErrorCategory.VALIDATION,
      ErrorSeverity.LOW,
      { ...context, field },
      true,
      false
    )
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', context?: ErrorContext) {
    super(
      message,
      'AUTHENTICATION_ERROR',
      ErrorCategory.AUTHENTICATION,
      ErrorSeverity.HIGH,
      context,
      true,
      false
    )
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied', context?: ErrorContext) {
    super(
      message,
      'AUTHORIZATION_ERROR',
      ErrorCategory.AUTHORIZATION,
      ErrorSeverity.HIGH,
      context,
      true,
      false
    )
    this.name = 'AuthorizationError'
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error, context?: ErrorContext) {
    super(
      message,
      'DATABASE_ERROR',
      ErrorCategory.DATABASE,
      ErrorSeverity.HIGH,
      context,
      true,
      true // Database errors are often retryable
    )
    this.name = 'DatabaseError'

    // Log original database error for debugging
    if (originalError) {
      logger.error('Database error occurred', {
        originalMessage: originalError.message,
        originalStack: originalError.stack,
        ...context
      }, 'DatabaseError')
    }
  }
}

export class NetworkError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(
      message,
      'NETWORK_ERROR',
      ErrorCategory.NETWORK,
      ErrorSeverity.MEDIUM,
      context,
      true,
      true // Network errors are retryable
    )
    this.name = 'NetworkError'
  }
}

export class BusinessLogicError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(
      message,
      'BUSINESS_LOGIC_ERROR',
      ErrorCategory.BUSINESS_LOGIC,
      ErrorSeverity.MEDIUM,
      context,
      true,
      false
    )
    this.name = 'BusinessLogicError'
  }
}

// ==================== ERROR HANDLER ====================

export class ErrorHandler {
  private static instance: ErrorHandler
  private errorCounts = new Map<string, { count: number; lastSeen: number }>()
  private maxErrorsPerMinute = 100

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  /**
   * Handle and process any error with proper logging and context
   */
  handle(error: Error | AppError, context?: ErrorContext): void {
    // Enhanced error with context if not already an AppError
    const enhancedError = error instanceof AppError
      ? error
      : new AppError(
          error.message,
          'UNKNOWN_ERROR',
          ErrorCategory.SYSTEM,
          ErrorSeverity.MEDIUM,
          context
        )

    // Check for error rate limiting
    if (this.shouldRateLimitError(enhancedError)) {
      logger.warn('Error rate limit exceeded, suppressing log', {
        errorCode: enhancedError.code,
        errorCategory: enhancedError.category
      }, 'ErrorHandler')
      return
    }

    // Log error with appropriate level based on severity
    const logData = {
      error: enhancedError.message,
      code: enhancedError.code,
      category: enhancedError.category,
      severity: enhancedError.severity,
      context: enhancedError.context,
      stack: enhancedError.stack,
      isOperational: enhancedError.isOperational,
      retryable: enhancedError.retryable
    }

    switch (enhancedError.severity) {
      case ErrorSeverity.CRITICAL:
        logger.error('Critical error occurred', logData, 'ErrorHandler')
        break
      case ErrorSeverity.HIGH:
        logger.error('High severity error occurred', logData, 'ErrorHandler')
        break
      case ErrorSeverity.MEDIUM:
        logger.warn('Medium severity error occurred', logData, 'ErrorHandler')
        break
      case ErrorSeverity.LOW:
        logger.info('Low severity error occurred', logData, 'ErrorHandler')
        break
    }

    // Track error metrics
    this.trackErrorMetrics(enhancedError)

    // Send to monitoring service if critical
    if (enhancedError.severity === ErrorSeverity.CRITICAL) {
      this.alertMonitoring(enhancedError)
    }
  }

  /**
   * Convert error to user-friendly response
   */
  toUserResponse(error: Error | AppError): {
    success: false
    error: string
    code: string
    retryable?: boolean
  } {
    const appError = error instanceof AppError ? error : new AppError(
      error.message,
      'UNKNOWN_ERROR',
      ErrorCategory.SYSTEM,
      ErrorSeverity.MEDIUM
    )

    return {
      success: false,
      error: this.getUserFriendlyMessage(appError),
      code: appError.code,
      retryable: appError.retryable
    }
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyMessage(error: AppError): string {
    switch (error.category) {
      case ErrorCategory.VALIDATION:
        return 'Please check your input and try again.'
      case ErrorCategory.AUTHENTICATION:
        return 'Please sign in to continue.'
      case ErrorCategory.AUTHORIZATION:
        return 'You don\'t have permission to perform this action.'
      case ErrorCategory.DATABASE:
        return 'We\'re experiencing technical difficulties. Please try again later.'
      case ErrorCategory.NETWORK:
        return 'Network error occurred. Please check your connection and try again.'
      case ErrorCategory.BUSINESS_LOGIC:
        return error.message // Business logic errors often have specific user messages
      case ErrorCategory.EXTERNAL_SERVICE:
        return 'External service unavailable. Please try again later.'
      default:
        return 'Something went wrong. Please try again.'
    }
  }

  /**
   * Check if error should be rate limited
   */
  private shouldRateLimitError(error: AppError): boolean {
    const key = `${error.category}:${error.code}`
    const now = Date.now()
    const existing = this.errorCounts.get(key)

    if (!existing) {
      this.errorCounts.set(key, { count: 1, lastSeen: now })
      return false
    }

    // Reset count if more than a minute has passed
    if (now - existing.lastSeen > 60000) {
      this.errorCounts.set(key, { count: 1, lastSeen: now })
      return false
    }

    // Rate limit if too many errors in the last minute
    if (existing.count >= this.maxErrorsPerMinute) {
      return true
    }

    existing.count++
    return false
  }

  /**
   * Track error metrics for monitoring
   */
  private trackErrorMetrics(error: AppError): void {
    // In a real application, this would send metrics to a monitoring service
    // For now, we'll just track in memory
    const key = `${error.category}:${error.code}`
    this.errorCounts.set(key, {
      count: (this.errorCounts.get(key)?.count || 0) + 1,
      lastSeen: Date.now()
    })
  }

  /**
   * Send critical errors to monitoring service
   */
  private alertMonitoring(error: AppError): void {
    // In production, this would send to services like Sentry, DataDog, etc.
    logger.error('Critical error alert sent to monitoring', {
      errorCode: error.code,
      errorMessage: error.message,
      context: error.context
    }, 'ErrorHandler')
  }
}

// ==================== UTILITY FUNCTIONS ====================

export function handleAsyncError<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      const errorHandler = ErrorHandler.getInstance()
      errorHandler.handle(error as Error)
      throw error
    }
  }
}

export function createErrorContext(request?: any): ErrorContext {
  return {
    userId: request?.user?.id,
    requestId: request?.headers?.['x-request-id'],
    ipAddress: request?.headers?.['x-forwarded-for'] || request?.ip,
    userAgent: request?.headers?.['user-agent'],
    url: request?.url,
    method: request?.method,
    timestamp: new Date().toISOString()
  }
}

// ==================== GLOBAL ERROR BOUNDARY ====================

export function setupGlobalErrorHandlers(): void {
  const errorHandler = ErrorHandler.getInstance()

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    const error = reason instanceof Error ? reason : new Error(String(reason))
    errorHandler.handle(new AppError(
      'Unhandled promise rejection',
      'UNHANDLED_PROMISE_REJECTION',
      ErrorCategory.SYSTEM,
      ErrorSeverity.CRITICAL,
      { promise: promise.toString() }
    ))
  })

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    errorHandler.handle(new AppError(
      'Uncaught exception',
      'UNCAUGHT_EXCEPTION',
      ErrorCategory.SYSTEM,
      ErrorSeverity.CRITICAL,
      { originalError: error.message }
    ))

    // Gracefully shutdown in production
    if (process.env.NODE_ENV === 'production') {
      process.exit(1)
    }
  })
}

// ==================== EXPORTS ====================

export const errorHandler = ErrorHandler.getInstance()
