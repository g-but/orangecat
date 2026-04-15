/**
 * Auth Operations - Sign in, sign up, sign out, password management
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
import { handleAuthError } from './errors';

export async function signIn({ email, password }: SignInRequest): Promise<AuthResponse> {
  try {
    logAuth('Attempting to sign in user', { email });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Authentication request timed out')), 20000);
    });

    const authPromise = supabase.auth.signInWithPassword({ email, password });
    const { data, error } = await Promise.race([authPromise, timeoutPromise]);

    if (error) {
      const enhancedError = handleAuthError(error, 'sign in');
      logAuth('Sign in failed', { email, error: enhancedError.message });
      return { data: { user: null, session: null }, error: enhancedError };
    }

    logAuth('Sign in successful', { email, userId: data.user?.id, hasSession: !!data.session });
    return { data, error: null };
  } catch (error) {
    const enhancedError = handleAuthError(error, 'sign in');
    logger.error(
      'Unexpected error during sign in',
      { email, error: enhancedError.message },
      'Auth'
    );
    return { data: { user: null, session: null }, error: enhancedError };
  }
}

export async function signUp({
  email,
  password,
  emailRedirectTo,
}: SignUpRequest): Promise<AuthResponse> {
  try {
    logAuth('Attempting to sign up user', { email });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Registration request timed out')), 25000);
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.orangecat.ch';

    const authPromise = supabase.auth.signUp({
      email,
      password,
      options: {
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
      { email, error: enhancedError.message },
      'Auth'
    );
    return { data: { user: null, session: null }, error: enhancedError };
  }
}

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
    logger.error('Unexpected error during sign out', { error: authError.message }, 'Auth');
    return { error: authError };
  }
}

export async function resetPassword({
  email,
}: PasswordResetRequest): Promise<{ error: AuthError | null }> {
  try {
    logAuth('Attempting password reset', { email });

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
    logger.error('Unexpected error during password reset', { error: errorMessage, email });
    return { error: { message: errorMessage, name: 'ResetError' } as AuthError };
  }
}

export async function updatePassword({
  newPassword,
}: PasswordUpdateRequest): Promise<{ error: AuthError | null }> {
  try {
    logAuth('Attempting password update');

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      logAuth('Password update failed', { error: error.message });
      return { error: error as AuthError };
    }

    logAuth('Password updated successfully');
    return { error: null };
  } catch (error) {
    const authError = error as AuthError;
    logger.error('Unexpected error during password update', { error: authError.message }, 'Auth');
    return { error: authError };
  }
}

// NOTE: Anonymous sign-in requires "Allow anonymous sign-ins" to be enabled
// in Supabase Dashboard > Authentication > Providers > Anonymous
export async function signInAnonymously(): Promise<AuthResponse> {
  try {
    logAuth('Attempting anonymous sign-in');

    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
      const enhancedError = handleAuthError(error, 'anonymous sign-in');
      logAuth('Anonymous sign-in failed', { error: enhancedError.message });
      return { data: { user: null, session: null }, error: enhancedError };
    }

    logAuth('Anonymous sign-in successful', { userId: data.user?.id });
    return { data, error: null };
  } catch (error) {
    const enhancedError = handleAuthError(error, 'anonymous sign-in');
    logger.error('Unexpected error during anonymous sign-in', { error: enhancedError.message }, 'Auth');
    return { data: { user: null, session: null }, error: enhancedError };
  }
}

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
    logger.error('Unexpected error resending confirmation', { error: errorMessage });
    return { error: { message: errorMessage, name: 'ResendError' } as AuthError };
  }
}
