type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  context?: string
  message: string
  data?: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'

  private formatMessage(level: LogLevel, context: string | undefined, message: string): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? `[${context}]` : ''
    return `${timestamp} ${level.toUpperCase()} ${contextStr} ${message}`
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log warnings and errors
    if (this.isProduction) {
      return level === 'warn' || level === 'error'
    }
    // In development, log everything
    return true
  }

  debug(message: string, data?: any, context?: string): void {
    if (!this.shouldLog('debug')) return
    
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', context, message), data ? data : '')
    }
  }

  info(message: string, data?: any, context?: string): void {
    if (!this.shouldLog('info')) return
    
    if (this.isDevelopment) {
      console.info(this.formatMessage('info', context, message), data ? data : '')
    }
  }

  warn(message: string, data?: any, context?: string): void {
    if (!this.shouldLog('warn')) return
    
    console.warn(this.formatMessage('warn', context, message), data ? data : '')
  }

  error(message: string, error?: any, context?: string): void {
    if (!this.shouldLog('error')) return
    
    console.error(this.formatMessage('error', context, message), error ? error : '')
  }

  // Performance logging
  performance(metricName: string, value: number, context?: string): void {
    if (this.isDevelopment) {
      this.debug(`Performance: ${metricName}: ${value}ms`, undefined, context || 'Performance')
    }
  }

  // Auth-specific logging helper
  auth(message: string, data?: any): void {
    this.debug(message, data, 'Auth')
  }

  // Profile-specific logging helper  
  profile(message: string, data?: any): void {
    this.debug(message, data, 'Profile')
  }

  // Supabase-specific logging helper
  supabase(message: string, data?: any): void {
    this.debug(message, data, 'Supabase')
  }
}

// Create singleton instance
export const logger = new Logger()

// Convenience exports for common patterns
export const logAuth = (message: string, data?: any) => logger.auth(message, data)
export const logProfile = (message: string, data?: any) => logger.profile(message, data)
export const logSupabase = (message: string, data?: any) => logger.supabase(message, data)
export const logPerformance = (metricName: string, value: number) => logger.performance(metricName, value) 