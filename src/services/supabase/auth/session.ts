/**
 * Auth Session Management - Session retrieval, user info, state monitoring
 */

import supabase from '@/lib/supabase/browser';
import { logger, logAuth } from '@/utils/logger';
import type { Session } from '@supabase/supabase-js';
import type { AuthError } from '../types';

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
    logger.error('Unexpected error getting session', { error: authError.message }, 'Auth');
    return { session: null, error: authError };
  }
}

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
    logger.error('Unexpected error getting user', { error: authError.message }, 'Auth');
    return { user: null, error: authError };
  }
}

export function onAuthStateChange(callback: (event: string, session: Session | null) => void) {
  logAuth('Setting up auth state change listener');

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    logAuth('Auth state changed', { event, hasSession: !!session, userId: session?.user?.id });
    callback(event, session);
  });

  return subscription;
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const { user } = await getUser();
    return !!user;
  } catch {
    return false;
  }
}

export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { user } = await getUser();
    return user?.id || null;
  } catch {
    return null;
  }
}
