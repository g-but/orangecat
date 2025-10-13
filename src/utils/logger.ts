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
    return LOG_LEVELS[level] >= LOG_LEVELS[LOGGER_CONFIG.activeLevel]
  }

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
        console.error(JSON.stringify(entry))
      }
      return
    }

    // Development logging with colors and formatting
    const prefix = `[${timestamp}] ${level.toUpperCase()}`
    const sourceInfo = source ? ` (${source})` : ''
    
    switch (level) {
      case 'debug':
        break
      case 'info':
        break
      case 'warn':
        break
      case 'error':
        break
    }
  }

  debug(message: string, data?: any, source?: string): void {
    if (!this.shouldLog('debug')) return
    this.output(this.formatLogEntry('debug', message, data, source))
  }

  info(message: string, data?: any, source?: string): void {
    if (!this.shouldLog('info')) return
    this.output(this.formatLogEntry('info', message, data, source))
  }

  warn(message: string, data?: any, source?: string): void {
    if (!this.shouldLog('warn')) return
    this.output(this.formatLogEntry('warn', message, data, source))
  }

  error(message: string, data?: any, source?: string): void {
    if (!this.shouldLog('error')) return
    this.output(this.formatLogEntry('error', message, data, source))
  }

  // Specialized logging methods
  supabase(message: string, data?: any): void {
    this.info(`[Supabase] ${message}`, data, 'supabase')
  }

  auth(message: string, data?: any): void {
    this.info(`[Auth] ${message}`, data, 'auth')
  }

  api(message: string, data?: any): void {
    this.info(`[API] ${message}`, data, 'api')
  }

  database(message: string, data?: any): void {
    this.info(`[Database] ${message}`, data, 'database')
  }

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
export function logAuth(message: string, data?: any): void {
  logger.auth(message, data)
}

/**
 * @deprecated Use logger.supabase() instead
 */
export function logSupabase(message: string, data?: any): void {
  logger.supabase(message, data)
}

/**
 * @deprecated Use logger.info() or logger.debug() instead
 */
export function logProfile(message: string, data?: any): void {
  logger.info(`[Profile] ${message}`, data)
}

/**
 * @deprecated Use logger.performance() instead
 */
export function logPerformance(metricName: string, value: number): void {
  logger.performance(`${metricName}: ${value}ms`)
} 