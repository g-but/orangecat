/**
 * AUTHENTICATION SECURITY SERVICE
 * 
 * Created: 2025-06-08
 * Last Modified: 2025-01-17  
 * Last Modified Summary: Fixed duplicate client instance causing auth conflicts
 */

import { createClient } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/services/supabase/client'
import { 
  AuthSecurity, 
  SecurityMonitor, 
  SecureErrorHandler,
  InputSanitizer,
  SecuritySchemas
} from '@/utils/security'

interface AuthResult {
  success: boolean
  user?: any
  session?: any
  error?: string
  remainingAttempts?: number
}

export class AuthSecurityService {
  private supabase = getSupabaseClient()

  async secureLogin(
    email: string, 
    password: string, 
    ipAddress: string
  ): Promise<AuthResult> {
    try {
      const sanitizedEmail = InputSanitizer.sanitizeEmail(email)
      
      // Validate inputs
      const validation = SecuritySchemas.authData.safeParse({
        email: sanitizedEmail,
        password
      })

      if (!validation.success) {
        SecurityMonitor.logEvent('login_failure', 'high', {
          reason: 'invalid_input',
          ipAddress
        })
        return {
          success: false,
          error: 'Invalid email or password format'
        }
      }

      // Check account lockout
      if (AuthSecurity.isAccountLocked(sanitizedEmail)) {
        const remainingAttempts = AuthSecurity.getRemainingAttempts(sanitizedEmail)
        
        SecurityMonitor.logEvent('account_locked', 'critical', {
          email: sanitizedEmail,
          ipAddress
        })

        return {
          success: false,
          error: 'Account temporarily locked due to multiple failed attempts',
          remainingAttempts
        }
      }

      // Attempt authentication
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password
      })

      if (error || !data.user) {
        // Record failed attempt
        AuthSecurity.recordFailedAttempt(sanitizedEmail)
        
        SecurityMonitor.logEvent('login_failure', 'high', {
          reason: 'invalid_credentials',
          email: sanitizedEmail,
          ipAddress
        })

        const remainingAttempts = AuthSecurity.getRemainingAttempts(sanitizedEmail)
        
        return {
          success: false,
          error: 'Invalid email or password',
          remainingAttempts
        }
      }

      // Clear failed attempts on successful login
      AuthSecurity.clearFailedAttempts(sanitizedEmail)

      SecurityMonitor.logEvent('login_success', 'low', {
        userId: data.user.id,
        ipAddress
      })

      return {
        success: true,
        user: data.user,
        session: data.session
      }

    } catch (error) {
      const sanitizedError = SecureErrorHandler.sanitizeErrorMessage(error)
      SecureErrorHandler.logError(error, 'auth_login')
      
      return {
        success: false,
        error: sanitizedError
      }
    }
  }

  async secureSignup(
    email: string,
    password: string,
    ipAddress: string
  ): Promise<AuthResult> {
    try {
      const sanitizedEmail = InputSanitizer.sanitizeEmail(email)
      
      // Validate inputs
      const validation = SecuritySchemas.authData.safeParse({
        email: sanitizedEmail,
        password
      })

      if (!validation.success) {
        SecurityMonitor.logEvent('signup_failure', 'medium', {
          reason: 'invalid_input',
          ipAddress
        })
        return {
          success: false,
          error: 'Invalid email or password format'
        }
      }

      // Check password strength
      const passwordStrength = AuthSecurity.validatePasswordStrength(password)
      if (!passwordStrength.valid) {
        SecurityMonitor.logEvent('signup_failure', 'medium', {
          reason: 'weak_password',
          ipAddress
        })
        return {
          success: false,
          error: `Password too weak: ${passwordStrength.feedback.join(', ')}`
        }
      }

      // Create account
      const { data, error } = await this.supabase.auth.signUp({
        email: sanitizedEmail,
        password
      })

      if (error) {
        SecurityMonitor.logEvent('signup_failure', 'medium', {
          reason: 'creation_failed',
          error: error.message,
          ipAddress
        })
        return {
          success: false,
          error: SecureErrorHandler.sanitizeErrorMessage(error)
        }
      }

      SecurityMonitor.logEvent('signup_success', 'low', {
        userId: data.user?.id,
        ipAddress
      })

      return {
        success: true,
        user: data.user,
        session: data.session
      }

    } catch (error) {
      const sanitizedError = SecureErrorHandler.sanitizeErrorMessage(error)
      SecureErrorHandler.logError(error, 'auth_signup')
      
      return {
        success: false,
        error: sanitizedError
      }
    }
  }

  async changePassword(
    userId: string,
    newPassword: string,
    ipAddress: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate password strength
      const passwordStrength = AuthSecurity.validatePasswordStrength(newPassword)
      
      if (!passwordStrength.valid) {
        SecurityMonitor.logEvent('password_change_failure', 'medium', {
          userId,
          reason: 'weak_password',
          ipAddress
        })

        return {
          success: false,
          error: `Password too weak: ${passwordStrength.feedback.join(', ')}`
        }
      }

      // Update password
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        SecurityMonitor.logEvent('password_change_failure', 'medium', {
          userId,
          reason: 'update_failed',
          ipAddress
        })
        return {
          success: false,
          error: SecureErrorHandler.sanitizeErrorMessage(error)
        }
      }

      SecurityMonitor.logEvent('password_change_success', 'medium', {
        userId,
        strength_score: passwordStrength.score,
        ipAddress
      })

      return { success: true }

    } catch (error) {
      SecureErrorHandler.logError(error, 'auth_change_password', userId)
      return {
        success: false,
        error: SecureErrorHandler.sanitizeErrorMessage(error)
      }
    }
  }

  async logout(ipAddress: string): Promise<{ success: boolean }> {
    try {
      await this.supabase.auth.signOut()
      
      SecurityMonitor.logEvent('logout', 'low', {
        ipAddress
      })

      return { success: true }

    } catch (error) {
      SecureErrorHandler.logError(error, 'auth_logout')
      return { success: false }
    }
  }
}

export const authSecurityService = new AuthSecurityService() 