'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth';
import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';

/**
 * AuthProvider - Syncs Supabase auth state with Zustand store
 *
 * This component establishes the critical onAuthStateChange listener
 * that keeps client-side state synchronized with Supabase auth events.
 *
 * Key events handled:
 * - INITIAL_SESSION: Set initial auth state from stored session
 * - SIGNED_IN: User successfully authenticated
 * - SIGNED_OUT: User logged out or session expired
 * - TOKEN_REFRESHED: Access token was refreshed
 * - USER_UPDATED: User profile/metadata changed
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setInitialAuthState = useAuthStore(state => state.setInitialAuthState);
  const fetchProfile = useAuthStore(state => state.fetchProfile);
  const clear = useAuthStore(state => state.clear);
  const listenerRef = useRef<{ data: { subscription: { unsubscribe: () => void } } } | null>(null);

  useEffect(() => {
    // Prevent duplicate listeners
    if (listenerRef.current) {
      logger.debug('AuthProvider listener already exists, skipping setup', undefined, 'Auth');
      return;
    }

    logger.info('Setting up auth state change listener', undefined, 'Auth');

    // Clear any stale sessionStorage data on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      const storedUser = useAuthStore.getState().user;

      // If session user ID doesn't match stored user ID, clear stale data
      if (storedUser && session?.user && storedUser.id !== session.user.id) {
        logger.warn(
          'Session mismatch detected - clearing stale auth data',
          {
            storedUserId: storedUser.id,
            sessionUserId: session.user.id,
          },
          'Auth'
        );
        clear();
        setInitialAuthState(session.user, session, null);
        fetchProfile().catch(err => {
          logger.warn('Failed to fetch profile after session sync', { error: err }, 'Auth');
        });
      }
    });

    // Set up the auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      logger.debug(
        'Auth state change detected',
        {
          event,
          hasSession: !!session,
          hasUser: !!session?.user,
        },
        'Auth'
      );

      // Handle different auth events
      switch (event) {
        case 'INITIAL_SESSION':
          // Initial session load - set state with existing session
          if (session?.user) {
            // Always clear profile on initial session to prevent stale data
            setInitialAuthState(session.user, session, null);
            // Fetch profile in background
            fetchProfile().catch(err => {
              logger.warn('Failed to fetch profile on initial session', { error: err }, 'Auth');
            });
          } else {
            setInitialAuthState(null, null, null);
          }
          break;

        case 'SIGNED_IN':
          // User just signed in - set user and session
          if (session?.user) {
            logger.info('User signed in', { userId: session.user.id }, 'Auth');
            // Always clear profile on sign in to prevent stale data from previous user
            setInitialAuthState(session.user, session, null);
            // Fetch profile in background (only once - AuthStore signIn no longer fetches)
            // Use a small delay to ensure state is set before fetching
            setTimeout(() => {
              fetchProfile().catch(err => {
                logger.warn('Failed to fetch profile after sign in', { error: err }, 'Auth');
              });
            }, 100);
          }
          break;

        case 'SIGNED_OUT':
          // User signed out or session expired
          logger.info('User signed out', undefined, 'Auth');
          clear();
          break;

        case 'TOKEN_REFRESHED':
          // Token was refreshed - update session
          if (session?.user) {
            logger.debug('Token refreshed', { userId: session.user.id }, 'Auth');
            setInitialAuthState(session.user, session, null);
          }
          break;

        case 'USER_UPDATED':
          // User metadata or profile updated
          if (session?.user) {
            logger.debug('User updated', { userId: session.user.id }, 'Auth');
            setInitialAuthState(session.user, session, null);
            // Re-fetch profile to get latest data
            fetchProfile().catch(err => {
              logger.warn('Failed to fetch profile after user update', { error: err }, 'Auth');
            });
          }
          break;

        case 'PASSWORD_RECOVERY':
          // User is in password recovery flow
          logger.info('Password recovery event detected', undefined, 'Auth');
          // Session should contain the recovery token
          if (session?.user) {
            setInitialAuthState(session.user, session, null);
          }
          break;

        default:
          logger.warn('Unknown auth event', { event }, 'Auth');
      }
    });

    listenerRef.current = { data: { subscription } };

    // Cleanup on unmount
    return () => {
      if (listenerRef.current) {
        logger.debug('Cleaning up auth state change listener', undefined, 'Auth');
        listenerRef.current.data.subscription.unsubscribe();
        listenerRef.current = null;
      }
    };
  }, [setInitialAuthState, fetchProfile, clear]);

  return <>{children}</>;
}
