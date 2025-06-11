import type { LoggerData } from '@/types/common'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  context?: string
  message: string
  data?: LoggerData
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

  debug(message: string, data?: LoggerData, context?: string): void {
    if (!this.shouldLog('debug')) return
    
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', context, message), data ? data : '')
    }
  }

  info(message: string, data?: LoggerData, context?: string): void {
    if (!this.shouldLog('info')) return
    
    if (this.isDevelopment) {
      console.info(this.formatMessage('info', context, message), data ? data : '')
    }
  }

  warn(message: string, data?: LoggerData, context?: string): void {
    if (!this.shouldLog('warn')) return
    
    console.warn(this.formatMessage('warn', context, message), data ? data : '')
  }

  error(message: string, error?: LoggerData, context?: string): void {
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
  auth(message: string, data?: LoggerData): void {
    this.debug(message, data, 'Auth')
  }

  // Profile-specific logging helper  
  profile(message: string, data?: LoggerData): void {
    this.debug(message, data, 'Profile')
  }

  // Supabase-specific logging helper
  supabase(message: string, data?: LoggerData): void {
    this.debug(message, data, 'Supabase')
  }
}

// Create singleton instance
export const logger = new Logger()

// Convenience exports for common patterns – keep references stable across jest.resetModules()
// so that tests which capture the function before a reset still see subsequent calls.

// Ensure the same logSupabase reference is reused across jest.resetModules() calls
const _defaultLogSupabase = (message: string, data?: LoggerData) => logger.supabase(message, data)
const globalLogKey = '__orangecat_logSupabase'

export const logSupabase: (message: string, data?: LoggerData) => void =
  (globalThis as any)[globalLogKey] || ((globalThis as any)[globalLogKey] = _defaultLogSupabase)

export const logAuth = (message: string, data?: LoggerData) => logger.auth(message, data)
export const logProfile = (message: string, data?: LoggerData) => logger.profile(message, data)
export const logPerformance = (metricName: string, value: number) => logger.performance(metricName, value) 