/**
 * APPLICATION CONSTANTS
 *
 * Centralized constants for the entire application.
 * This ensures consistency and makes it easy to update values across the codebase.
 *
 * Created: 2025-10-17
 * Last Modified: 2025-10-17
 */

// ==================== BITCOIN CONSTANTS ====================

export const BITCOIN_CONSTANTS = {
  SATOSHI_PER_BTC: 100000000,
  MIN_SATOSHI_AMOUNT: 1,
  MAX_SATOSHI_AMOUNT: 2100000000000000, // 21M BTC in sats
  LIGHTNING_MIN_AMOUNT: 1,
  LIGHTNING_MAX_AMOUNT: 4294967295, // Max Lightning payment
  NETWORK_FEE_ESTIMATE: 1, // sats per byte
  CONFIRMATION_BLOCKS: 6,
  LIGHTNING_CONFIRMATION_BLOCKS: 1
} as const

// ==================== PAGINATION CONSTANTS ====================

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_OFFSET: 0,
  MAX_OFFSET: 10000
} as const

// ==================== RATE LIMITING CONSTANTS ====================

export const RATE_LIMITS = {
  API_REQUESTS_PER_MINUTE: 100,
  API_REQUESTS_PER_HOUR: 1000,
  AUTH_ATTEMPTS_PER_MINUTE: 5,
  PASSWORD_RESET_REQUESTS_PER_HOUR: 3,
  EMAIL_VERIFICATION_REQUESTS_PER_HOUR: 5
} as const

// ==================== VALIDATION CONSTANTS ====================

export const VALIDATION_LIMITS = {
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  DISPLAY_NAME_MAX_LENGTH: 100,
  BIO_MAX_LENGTH: 500,
  CAMPAIGN_TITLE_MAX_LENGTH: 100,
  CAMPAIGN_DESCRIPTION_MAX_LENGTH: 2000,
  ORGANIZATION_NAME_MAX_LENGTH: 100,
  ORGANIZATION_DESCRIPTION_MAX_LENGTH: 1000,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128
} as const

// ==================== FILE UPLOAD CONSTANTS ====================

export const FILE_UPLOAD = {
  MAX_AVATAR_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_BANNER_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_AVATAR_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  ALLOWED_BANNER_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  AVATAR_DIMENSIONS: { width: 400, height: 400 },
  BANNER_DIMENSIONS: { width: 1200, height: 400 }
} as const

// ==================== CACHE CONSTANTS ====================

export const CACHE_DURATIONS = {
  USER_PROFILE: 5 * 60 * 1000, // 5 minutes
  CAMPAIGN_DATA: 10 * 60 * 1000, // 10 minutes
  ORGANIZATION_DATA: 15 * 60 * 1000, // 15 minutes
  SEARCH_RESULTS: 2 * 60 * 1000, // 2 minutes
  STATIC_CONTENT: 60 * 60 * 1000 // 1 hour
} as const

// ==================== PERFORMANCE CONSTANTS ====================

export const PERFORMANCE = {
  SLOW_QUERY_THRESHOLD: 100, // ms
  API_TIMEOUT: 30000, // 30 seconds
  DATABASE_CONNECTION_TIMEOUT: 10000, // 10 seconds
  MAX_CONCURRENT_REQUESTS: 50,
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_BASE: 1000 // 1 second
} as const

// ==================== SECURITY CONSTANTS ====================

export const SECURITY = {
  JWT_EXPIRY: 3600, // 1 hour
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 3600, // 7 days
  MAX_LOGIN_ATTEMPTS: 5,
  ACCOUNT_LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  PASSWORD_HASH_ROUNDS: 12,
  SESSION_TIMEOUT: 24 * 3600 * 1000 // 24 hours
} as const

// ==================== FEATURE FLAGS ====================

export const FEATURE_FLAGS = {
  ENABLE_ORGANIZATIONS: true,
  ENABLE_PROJECTS: true,
  ENABLE_BITCOIN_PAYMENTS: true,
  ENABLE_LIGHTNING_PAYMENTS: true,
  ENABLE_ADVANCED_ANALYTICS: false,
  ENABLE_BETA_FEATURES: process.env.NODE_ENV === 'development',
  ENABLE_DEBUG_LOGS: process.env.NODE_ENV === 'development'
} as const

// ==================== REGEX PATTERNS ====================

export const REGEX_PATTERNS = {
  BITCOIN_ADDRESS: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,}$/,
  LIGHTNING_ADDRESS: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME: /^[a-zA-Z0-9_-]+$/,
  SLUG: /^[a-z0-9-]+$/,
  URL: /^https?:\/\/[^\s/$.?#].[^\s]*$/i,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[1-9]\d{1,14}$/
} as const

// ==================== ERROR CODES ====================

export const ERROR_CODES = {
  // Authentication errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Validation errors
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',

  // Database errors
  RECORD_NOT_FOUND: 'RECORD_NOT_FOUND',
  DUPLICATE_RECORD: 'DUPLICATE_RECORD',
  DATABASE_CONNECTION_ERROR: 'DATABASE_CONNECTION_ERROR',

  // Business logic errors
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  CAMPAIGN_NOT_ACTIVE: 'CAMPAIGN_NOT_ACTIVE',
  PAYMENT_FAILED: 'PAYMENT_FAILED',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
} as const

// ==================== TYPE HELPERS ====================

export type BitcoinUnit = 'SATS' | 'BTC' | 'USD'
export type CampaignStatus = 'draft' | 'active' | 'completed' | 'cancelled' | 'paused'
export type OrganizationType = 'nonprofit' | 'company' | 'dao' | 'collective' | 'foundation'
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

// ==================== UTILITY FUNCTIONS ====================

export function formatSatoshiToBTC(satoshis: number): number {
  return satoshis / BITCOIN_CONSTANTS.SATOSHI_PER_BTC
}

export function formatBTCToSatoshi(btc: number): number {
  return Math.round(btc * BITCOIN_CONSTANTS.SATOSHI_PER_BTC)
}

export function isValidBitcoinAmount(amount: number, unit: BitcoinUnit): boolean {
  switch (unit) {
    case 'SATS':
      return amount >= BITCOIN_CONSTANTS.MIN_SATOSHI_AMOUNT &&
             amount <= BITCOIN_CONSTANTS.MAX_SATOSHI_AMOUNT
    case 'BTC':
      return amount >= formatSatoshiToBTC(BITCOIN_CONSTANTS.MIN_SATOSHI_AMOUNT) &&
             amount <= 21000000 // 21M BTC max
    default:
      return true // USD validation handled elsewhere
  }
}

export function getErrorMessage(code: string): string {
  const errorMessages: Record<string, string> = {
    [ERROR_CODES.INVALID_CREDENTIALS]: 'Invalid email or password',
    [ERROR_CODES.TOKEN_EXPIRED]: 'Your session has expired. Please sign in again.',
    [ERROR_CODES.INSUFFICIENT_PERMISSIONS]: 'You don\'t have permission to perform this action',
    [ERROR_CODES.INVALID_INPUT]: 'Please check your input and try again',
    [ERROR_CODES.MISSING_REQUIRED_FIELD]: 'Required field is missing',
    [ERROR_CODES.INVALID_FORMAT]: 'Invalid format provided',
    [ERROR_CODES.RECORD_NOT_FOUND]: 'The requested resource was not found',
    [ERROR_CODES.DUPLICATE_RECORD]: 'This record already exists',
    [ERROR_CODES.DATABASE_CONNECTION_ERROR]: 'Database connection error',
    [ERROR_CODES.INSUFFICIENT_FUNDS]: 'Insufficient funds for this transaction',
    [ERROR_CODES.CAMPAIGN_NOT_ACTIVE]: 'This project is not currently active',
    [ERROR_CODES.PAYMENT_FAILED]: 'Payment processing failed',
    [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later.',
    [ERROR_CODES.INTERNAL_ERROR]: 'An internal error occurred',
    [ERROR_CODES.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable'
  }

  return errorMessages[code] || 'An unexpected error occurred'
}
