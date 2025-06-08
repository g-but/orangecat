/**
 * SUPABASE AUTH SERVICE - CLEAN AUTHENTICATION OPERATIONS
 * 
 * This service handles all authentication operations with proper
 * error handling, logging, and type safety.
 * 
 * Created: 2025-06-08
 * Last Modified: 2025-06-08
 * Last Modified Summary: Extracted from massive client.ts, pure auth concerns
 */

import { supabase } from '../core/client'
import { logger, logAuth } from '@/utils/logger'
import type { 
  AuthResponse, 
  SignInRequest, 
  SignUpRequest, 
  PasswordResetRequest,
  PasswordUpdateRequest,
  AuthError,
  isAuthError
} from '../types'

// ==================== AUTHENTICATION OPERATIONS ====================

/**
 * Sign in a user with email and password
 */
export async function signIn({ email, password }: SignInRequest): Promise<AuthResponse> {
  try {
    logAuth('Attempting to sign in user', { email })
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      logAuth('Sign in failed', { email, error: error.message })
      return { data: { user: null, session: null }, error: error as AuthError }
    }

    logAuth('Sign in successful', { 
      email, 
      userId: data.user?.id,
      hasSession: !!data.session 
    })
    
    return { data, error: null }
  } catch (error) {
    const authError = error as AuthError
    logger.error('Unexpected error during sign in', { 
      email, 
      error: authError.message 
    }, 'Auth')
    
    return { 
      data: { user: null, session: null }, 
      error: authError 
    }
  }
}

/**
 * Sign up a new user with email and password
 */
export async function signUp({ email, password, emailRedirectTo }: SignUpRequest): Promise<AuthResponse> {
  try {
    logAuth('Attempting to sign up user', { email })
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: emailRedirectTo || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      }
    })

    if (error) {
      logAuth('Sign up failed', { email, error: error.message })
      return { data: { user: null, session: null }, error: error as AuthError }
    }

    logAuth('Sign up successful', { 
      email, 
      userId: data.user?.id,
      needsConfirmation: !data.session 
    })
    
    return { data, error: null }
  } catch (error) {
    const authError = error as AuthError
    logger.error('Unexpected error during sign up', { 
      email, 
      error: authError.message 
    }, 'Auth')
    
    return { 
      data: { user: null, session: null }, 
      error: authError 
    }
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  try {
    logAuth('Attempting to sign out user')
    
    const { error } = await supabase.auth.signOut()

    if (error) {
      logAuth('Sign out failed', { error: error.message })
      return { error: error as AuthError }
    }

    logAuth('Sign out successful')
    return { error: null }
  } catch (error) {
    const authError = error as AuthError
    logger.error('Unexpected error during sign out', { 
      error: authError.message 
    }, 'Auth')
    
    return { error: authError }
  }
}

/**
 * Reset password for a user
 */
export async function resetPassword({ email }: PasswordResetRequest): Promise<{ error: AuthError | null }> {
  try {
    logAuth('Attempting password reset', { email })
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`
    })

    if (error) {
      logAuth('Password reset failed', { email, error: error.message })
      return { error: error as AuthError }
    }

    logAuth('Password reset email sent', { email })
    return { error: null }
  } catch (error) {
    const authError = error as AuthError
    logger.error('Unexpected error during password reset', { 
      email, 
      error: authError.message 
    }, 'Auth')
    
    return { error: authError }
  }
}

/**
 * Update user password
 */
export async function updatePassword({ newPassword }: PasswordUpdateRequest): Promise<{ error: AuthError | null }> {
  try {
    logAuth('Attempting password update')
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      logAuth('Password update failed', { error: error.message })
      return { error: error as AuthError }
    }

    logAuth('Password updated successfully')
    return { error: null }
  } catch (error) {
    const authError = error as AuthError
    logger.error('Unexpected error during password update', { 
      error: authError.message 
    }, 'Auth')
    
    return { error: authError }
  }
}

/**
 * Get current session
 */
export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      logAuth('Failed to get session', { error: error.message })
      return { session: null, error: error as AuthError }
    }
    
    logAuth('Session retrieved', { hasSession: !!session, userId: session?.user?.id })
    return { session, error: null }
  } catch (error) {
    const authError = error as AuthError
    logger.error('Unexpected error getting session', { 
      error: authError.message 
    }, 'Auth')
    
    return { session: null, error: authError }
  }
}

/**
 * Get current user
 */
export async function getUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      logAuth('Failed to get user', { error: error.message })
      return { user: null, error: error as AuthError }
    }
    
    logAuth('User retrieved', { userId: user?.id, email: user?.email })
    return { user, error: null }
  } catch (error) {
    const authError = error as AuthError
    logger.error('Unexpected error getting user', { 
      error: authError.message 
    }, 'Auth')
    
    return { user: null, error: authError }
  }
}

// ==================== AUTH STATE MONITORING ====================

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  logAuth('Setting up auth state change listener')
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    logAuth('Auth state changed', { event, hasSession: !!session, userId: session?.user?.id })
    callback(event, session)
  })
  
  return subscription
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const { session } = await getSession()
    return !!session
  } catch {
    return false
  }
}

/**
 * Get user ID from session
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { user } = await getUser()
    return user?.id || null
  } catch {
    return null
  }
}

// ==================== EXPORTS ====================

export {
  type AuthResponse,
  type SignInRequest,
  type SignUpRequest,
  type PasswordResetRequest,
  type PasswordUpdateRequest,
  type AuthError,
  isAuthError
} from '../types' 