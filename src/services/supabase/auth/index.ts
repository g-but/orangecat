/**
 * SUPABASE AUTH SERVICE - CLEAN AUTHENTICATION OPERATIONS
 *
 * This service handles all authentication operations with proper
 * error handling, logging, and type safety.
 *
 * Created: 2025-06-08
 * Last Modified: 2025-01-22
 * Last Modified Summary: Enhanced timeout handling and error messages for better UX
 */

import supabase from '@/lib/supabase/browser';
import { logger, logAuth } from '@/utils/logger';
import type {
  AuthResponse,
  SignInRequest,
  SignUpRequest,
  PasswordResetRequest,
  PasswordUpdateRequest,
  AuthError,
} from '../types';
import { isAuthError } from '../types';

/**
 * Enhanced error handling with timeout detection for authentication operations
 * @param error - The error object from auth operation
 * @param operation - The auth operation that failed (for context)
 * @returns Standardized AuthError with enhanced messaging
 */
const handleAuthError = (error: any, _operation: string): AuthError => {
  if (error.name === 'AbortError' || error.message?.includes('timeout')) {
    return {
      name: 'TimeoutError',
      message: 'Request timed out. Please check your internet connection or try again later.',
      status: 408,
    } as AuthError;
  }

  if (error.message?.includes('fetch')) {
    return {
      name: 'NetworkError',
      message:
        'Unable to connect to authentication service. Please check your internet connection.',
      status: 0,
    } as AuthError;
  }

  return error as AuthError;
};

// ==================== AUTHENTICATION OPERATIONS ====================

/**
 * Sign in a user with email and password
 * @param params - Sign in parameters
 * @param params.email - User's email address
 * @param params.password - User's password
 * @returns Promise<AuthResponse> - Authentication response with user data or error
 * @example
 * ```typescript
 * const result = await signIn({ email: 'user@example.com', password: 'password123' });
 * if (result.error) {
 *   console.error('Sign in failed:', result.error.message);
 * } else {
 *   console.log('Signed in user:', result.data.user?.id);
 * }
 * ```
 */
export async function signIn({ email, password }: SignInRequest): Promise<AuthResponse> {
  try {
    logAuth('Attempting to sign in user', { email });

    // Add timeout wrapper for auth operations
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Authentication request timed out')), 20000);
    });

    const authPromise = supabase.auth.signInWithPassword({
      email,
      password,
    });

    const { data, error } = await Promise.race([authPromise, timeoutPromise]);

    if (error) {
      const enhancedError = handleAuthError(error, 'sign in');
      logAuth('Sign in failed', { email, error: enhancedError.message });
      return { data: { user: null, session: null }, error: enhancedError };
    }

    logAuth('Sign in successful', {
      email,
      userId: data.user?.id,
      hasSession: !!data.session,
    });

    return { data, error: null };
  } catch (error) {
    const enhancedError = handleAuthError(error, 'sign in');
    logger.error(
      'Unexpected error during sign in',
      {
        email,
        error: enhancedError.message,
      },
      'Auth'
    );

    return {
      data: { user: null, session: null },
      error: enhancedError,
    };
  }
}

/**
 * Sign up a new user with email and password
 * @param params - Sign up parameters
 * @param params.email - User's email address
 * @param params.password - User's password (should meet security requirements)
 * @param params.emailRedirectTo - Optional redirect URL after email confirmation
 * @returns Promise<AuthResponse> - Authentication response with user data or error
 * @example
 * ```typescript
 * const result = await signUp({
 *   email: 'newuser@example.com',
 *   password: 'securePassword123',
 *   emailRedirectTo: 'https://myapp.com/welcome'
 * });
 * if (!result.error) {
 *   console.log('User registered, check email for confirmation');
 * }
 * ```
 */
export async function signUp({
  email,
  password,
  emailRedirectTo,
}: SignUpRequest): Promise<AuthResponse> {
  try {
    logAuth('Attempting to sign up user', { email });

    // Add timeout wrapper
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Registration request timed out')), 25000);
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.orangecat.ch';

    const authPromise = supabase.auth.signUp({
      email,
      password,
      options: {
        // After email confirmation, Supabase will redirect here with ?code= for session exchange
        emailRedirectTo: emailRedirectTo || `${siteUrl}/auth/callback`,
      },
    });

    const { data, error } = await Promise.race([authPromise, timeoutPromise]);

    if (error) {
      const enhancedError = handleAuthError(error, 'sign up');
      logAuth('Sign up failed', { email, error: enhancedError.message });
      return { data: { user: null, session: null }, error: enhancedError };
    }

    logAuth('Sign up successful', {
      email,
      userId: data.user?.id,
      needsConfirmation: !data.session,
    });

    return { data, error: null };
  } catch (error) {
    const enhancedError = handleAuthError(error, 'sign up');
    logger.error(
      'Unexpected error during sign up',
      {
        email,
        error: enhancedError.message,
      },
      'Auth'
    );

    return {
      data: { user: null, session: null },
      error: enhancedError,
    };
  }
}

/**
 * Sign out the current user from all sessions
 * @returns Promise<{error: AuthError | null}> - Success status or error
 * @example
 * ```typescript
 * const { error } = await signOut();
 * if (!error) {
 *   console.log('User signed out successfully');
 *   // Redirect to login page
 * }
 * ```
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  try {
    logAuth('Attempting to sign out user');

    const { error } = await supabase.auth.signOut();

    if (error) {
      logAuth('Sign out failed', { error: error.message });
      return { error: error as AuthError };
    }

    logAuth('Sign out successful');
    return { error: null };
  } catch (error) {
    const authError = error as AuthError;
    logger.error(
      'Unexpected error during sign out',
      {
        error: authError.message,
      },
      'Auth'
    );

    return { error: authError };
  }
}

/**
 * Reset password for a user by sending email with reset link
 * @param params - Password reset parameters
 * @returns Promise with error status
 *
 * @example
 * ```typescript
 * const { error } = await resetPassword({ email: 'user@example.com' });
 * if (!error) {
 *   console.log('Password reset email sent');
 * }
 * ```
 */
export async function resetPassword({
  email,
}: PasswordResetRequest): Promise<{ error: AuthError | null }> {
  try {
    logAuth('Attempting password reset', { email });

    // Use canonical www domain to avoid losing hash/query tokens on redirect
    // Important: This URL MUST match exactly what's configured in Supabase Dashboard
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.orangecat.ch';
    const redirectUrl = `${siteUrl}/auth/reset-password`;

    logAuth('Using redirect URL for password reset', { redirectUrl });

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      logAuth('Password reset failed', { email, error: error.message });
      return { error };
    }

    logAuth('Password reset email sent successfully', { email, redirectUrl });
    return { error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Unexpected error during password reset', {
      error: errorMessage,
      email,
    });
    return { error: { message: errorMessage, name: 'ResetError' } as AuthError };
  }
}

/**
 * Update user password (requires authenticated session)
 * @param params - Password update parameters
 * @param params.newPassword - The new password (should meet security requirements)
 * @returns Promise<{error: AuthError | null}> - Success status or error
 * @example
 * ```typescript
 * const { error } = await updatePassword({ newPassword: 'newSecurePassword123' });
 * if (!error) {
 *   console.log('Password updated successfully');
 * }
 * ```
 */
export async function updatePassword({
  newPassword,
}: PasswordUpdateRequest): Promise<{ error: AuthError | null }> {
  try {
    logAuth('Attempting password update');

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      logAuth('Password update failed', { error: error.message });
      return { error: error as AuthError };
    }

    logAuth('Password updated successfully');
    return { error: null };
  } catch (error) {
    const authError = error as AuthError;
    logger.error(
      'Unexpected error during password update',
      {
        error: authError.message,
      },
      'Auth'
    );

    return { error: authError };
  }
}

/**
 * Get current user session from local storage
 * @returns Promise<{session: Session | null, error: AuthError | null}> - Current session or error
 * @example
 * ```typescript
 * const { session, error } = await getSession();
 * if (session) {
 *   console.log('User is authenticated:', session.user.id);
 * }
 * ```
 */
export async function getSession() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      logAuth('Failed to get session', { error: error.message });
      return { session: null, error: error as AuthError };
    }

    logAuth('Session retrieved', { hasSession: !!session, userId: session?.user?.id });
    return { session, error: null };
  } catch (error) {
    const authError = error as AuthError;
    logger.error(
      'Unexpected error getting session',
      {
        error: authError.message,
      },
      'Auth'
    );

    return { session: null, error: authError };
  }
}

/**
 * Get current user with server-side token validation
 * More secure than getSession() as it validates token with server
 * @returns Promise<{user: User | null, error: AuthError | null}> - Current user or error
 * @example
 * ```typescript
 * const { user, error } = await getUser();
 * if (user) {
 *   console.log('Authenticated user:', user.email);
 * }
 * ```
 */
export async function getUser() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      logAuth('Failed to get user', { error: error.message });
      return { user: null, error: error as AuthError };
    }

    logAuth('User retrieved', { userId: user?.id, email: user?.email });
    return { user, error: null };
  } catch (error) {
    const authError = error as AuthError;
    logger.error(
      'Unexpected error getting user',
      {
        error: authError.message,
      },
      'Auth'
    );

    return { user: null, error: authError };
  }
}

// ==================== AUTH STATE MONITORING ====================

/**
 * Subscribe to authentication state changes
 * @param callback - Function called when auth state changes
 * @param callback.event - Auth event type (SIGNED_IN, SIGNED_OUT, etc.)
 * @param callback.session - New session data or null
 * @returns Subscription object with unsubscribe method
 * @example
 * ```typescript
 * const subscription = onAuthStateChange((event, session) => {
 *   if (event === 'SIGNED_IN') {
 *     console.log('User signed in:', session.user.id);
 *   } else if (event === 'SIGNED_OUT') {
 *     console.log('User signed out');
 *   }
 * });
 *
 * // Later, unsubscribe
 * subscription.unsubscribe();
 * ```
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  logAuth('Setting up auth state change listener');

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    logAuth('Auth state changed', { event, hasSession: !!session, userId: session?.user?.id });
    callback(event, session);
  });

  return subscription;
}

// ==================== EMAIL CONFIRMATION ====================

/**
 * Resend email confirmation for the current user
 * @returns Promise with error status
 *
 * @example
 * ```typescript
 * const { error } = await resendConfirmationEmail();
 * if (!error) {
 *   console.log('Confirmation email resent');
 * }
 * ```
 */
export async function resendConfirmationEmail(): Promise<{ error: AuthError | null }> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      logAuth('Cannot resend confirmation - no user email', { error: userError?.message });
      return { error: { message: 'No user email found', name: 'ResendError' } as AuthError };
    }

    logAuth('Attempting to resend confirmation email', { email: user.email });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.orangecat.ch';

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (error) {
      logAuth('Resend confirmation failed', { email: user.email, error: error.message });
      return { error: error as AuthError };
    }

    logAuth('Confirmation email resent successfully', { email: user.email });
    return { error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Unexpected error resending confirmation', {
      error: errorMessage,
    });
    return { error: { message: errorMessage, name: 'ResendError' } as AuthError };
  }
}

// ==================== MFA (Multi-Factor Authentication) ====================

/**
 * MFA Factor Types supported by Supabase
 */
export type MFAFactorType = 'totp';

/**
 * Check if user has MFA enabled
 * @returns Promise with MFA factors list
 */
export async function getMFAFactors() {
  try {
    logAuth('Getting MFA factors');

    const { data, error } = await supabase.auth.mfa.listFactors();

    if (error) {
      logAuth('Failed to get MFA factors', { error: error.message });
      return { factors: null, error: error as AuthError };
    }

    const totpFactors = data?.totp || [];
    const verifiedFactors = totpFactors.filter(f => f.status === 'verified');

    logAuth('MFA factors retrieved', {
      totalFactors: totpFactors.length,
      verifiedFactors: verifiedFactors.length,
    });

    return {
      factors: totpFactors,
      verifiedFactors,
      hasMFA: verifiedFactors.length > 0,
      error: null,
    };
  } catch (error) {
    const authError = error as AuthError;
    logger.error(
      'Unexpected error getting MFA factors',
      {
        error: authError.message,
      },
      'Auth'
    );
    return { factors: null, verifiedFactors: [], hasMFA: false, error: authError };
  }
}

/**
 * Start MFA enrollment - generates TOTP secret and QR code
 * @returns Promise with factor data including QR code URI
 */
export async function enrollMFA() {
  try {
    logAuth('Starting MFA enrollment');

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'OrangeCat Authenticator',
    });

    if (error) {
      logAuth('MFA enrollment failed', { error: error.message });
      return { data: null, error: error as AuthError };
    }

    logAuth('MFA enrollment started', { factorId: data?.id });

    return {
      data: {
        id: data.id,
        type: data.type,
        totpUri: data.totp?.uri || '',
        secret: data.totp?.secret || '',
        qrCode: data.totp?.qr_code || '',
      },
      error: null,
    };
  } catch (error) {
    const authError = error as AuthError;
    logger.error(
      'Unexpected error during MFA enrollment',
      {
        error: authError.message,
      },
      'Auth'
    );
    return { data: null, error: authError };
  }
}

/**
 * Verify MFA enrollment with TOTP code
 * @param factorId - The factor ID from enrollment
 * @param code - The 6-digit TOTP code
 * @returns Promise with verification result
 */
export async function verifyMFAEnrollment(factorId: string, code: string) {
  try {
    logAuth('Verifying MFA enrollment', { factorId });

    // Create a challenge first
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    });

    if (challengeError) {
      logAuth('MFA challenge creation failed', { error: challengeError.message });
      return { success: false, error: challengeError as AuthError };
    }

    // Verify the challenge with the code
    const { data, error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    });

    if (error) {
      logAuth('MFA verification failed', { error: error.message });
      return { success: false, error: error as AuthError };
    }

    logAuth('MFA enrollment verified successfully', { factorId });

    return { success: true, data, error: null };
  } catch (error) {
    const authError = error as AuthError;
    logger.error(
      'Unexpected error verifying MFA',
      {
        error: authError.message,
      },
      'Auth'
    );
    return { success: false, error: authError };
  }
}

/**
 * Unenroll/disable MFA factor
 * @param factorId - The factor ID to remove
 * @returns Promise with removal result
 */
export async function unenrollMFA(factorId: string) {
  try {
    logAuth('Unenrolling MFA factor', { factorId });

    const { error } = await supabase.auth.mfa.unenroll({
      factorId,
    });

    if (error) {
      logAuth('MFA unenrollment failed', { error: error.message });
      return { success: false, error: error as AuthError };
    }

    logAuth('MFA factor removed successfully', { factorId });

    return { success: true, error: null };
  } catch (error) {
    const authError = error as AuthError;
    logger.error(
      'Unexpected error unenrolling MFA',
      {
        error: authError.message,
      },
      'Auth'
    );
    return { success: false, error: authError };
  }
}

/**
 * Get the current MFA authentication assurance level
 * @returns Promise with assurance level data
 */
export async function getMFAAssuranceLevel() {
  try {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (error) {
      logAuth('Failed to get MFA assurance level', { error: error.message });
      return { data: null, error: error as AuthError };
    }

    logAuth('MFA assurance level retrieved', {
      currentLevel: data?.currentLevel,
      nextLevel: data?.nextLevel,
    });

    return {
      data: {
        currentLevel: data?.currentLevel, // 'aal1' (password only) or 'aal2' (password + MFA)
        nextLevel: data?.nextLevel,
        currentAuthenticationMethods: data?.currentAuthenticationMethods || [],
      },
      error: null,
    };
  } catch (error) {
    const authError = error as AuthError;
    logger.error(
      'Unexpected error getting MFA assurance level',
      {
        error: authError.message,
      },
      'Auth'
    );
    return { data: null, error: authError };
  }
}

/**
 * Verify MFA during login (when user has MFA enabled)
 * @param factorId - The factor ID to challenge
 * @param code - The 6-digit TOTP code
 * @returns Promise with verification result
 */
export async function verifyMFALogin(factorId: string, code: string) {
  try {
    logAuth('Verifying MFA for login', { factorId });

    // Create a challenge
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    });

    if (challengeError) {
      logAuth('MFA login challenge failed', { error: challengeError.message });
      return { success: false, error: challengeError as AuthError };
    }

    // Verify the challenge
    const { data, error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    });

    if (error) {
      logAuth('MFA login verification failed', { error: error.message });
      return { success: false, error: error as AuthError };
    }

    logAuth('MFA login verified successfully');

    return { success: true, data, error: null };
  } catch (error) {
    const authError = error as AuthError;
    logger.error(
      'Unexpected error during MFA login verification',
      {
        error: authError.message,
      },
      'Auth'
    );
    return { success: false, error: authError };
  }
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Check if user is currently authenticated with server validation
 * Uses getUser() for server-side token validation instead of local storage
 * @returns Promise<boolean> - True if user is authenticated and token is valid
 * @example
 * ```typescript
 * const isLoggedIn = await isAuthenticated();
 * if (isLoggedIn) {
 *   // Show authenticated content
 * } else {
 *   // Redirect to login
 * }
 * ```
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    // SECURITY FIX: Use getUser() instead of getSession() for better security
    // getUser() validates the token with the server, while getSession() only reads from storage
    const { user } = await getUser();
    return !!user;
  } catch {
    return false;
  }
}

/**
 * Get current user ID with server validation
 * @returns Promise<string | null> - User ID if authenticated, null otherwise
 * @example
 * ```typescript
 * const userId = await getCurrentUserId();
 * if (userId) {
 *   // Load user-specific data
 *   const profile = await getProfile(userId);
 * }
 * ```
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { user } = await getUser();
    return user?.id || null;
  } catch {
    return null;
  }
}

// ==================== EXPORTS ====================

// Export all functions as a default object for backwards compatibility
const authService = {
  signIn,
  signUp,
  signOut,
  resetPassword,
  updatePassword,
  getSession,
  getUser,
  onAuthStateChange,
  isAuthenticated,
  getCurrentUserId,
  resendConfirmationEmail,
  isAuthError,
  // MFA functions
  getMFAFactors,
  enrollMFA,
  verifyMFAEnrollment,
  unenrollMFA,
  getMFAAssuranceLevel,
  verifyMFALogin,
};

export default authService;

export {
  type AuthResponse,
  type SignInRequest,
  type SignUpRequest,
  type PasswordResetRequest,
  type PasswordUpdateRequest,
  type AuthError,
  isAuthError,
} from '../types';
