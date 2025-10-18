/**
 * SECURITY UTILITIES - Production Security Hardening
 * 
 * Created: 2025-06-08
 * Last Modified: 2025-06-08
 * Last Modified Summary: Comprehensive security utilities for Option C implementation
 */

import { z } from 'zod'
import { logger } from './logger'

// ==================== INPUT SANITIZATION ====================

/**
 * Comprehensive input sanitization
 */
export class InputSanitizer {
  private static instance: InputSanitizer
  
  static getInstance(): InputSanitizer {
    if (!InputSanitizer.instance) {
      InputSanitizer.instance = new InputSanitizer()
    }
    return InputSanitizer.instance
  }

  /**
   * Sanitize HTML to prevent XSS
   */
  static sanitizeHtml(input: string): string {
    if (!input || typeof input !== 'string') {return ''}
    
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }

  /**
   * Sanitize text input
   */
  static sanitizeText(input: string, maxLength: number = 1000): string {
    if (!input || typeof input !== 'string') {return ''}
    
    return input
      .replace(/<[^>]*>/g, '')
      .replace(/[<>]/g, '')
      .trim()
      .slice(0, maxLength)
  }

  /**
   * Sanitize Bitcoin address
   */
  static sanitizeBitcoinAddress(address: string): string {
    if (!address || typeof address !== 'string') {return ''}
    // Remove HTML tags first, then only allow valid Bitcoin address characters
    const cleaned = address.replace(/<[^>]*>/g, '').replace(/[^a-zA-Z0-9]/g, '')
    return cleaned.slice(0, 62)
  }

  /**
   * Sanitize username
   */
  static sanitizeUsername(username: string): string {
    if (!username || typeof username !== 'string') {return ''}
    // Remove HTML tags first, then sanitize for username
    const cleaned = username.replace(/<[^>]*>/g, '').toLowerCase().replace(/[^a-z0-9_-]/g, '')
    return cleaned.slice(0, 30)
  }

  /**
   * Sanitize email address
   */
  static sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') {return ''}
    // Remove HTML tags first, then normalize email
    const cleaned = email.replace(/<[^>]*>/g, '').toLowerCase().trim()
    return cleaned.slice(0, 254)
  }

  /**
   * Sanitize URL
   */
  static sanitizeUrl(url: string): string {
    if (!url || typeof url !== 'string') {return ''}
    
    try {
      const parsed = new URL(url)
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return ''
      }
      return parsed.toString()
    } catch {
      return ''
    }
  }
}

// ==================== VALIDATION SCHEMAS ====================

/**
 * Secure validation schemas using Zod
 */
export const SecuritySchemas = {
  // Profile validation
  profileData: z.object({
    username: z.string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be at most 30 characters')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
    
    display_name: z.string()
      .min(1, 'Display name is required')
      .max(50, 'Display name must be at most 50 characters'),
    
    bio: z.string()
      .max(500, 'Bio must be at most 500 characters')
      .optional(),
    
    website: z.string()
      .url('Website must be a valid URL')
      .optional()
      .or(z.literal('')),
    
    bitcoin_address: z.string()
      .regex(/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/, 'Invalid Bitcoin address format')
      .optional()
      .or(z.literal('')),
    
    lightning_address: z.string()
      .email('Lightning address must be a valid email format')
      .optional()
      .or(z.literal(''))
  }),

  // Campaign validation
  campaignData: z.object({
    title: z.string()
      .min(5, 'Title must be at least 5 characters')
      .max(100, 'Title must be at most 100 characters'),
    
    description: z.string()
      .min(50, 'Description must be at least 50 characters')
      .max(5000, 'Description must be at most 5000 characters'),
    
    goal_amount: z.number()
      .min(1, 'Goal amount must be positive')
      .max(100000000, 'Goal amount too large') // 1 BTC in sats
      .optional(),
    
    category: z.enum(['technology', 'community', 'education', 'creative', 'health', 'environment']),
    
    tags: z.array(z.string().max(30)).max(10, 'Maximum 10 tags allowed').optional()
  }),

  // Authentication validation
  authData: z.object({
    email: z.string()
      .email('Invalid email format')
      .min(5, 'Email too short')
      .max(254, 'Email too long'),
    
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password too long')
      .regex(/[A-Z]/, 'Password must contain uppercase letter')
      .regex(/[a-z]/, 'Password must contain lowercase letter')
      .regex(/[0-9]/, 'Password must contain number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain special character')
  }),

  // File upload validation
  fileUpload: z.object({
    file: z.object({
      size: z.number().max(5 * 1024 * 1024, 'File size must be less than 5MB'),
      type: z.enum(['image/jpeg', 'image/png', 'image/webp'])
    })
  }),

  // Search validation
  searchQuery: z.object({
    query: z.string()
      .min(1, 'Search query cannot be empty')
      .max(100, 'Search query too long')
      .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Search query contains invalid characters'),
    
    type: z.enum(['all', 'profiles', 'campaigns']),
    limit: z.number().min(1).max(50).default(20),
    offset: z.number().min(0).default(0)
  })
}

// ==================== RATE LIMITING ====================

/**
 * Rate limiting for API endpoints
 */
export class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>()
  private readonly windowMs: number
  private readonly maxRequests: number

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests
  }

  /**
   * Check if request should be allowed
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const request = this.requests.get(identifier)

    if (!request || now > request.resetTime) {
      // New window or expired window
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      })
      return true
    }

    if (request.count >= this.maxRequests) {
      return false
    }

    request.count++
    return true
  }

  /**
   * Get remaining requests for identifier
   */
  getRemaining(identifier: string): number {
    const request = this.requests.get(identifier)
    if (!request || Date.now() > request.resetTime) {
      return this.maxRequests
    }
    return Math.max(0, this.maxRequests - request.count)
  }

  /**
   * Get reset time for identifier
   */
  getResetTime(identifier: string): number {
    const request = this.requests.get(identifier)
    if (!request || Date.now() > request.resetTime) {
      return Date.now() + this.windowMs
    }
    return request.resetTime
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    this.requests.forEach((request, key) => {
      if (now > request.resetTime) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => this.requests.delete(key))
  }
}

// ==================== AUTHENTICATION SECURITY ====================

/**
 * Authentication security utilities
 */
export class AuthSecurity {
  private static loginAttempts = new Map<string, { count: number; lastAttempt: number }>()
  private static readonly MAX_ATTEMPTS = 5
  private static readonly LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

  /**
   * Check if account is locked due to failed attempts
   */
  static isAccountLocked(identifier: string): boolean {
    const attempts = this.loginAttempts.get(identifier)
    if (!attempts) {return false}

    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt
    if (timeSinceLastAttempt > this.LOCKOUT_DURATION) {
      // Reset attempts after lockout period
      this.loginAttempts.delete(identifier)
      return false
    }

    return attempts.count >= this.MAX_ATTEMPTS
  }

  /**
   * Record a failed login attempt
   */
  static recordFailedAttempt(identifier: string): void {
    const attempts = this.loginAttempts.get(identifier) || { count: 0, lastAttempt: 0 }
    attempts.count++
    attempts.lastAttempt = Date.now()
    this.loginAttempts.set(identifier, attempts)
  }

  /**
   * Clear failed attempts for successful login
   */
  static clearFailedAttempts(identifier: string): void {
    this.loginAttempts.delete(identifier)
  }

  /**
   * Get remaining attempts before lockout
   */
  static getRemainingAttempts(identifier: string): number {
    const attempts = this.loginAttempts.get(identifier)
    if (!attempts) {return this.MAX_ATTEMPTS}

    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt
    if (timeSinceLastAttempt > this.LOCKOUT_DURATION) {
      return this.MAX_ATTEMPTS
    }

    return Math.max(0, this.MAX_ATTEMPTS - attempts.count)
  }

  /**
   * Generate secure session token
   */
  static generateSecureToken(): string {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(32)
      crypto.getRandomValues(array)
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
    }
    
    // Fallback for older environments
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): { valid: boolean; score: number; feedback: string[] } {
    const feedback: string[] = []
    let score = 0

    if (password.length >= 8) {score += 1}
    else {feedback.push('Use at least 8 characters')}

    if (password.length >= 12) {score += 1}
    else {feedback.push('Consider using 12+ characters for better security')}

    if (/[A-Z]/.test(password)) {score += 1}
    else {feedback.push('Include uppercase letters')}

    if (/[a-z]/.test(password)) {score += 1}
    else {feedback.push('Include lowercase letters')}

    if (/[0-9]/.test(password)) {score += 1}
    else {feedback.push('Include numbers')}

    if (/[^A-Za-z0-9]/.test(password)) {score += 1}
    else {feedback.push('Include special characters')}

    // Check for common patterns
    const commonPatterns = [
      /(.)\1{2,}/, // Repeated characters
      /123|abc|qwe/i, // Sequential patterns
      /password|admin|user/i // Common words
    ]

    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        score -= 1
        feedback.push('Avoid common patterns and dictionary words')
        break
      }
    }

    return {
      valid: score >= 4,
      score: Math.max(0, Math.min(5, score)),
      feedback
    }
  }
}

// ==================== ERROR HANDLING SECURITY ====================

/**
 * Secure error handling to prevent information disclosure
 */
export class SecureErrorHandler {
  private static sensitivePatterns = [
    /password/i,
    /secret/i,
    /key/i,
    /token/i,
    /authorization/i,
    /bearer/i,
    /session/i
  ]

  /**
   * Sanitize error message for client display
   */
  static sanitizeErrorMessage(error: any): string {
    if (!error) {return 'An error occurred'}

    let message = typeof error === 'string' ? error : error.message || 'An error occurred'

    // Remove sensitive information
    for (const pattern of this.sensitivePatterns) {
      if (pattern.test(message)) {
        return 'Authentication error'
      }
    }

    // Remove stack traces and technical details
    message = message.split('\n')[0] // Only first line
    message = message.replace(/at\s+.*$/gm, '') // Remove stack trace hints
    message = message.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]') // Hide IP addresses
    
    // Limit message length
    if (message.length > 200) {
      message = 'An error occurred while processing your request'
    }

    return message
  }

  /**
   * Log error securely (for server-side logging)
   */
  static logError(error: any, context: string, userId?: string): void {
    const sanitizedUserId = userId ? `user:${userId.substring(0, 8)}...` : 'anonymous'
    const timestamp = new Date().toISOString()
    
    // In production, this would go to a secure logging service
    logger.error(`Security event logged for ${context}`, {
      message: error.message,
      stack: error.stack,
      // Don't log sensitive request data
    })
  }
}

// ==================== CONTENT SECURITY POLICY ====================

/**
 * Content Security Policy helpers
 */
export class CSPHelper {
  /**
   * Generate CSP headers for Next.js
   */
  static generateCSP(): string {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval in dev
      "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
      "img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "media-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ]

    return csp.join('; ')
  }

  /**
   * Security headers for API responses
   */
  static getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': this.generateCSP()
    }
  }
}

// ==================== SECURITY MONITORING ====================

/**
 * Security event monitoring
 */
export class SecurityMonitor {
  private static events: Array<{
    type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    timestamp: number
    details: any
  }> = []

  /**
   * Log security event
   */
  static logEvent(type: string, severity: 'low' | 'medium' | 'high' | 'critical', details: any): void {
    const event = {
      type,
      severity,
      timestamp: Date.now(),
      details: {
        ...details,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
        timestamp: new Date().toISOString()
      }
    }

    this.events.push(event)

    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events.shift()
    }

    // In production, send critical events to monitoring service
    if (severity === 'critical') {
    }
  }

  /**
   * Get recent security events
   */
  static getRecentEvents(limit: number = 100): typeof this.events {
    return this.events.slice(-limit)
  }

  /**
   * Get events by severity
   */
  static getEventsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical'): typeof this.events {
    return this.events.filter(event => event.severity === severity)
  }
}

// ==================== GLOBAL INSTANCES ====================

export const inputSanitizer = InputSanitizer.getInstance()
export const apiRateLimiter = new RateLimiter(15 * 60 * 1000, 100) // 100 requests per 15 minutes
export const authRateLimiter = new RateLimiter(15 * 60 * 1000, 5) // 5 auth attempts per 15 minutes

// ==================== SECURITY VALIDATION WRAPPER ====================

/**
 * Wrapper for secure API route handling
 */
export function withSecurity<T>(
  handler: (data: T) => Promise<any>,
  schema: z.ZodSchema<T>,
  options: {
    rateLimiter?: RateLimiter
    requireAuth?: boolean
    logActivity?: boolean
  } = {}
) {
  return async (data: unknown, context?: { userId?: string; ip?: string }) => {
    try {
      // Rate limiting
      if (options.rateLimiter && context?.ip) {
        if (!options.rateLimiter.isAllowed(context.ip)) {
          SecurityMonitor.logEvent('rate_limit_exceeded', 'medium', {
            ip: context.ip,
            userId: context.userId
          })
          throw new Error('Rate limit exceeded')
        }
      }

      // Validation
      const validatedData = schema.parse(data)

      // Authentication check
      if (options.requireAuth && !context?.userId) {
        SecurityMonitor.logEvent('unauthorized_access', 'high', {
          ip: context?.ip,
          data: typeof data
        })
        throw new Error('Authentication required')
      }

      // Log activity
      if (options.logActivity) {
        SecurityMonitor.logEvent('api_access', 'low', {
          userId: context?.userId,
          ip: context?.ip,
          endpoint: 'api_call'
        })
      }

      // Execute handler
      return await handler(validatedData)

    } catch (error) {
      const sanitizedError = SecureErrorHandler.sanitizeErrorMessage(error)
      SecureErrorHandler.logError(error, 'api_handler', context?.userId)
      
      SecurityMonitor.logEvent('api_error', 'medium', {
        error: sanitizedError,
        userId: context?.userId,
        ip: context?.ip
      })

      throw new Error(sanitizedError)
    }
  }
} 