/**
 * COMPREHENSIVE SECURITY TESTS - Option C Validation
 * 
 * Created: 2025-06-08
 * Last Modified: 2025-06-08
 * Last Modified Summary: Security hardening validation tests
 */

import {
  InputSanitizer,
  SecuritySchemas,
  RateLimiter,
  AuthSecurity,
  SecureErrorHandler,
  SecurityMonitor,
  CSPHelper
} from '../src/utils/security'

describe('🔒 Security Hardening - Option C Validation', () => {
  
  describe('Input Sanitization', () => {
    test('should sanitize HTML to prevent XSS', () => {
      const maliciousInput = '<script>alert("xss")</script>'
      const sanitized = InputSanitizer.sanitizeHtml(maliciousInput)
      
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).toContain('&lt;script&gt;')
    })

    test('should sanitize text input safely', () => {
      const input = '<p>Hello <script>evil()</script> World</p>'
      const sanitized = InputSanitizer.sanitizeText(input, 50)
      
      expect(sanitized).toBe('Hello evil() World')
      expect(sanitized.length).toBeLessThanOrEqual(50)
    })

    test('should sanitize Bitcoin addresses correctly', () => {
      const validAddress = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
      const maliciousAddress = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh<script>'
      
      expect(InputSanitizer.sanitizeBitcoinAddress(validAddress)).toBe(validAddress)
      expect(InputSanitizer.sanitizeBitcoinAddress(maliciousAddress)).toBe(validAddress)
    })

    test('should sanitize usernames properly', () => {
      const validUsername = 'user_name-123'
      const maliciousUsername = 'user<script>alert(1)</script>name'
      
      expect(InputSanitizer.sanitizeUsername(validUsername)).toBe(validUsername)
      expect(InputSanitizer.sanitizeUsername(maliciousUsername)).toBe('useralert1name')
    })

    test('should sanitize email addresses', () => {
      const validEmail = 'test@example.com'
      const maliciousEmail = 'TEST@EXAMPLE.COM<script>'
      
      expect(InputSanitizer.sanitizeEmail(validEmail)).toBe(validEmail)
      expect(InputSanitizer.sanitizeEmail(maliciousEmail)).toBe('test@example.com')
    })

    test('should sanitize URLs safely', () => {
      const validUrl = 'https://example.com/path'
      const maliciousUrl = 'javascript:alert(1)'
      const invalidUrl = 'not-a-url'
      
      expect(InputSanitizer.sanitizeUrl(validUrl)).toBe(validUrl)
      expect(InputSanitizer.sanitizeUrl(maliciousUrl)).toBe('')
      expect(InputSanitizer.sanitizeUrl(invalidUrl)).toBe('')
    })
  })

  describe('Security Validation Schemas', () => {
    test('should validate profile data correctly', () => {
      const validProfile = {
        username: 'testuser123',
        display_name: 'Test User',
        bio: 'A test user bio',
        website: 'https://example.com',
        bitcoin_address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
      }

      const result = SecuritySchemas.profileData.safeParse(validProfile)
      expect(result.success).toBe(true)
    })

    test('should reject invalid profile data', () => {
      const invalidProfile = {
        username: 'a',
        display_name: '',
        bio: 'x'.repeat(501),
        website: 'not-a-url',
        bitcoin_address: 'invalid-address'
      }

      const result = SecuritySchemas.profileData.safeParse(invalidProfile)
      expect(result.success).toBe(false)
    })

    test('should validate authentication data', () => {
      const validAuth = {
        email: 'test@example.com',
        password: 'StrongPass123!'
      }

      const result = SecuritySchemas.authData.safeParse(validAuth)
      expect(result.success).toBe(true)
    })

    test('should reject weak authentication data', () => {
      const weakAuth = {
        email: 'invalid-email',
        password: '123' // Too weak
      }

      const result = SecuritySchemas.authData.safeParse(weakAuth)
      expect(result.success).toBe(false)
    })

    test('should validate file upload constraints', () => {
      const validFile = {
        file: {
          size: 1024 * 1024, // 1MB
          type: 'image/jpeg'
        }
      }

      const result = SecuritySchemas.fileUpload.safeParse(validFile)
      expect(result.success).toBe(true)
    })

    test('should reject invalid file uploads', () => {
      const invalidFile = {
        file: {
          size: 10 * 1024 * 1024, // 10MB - too large
          type: 'text/plain' // Wrong type
        }
      }

      const result = SecuritySchemas.fileUpload.safeParse(invalidFile)
      expect(result.success).toBe(false)
    })
  })

  describe('Rate Limiting', () => {
    test('should allow requests within limit', () => {
      const rateLimiter = new RateLimiter(1000, 3)
      const identifier = 'test-user-1'
      
      expect(rateLimiter.isAllowed(identifier)).toBe(true)
      expect(rateLimiter.isAllowed(identifier)).toBe(true)
      expect(rateLimiter.isAllowed(identifier)).toBe(true)
    })

    test('should block requests exceeding limit', () => {
      const rateLimiter = new RateLimiter(1000, 2)
      const identifier = 'test-user-2'
      
      rateLimiter.isAllowed(identifier)
      rateLimiter.isAllowed(identifier)
      
      expect(rateLimiter.isAllowed(identifier)).toBe(false)
    })

    test('should track remaining requests correctly', () => {
      const identifier = 'test-user-3'
      
      const rateLimiter = new RateLimiter(1000, 3)
      expect(rateLimiter.getRemaining(identifier)).toBe(3)
      rateLimiter.isAllowed(identifier)
      expect(rateLimiter.getRemaining(identifier)).toBe(2)
    })

    test('should clean up expired entries', () => {
      const identifier = 'test-user-4'
      const rateLimiter = new RateLimiter(1000, 3)
      rateLimiter.isAllowed(identifier)
      
      // Cleanup should work without errors
      expect(() => rateLimiter.cleanup()).not.toThrow()
    })
  })

  describe('Authentication Security', () => {
    test('should track failed login attempts', () => {
      const email = 'test@example.com'
      AuthSecurity.clearFailedAttempts(email)
      
      expect(AuthSecurity.isAccountLocked(email)).toBe(false)
      
      for (let i = 0; i < 5; i++) {
        AuthSecurity.recordFailedAttempt(email)
      }
      
      expect(AuthSecurity.isAccountLocked(email)).toBe(true)
    })

    test('should clear failed attempts on success', () => {
      const email = 'test2@example.com'
      
      AuthSecurity.recordFailedAttempt(email)
      AuthSecurity.recordFailedAttempt(email)
      
      expect(AuthSecurity.getRemainingAttempts(email)).toBe(3)
      
      AuthSecurity.clearFailedAttempts(email)
      expect(AuthSecurity.getRemainingAttempts(email)).toBe(5)
    })

    test('should validate password strength correctly', () => {
      const weakPassword = '123456'
      const strongPassword = 'StrongPass123!'
      
      const weakResult = AuthSecurity.validatePasswordStrength(weakPassword)
      expect(weakResult.valid).toBe(false)
      
      const strongResult = AuthSecurity.validatePasswordStrength(strongPassword)
      expect(strongResult.valid).toBe(true)
    })

    test('should generate secure tokens', () => {
      const token1 = AuthSecurity.generateSecureToken()
      const token2 = AuthSecurity.generateSecureToken()
      
      expect(token1).toBeDefined()
      expect(token2).toBeDefined()
      expect(token1).not.toBe(token2)
      expect(token1.length).toBeGreaterThan(10)
    })

    test('should detect common password patterns', () => {
      const commonPasswords = [
        'password123',
        'admin123',
        'user123',
        'aaaaaa',
        '123456789'
      ]

      commonPasswords.forEach(password => {
        const result = AuthSecurity.validatePasswordStrength(password)
        expect(result.score).toBeLessThan(4) // Should be weak
      })
    })
  })

  describe('Secure Error Handling', () => {
    test('should sanitize sensitive error messages', () => {
      const sensitiveError = new Error('Database password is invalid')
      const sanitized = SecureErrorHandler.sanitizeErrorMessage(sensitiveError)
      
      expect(sanitized).toBe('Authentication error')
      expect(sanitized).not.toContain('password')
    })

    test('should sanitize technical error details', () => {
      const technicalError = new Error('Error at line 123 in /home/user/secret/file.js')
      const sanitized = SecureErrorHandler.sanitizeErrorMessage(technicalError)
      
      expect(sanitized).not.toContain('/home/user/secret')
      expect(sanitized).not.toContain('line 123')
    })

    test('should limit error message length', () => {
      const longError = new Error('x'.repeat(300))
      const sanitized = SecureErrorHandler.sanitizeErrorMessage(longError)
      
      expect(sanitized.length).toBeLessThanOrEqual(200)
    })

    test('should handle various error types', () => {
      const stringError = 'Simple string error'
      const objectError = { message: 'Object error' }
      const nullError = null

      expect(SecureErrorHandler.sanitizeErrorMessage(stringError)).toBe(stringError)
      expect(SecureErrorHandler.sanitizeErrorMessage(objectError)).toBe('Object error')
      expect(SecureErrorHandler.sanitizeErrorMessage(nullError)).toBe('An error occurred')
    })
  })

  describe('Security Monitoring', () => {
    test('should log security events correctly', () => {
      SecurityMonitor.logEvent('test_event', 'medium', {
        userId: 'test-user',
        action: 'test-action'
      })

      const events = SecurityMonitor.getRecentEvents(1)
      expect(events.length).toBeGreaterThan(0)
      expect(events[events.length - 1].type).toBe('test_event')
    })

    test('should filter events by severity', () => {
      SecurityMonitor.logEvent('event1', 'low', {})
      SecurityMonitor.logEvent('event2', 'high', {})

      const highEvents = SecurityMonitor.getEventsBySeverity('high')
      const lowEvents = SecurityMonitor.getEventsBySeverity('low')
      
      expect(highEvents.length).toBeGreaterThan(0)
      expect(lowEvents.length).toBeGreaterThan(0)
    })

    test('should limit event storage', () => {
      // Log more than the limit (1000 events)
      for (let i = 0; i < 1005; i++) {
        SecurityMonitor.logEvent(`event_${i}`, 'low', {})
      }

      const events = SecurityMonitor.getRecentEvents()
      expect(events.length).toBeLessThanOrEqual(1000)
    })

    test('should handle critical events appropriately', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      SecurityMonitor.logEvent('critical_event', 'critical', {
        threat: 'high'
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        'CRITICAL SECURITY EVENT:',
        expect.objectContaining({
          type: 'critical_event',
          severity: 'critical'
        })
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Content Security Policy', () => {
    test('should generate valid CSP headers', () => {
      const csp = CSPHelper.generateCSP()
      
      expect(csp).toContain("default-src 'self'")
      expect(csp).toContain("object-src 'none'")
      expect(csp).toContain("upgrade-insecure-requests")
    })

    test('should include required security headers', () => {
      const headers = CSPHelper.getSecurityHeaders()
      
      expect(headers['X-Content-Type-Options']).toBe('nosniff')
      expect(headers['X-Frame-Options']).toBe('DENY')
      expect(headers['X-XSS-Protection']).toBe('1; mode=block')
      expect(headers['Content-Security-Policy']).toBeDefined()
    })

    test('should have proper HSTS configuration', () => {
      const headers = CSPHelper.getSecurityHeaders()
      
      expect(headers['Strict-Transport-Security']).toContain('max-age=31536000')
      expect(headers['Strict-Transport-Security']).toContain('includeSubDomains')
    })
  })

  describe('Security Integration', () => {
    test('should work together - sanitize and validate input', () => {
      const maliciousInput = {
        username: 'user<script>alert(1)</script>',
        display_name: 'Test User',
        bio: 'Bio content',
        bitcoin_address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
      }

      const sanitized = {
        username: InputSanitizer.sanitizeUsername(maliciousInput.username),
        display_name: InputSanitizer.sanitizeText(maliciousInput.display_name),
        bio: InputSanitizer.sanitizeText(maliciousInput.bio),
        bitcoin_address: InputSanitizer.sanitizeBitcoinAddress(maliciousInput.bitcoin_address)
      }

      const result = SecuritySchemas.profileData.safeParse(sanitized)
      expect(result.success).toBe(true)
      
      Object.values(sanitized).forEach(value => {
        expect(value).not.toContain('<script>')
        expect(value).not.toContain('alert(')
      })
    })

    test('should handle complete authentication flow securely', () => {
      const email = 'security-test@example.com'
      
      // Start with clean state
      AuthSecurity.clearFailedAttempts(email)
      expect(AuthSecurity.isAccountLocked(email)).toBe(false)
      
      // Simulate failed attempts
      for (let i = 0; i < 4; i++) {
        AuthSecurity.recordFailedAttempt(email)
        expect(AuthSecurity.isAccountLocked(email)).toBe(false)
      }
      
      // Final attempt should lock account
      AuthSecurity.recordFailedAttempt(email)
      expect(AuthSecurity.isAccountLocked(email)).toBe(true)
      
      // Successful login should clear attempts
      AuthSecurity.clearFailedAttempts(email)
      expect(AuthSecurity.isAccountLocked(email)).toBe(false)
    })

    test('should maintain security under load', () => {
      const rateLimiter = new RateLimiter(1000, 10)
      const identifier = 'load-test-user'
      
      // Simulate high load
      let allowedCount = 0
      let deniedCount = 0
      
      for (let i = 0; i < 20; i++) {
        if (rateLimiter.isAllowed(identifier)) {
          allowedCount++
        } else {
          deniedCount++
        }
      }
      
      expect(allowedCount).toBe(10) // Should respect the limit
      expect(deniedCount).toBe(10)  // Should deny excess requests
    })
  })
})

// ==================== PERFORMANCE TESTS ====================

describe('🚀 Security Performance', () => {
  test('should sanitize inputs efficiently', () => {
    const longInput = 'x'.repeat(10000)
    
    const start = performance.now()
    InputSanitizer.sanitizeText(longInput)
    const end = performance.now()
    
    expect(end - start).toBeLessThan(100) // Should be fast
  })

  test('should validate schemas efficiently', () => {
    const profileData = {
      username: 'testuser',
      display_name: 'Test User',
      bio: 'Test bio',
      bitcoin_address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
    }
    
    const start = performance.now()
    for (let i = 0; i < 1000; i++) {
      SecuritySchemas.profileData.safeParse(profileData)
    }
    const end = performance.now()
    
    expect(end - start).toBeLessThan(1000) // Should handle 1000 validations quickly
  })

  test('should handle rate limiting efficiently', () => {
    const rateLimiter = new RateLimiter(1000, 100)
    
    const start = performance.now()
    for (let i = 0; i < 1000; i++) {
      rateLimiter.isAllowed(`user-${i % 10}`)
    }
    const end = performance.now()
    
    expect(end - start).toBeLessThan(500) // Should be fast
  })
}) 