/**
 * PRODUCTION-SAFE LOGGER
 * 
 * Replaces console.log statements with proper logging
 * that's safe for production use and provides structured logging.
 * 
 * Created: 2025-06-30
 * Purpose: Eliminate console.log statements and provide structured logging
 */

// =====================================================================
// 🎯 LOGGER TYPES
// =====================================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any
  source?: string
}

// =====================================================================
// 🔧 LOGGER CONFIGURATION
// =====================================================================

const LOGGER_CONFIG = {
  // Only log errors and warnings in production
  productionLevel: 'warn' as LogLevel,
  
  // Log everything in development
  developmentLevel: 'debug' as LogLevel,
  
  // Get current environment
  get environment() {
    return process.env.NODE_ENV || 'development'
  },
  
  // Get active log level
  get activeLevel() {
    return this.environment === 'production' ? this.productionLevel : this.developmentLevel
  }
}

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
}

// =====================================================================
// 🔧 LOGGER IMPLEMENTATION
// =====================================================================

class Logger {
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[LOGGER_CONFIG.activeLevel as LogLevel]
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private formatLogEntry(level: LogLevel, message: string, data?: any, source?: string): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      source
    }
  }

  private output(entry: LogEntry): void {
    const { timestamp, level, message, data, source } = entry

    // In production, use structured logging
    if (LOGGER_CONFIG.environment === 'production') {
      // Send to proper logging service in production
      // For now, use console for critical errors only
      if (level === 'error') {
        // eslint-disable-next-line no-console
        console.error(JSON.stringify(entry))
      }
      return
    }

    // Development logging with colors and formatting
    const prefix = `[${timestamp}] ${level.toUpperCase()}`
    const sourceInfo = source ? ` (${source})` : ''
    const payload = data !== undefined ? data : ''

    switch (level) {
      case 'debug':
        // eslint-disable-next-line no-console
        console.debug(prefix + sourceInfo + ':', message, payload)
        return
      case 'info':
        // eslint-disable-next-line no-console
        console.info(prefix + sourceInfo + ':', message, payload)
        return
      case 'warn':
        // eslint-disable-next-line no-console
        console.warn(prefix + sourceInfo + ':', message, payload)
        return
      case 'error':
        // eslint-disable-next-line no-console
        console.error(prefix + sourceInfo + ':', message, payload)
        return
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debug(message: string, data?: any, source?: string): void {
    if (!this.shouldLog('debug')) {return}
    this.output(this.formatLogEntry('debug', message, data, source))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info(message: string, data?: any, source?: string): void {
    if (!this.shouldLog('info')) {return}
    this.output(this.formatLogEntry('info', message, data, source))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warn(message: string, data?: any, source?: string): void {
    if (!this.shouldLog('warn')) {return}
    this.output(this.formatLogEntry('warn', message, data, source))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error(message: string, data?: any, source?: string): void {
    if (!this.shouldLog('error')) {return}
    this.output(this.formatLogEntry('error', message, data, source))
  }

  // Specialized logging methods
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase(message: string, data?: any): void {
    this.info(`[Supabase] ${message}`, data, 'supabase')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  auth(message: string, data?: any): void {
    this.info(`[Auth] ${message}`, data, 'auth')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  api(message: string, data?: any): void {
    this.info(`[API] ${message}`, data, 'api')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  database(message: string, data?: any): void {
    this.info(`[Database] ${message}`, data, 'database')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  performance(message: string, data?: any): void {
    this.debug(`[Performance] ${message}`, data, 'performance')
  }
}

// =====================================================================
// 🔧 SINGLETON EXPORT
// =====================================================================

export const logger = new Logger()

// =====================================================================
// 🔧 HELPER FUNCTIONS
// =====================================================================

/**
 * Migration helper to replace console.log calls
 * Use this to gradually replace console.log throughout the codebase
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function safeLog(message: string, data?: any, level: LogLevel = 'debug'): void {
  logger[level](message, data)
}

/**
 * Error boundary logger
 */
export function logError(error: Error, context?: string): void {
  logger.error(
    `Error in ${context || 'application'}`, 
    {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    context
  )
}

/**
 * Performance timing logger
 */
export function logTiming(operation: string, startTime: number): void {
  const endTime = Date.now()
  const duration = endTime - startTime
  logger.performance(`${operation} completed in ${duration}ms`)
}

// =====================================================================
// 🔄 BACKWARD COMPATIBILITY - OLD LOGGER FUNCTIONS
// =====================================================================
// TODO: Gradually migrate these to use logger.auth(), logger.supabase(), etc.

/**
 * @deprecated Use logger.auth() instead
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function logAuth(message: string, data?: any): void {
  logger.auth(message, data)
}

/**
 * @deprecated Use logger.supabase() instead
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function logSupabase(message: string, data?: any): void {
  logger.supabase(message, data)
}

/**
 * @deprecated Use logger.info() or logger.debug() instead
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function logProfile(message: string, data?: any): void {
  logger.info(`[Profile] ${message}`, data)
}

/**
 * @deprecated Use logger.performance() instead
 */
export function logPerformance(metricName: string, value: number): void {
  logger.performance(`${metricName}: ${value}ms`)
} 