/**
 * CONSOLE LOG CLEANUP UTILITY
 * 
 * Security hardening: Remove all console.log statements for production
 * Prevents sensitive information disclosure in production logs
 * 
 * Created: 2025-01-14
 * Last Modified: 2025-01-14
 * Last Modified Summary: Production security - console log removal
 */

import { logger } from '@/utils/logger'

/**
 * Production-safe console replacement
 * Replaces console.log with proper logger in production
 */
export class ProductionConsole {
  private static isProduction = process.env.NODE_ENV === 'production'

  /**
   * Safe logging that uses proper logger in production
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static log(...args: any[]): void {
    if (this.isProduction) {
      // In production, use proper logger instead of console.log
      logger.info('Console output', { args }, 'Console')
    } else {
      // In development, allow console.log
      // eslint-disable-next-line no-console
      console.log(...args)
    }
  }

  /**
   * Safe warning that uses proper logger in production
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static warn(...args: any[]): void {
    if (this.isProduction) {
      logger.warn('Console warning', { args }, 'Console')
    } else {
      // eslint-disable-next-line no-console
      console.warn(...args)
    }
  }

  /**
   * Safe error logging (always use proper logger)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static error(...args: any[]): void {
    logger.error('Console error', { args }, 'Console')
  }

  /**
   * Initialize production console replacement
   */
  static initialize(): void {
    if (this.isProduction) {
      // Replace global console methods in production
      global.console.log = this.log.bind(this)
      global.console.warn = this.warn.bind(this)
      // Keep console.error for critical issues
    }
  }
}

/**
 * List of console.log statements found in codebase that need attention
 */
export const CONSOLE_LOG_AUDIT = {
  // Test files (acceptable - for test output)
  testFiles: [
    'src/utils/__tests__/bitcoinValidation.test.ts',
    'src/app/api/__tests__/file-upload-security.test.ts',
    'src/app/api/__tests__/profile-security-enhanced.test.ts',
    'src/app/api/__tests__/profile-security.test.ts',
    'src/app/api/__tests__/funding-security.test.ts',
    'src/services/performance/performance-test.ts'
  ],

  // Development utilities (acceptable - for development)
  devUtilities: [
    'src/utils/dev-seed.ts',
    'src/utils/debugUtils.ts',
    'scripts/cleanup-branches.js',
    'scripts/fix-profiles-schema.js',
    'scripts/get_current_datetime.js',
    'scripts/performance-check.js'
  ],

  // Production code (NEEDS FIXING)
  productionCode: [
    'src/components/AuthProvider.tsx',
    'src/app/layout.tsx',
    'src/app/auth/signout/route.ts',
    'src/utils/monitoring.ts',
    'src/utils/migrateLegacyDrafts.ts',
    'supabase/functions/cors-proxy/index.ts'
  ],

  // Security assessment
  securityRisk: {
    high: [
      'src/app/auth/signout/route.ts' // Auth-related logging
    ],
    medium: [
      'src/components/AuthProvider.tsx', // User state logging
      'src/app/layout.tsx' // Session logging
    ],
    low: [
      'src/utils/monitoring.ts', // Already commented
      'src/utils/migrateLegacyDrafts.ts', // Migration utility
      'supabase/functions/cors-proxy/index.ts' // Edge function
    ]
  }
}

/**
 * Clean up console.log statements in production code
 */
export function auditConsoleUsage(): {
  totalFound: number
  productionRisk: number
  highRisk: number
  recommendations: string[]
} {
  const { productionCode, securityRisk } = CONSOLE_LOG_AUDIT
  
  const recommendations = [
    'Replace console.log with logger.info() in production code',
    'Remove sensitive data logging in authentication flows',
    'Use conditional logging based on NODE_ENV',
    'Implement proper log levels (info, warn, error)',
    'Add log sanitization for user data',
    'Configure log retention policies for production'
  ]

  return {
    totalFound: productionCode.length,
    productionRisk: productionCode.length,
    highRisk: securityRisk.high.length,
    recommendations
  }
}

/**
 * Security-safe console replacement for specific use cases
 */
export const SafeConsole = {
  /**
   * Development-only logging
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dev: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[DEV]', ...args)
    }
  },

  /**
   * Performance logging (safe for production)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  perf: (message: string, data?: any) => {
    logger.info(`Performance: ${message}`, data, 'Performance')
  },

  /**
   * Security event logging (always use proper logger)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  security: (message: string, data?: any) => {
    logger.warn(`Security: ${message}`, data, 'Security')
  },

  /**
   * Audit trail logging (always use proper logger)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  audit: (message: string, data?: any) => {
    logger.info(`Audit: ${message}`, data, 'Audit')
  }
}

// Initialize production console replacement
if (typeof window === 'undefined') {
  // Server-side only
  ProductionConsole.initialize()
} 