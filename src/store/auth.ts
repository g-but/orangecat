'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile, ProfileFormData } from '@/types/database'
import { signIn as supabaseClientSignIn, signUp as supabaseClientSignUp, signOut as supabaseClientSignOut } from '@/services/supabase/client'
import supabase from '@/services/supabase/client'
import { updateProfile as supabaseUpdateProfile } from '@/services/supabase/profiles'
import { ProfileService } from '@/services/profileService'
import { logAuth, logger } from '@/utils/logger'

interface AuthState {
  // data
  user: User | null
  session: Session | null
  profile: Profile | null
  // ui state
  isLoading: boolean
  error: string | null
  hydrated: boolean
  authError: string | null
  // actions
  /** Called exactly once in AuthProvider with the *server* values.  */
  setInitialAuthState: (user: User | null, session: Session | null, profile: Profile | null) => void
  /** Wipe local state + storage (used by signOut and invalid sessions). */
  clear: () => void
  /** Explicit sign-out button. */
  signOut: () => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ data: { user: User | null, session: Session | null } | null, error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ data: { user: User | null, session: Session | null } | null, error: Error | null }>
  /** Update user profile */
  updateProfile: (profileData: Partial<Profile>) => Promise<{ error: string | null }>
  /** Set error state */
  setError: (error: string | null) => void
  setAuthError: (error: string | null) => void
  fetchProfile: () => Promise<{ error: string | null }>
}

const STORAGE_KEY = 'orangecat-auth-store';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // ---------------- default state ----------------
      user: null,
      session: null,
      profile: null,
      isLoading: true,     // true until we *know* something
      error: null,
      hydrated: false,
      authError: null,
      // ---------------- actions ----------------
      setInitialAuthState: (user, session, profile) => {
        // ALWAYS trust the server snapshot – even if it's null
        set({
          user,
          session,
          profile,
          isLoading: false,
          hydrated: true,
          error: null,
          authError: null,
        })
      },
      clear: () => {
        set({
          user: null,
          session: null,
          profile: null,
          isLoading: false,
          error: null,
          authError: null,
        })
        // purge persisted copy so the zombie can't rise again
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEY)
          sessionStorage.removeItem(STORAGE_KEY)
        }
      },
      fetchProfile: async () => {
        const { user, session } = get() 
        if (!user || !session) { 
          set({ profile: null, isLoading: false, error: 'User not authenticated' }) 
          return { error: 'User not authenticated' }
        }

        set({ isLoading: true, error: null }) 
        try {
          logAuth('Fetching profile for user:', user.id);
          const { data: { user: freshUser }, error: userError } = await supabase.auth.getUser();
          
          if (userError || !freshUser) {
            logger.error('Failed to get fresh user data:', userError, 'Auth');
            set({ profile: null, isLoading: false, error: 'Authentication expired' }); 
            get().clear(); // Clear auth state if user is no longer valid
            return { error: 'Authentication expired' };
          }

          const { data: profileData, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', freshUser.id)
            .single()

          if (fetchError) {
            logger.error('Profile fetch error:', fetchError, 'Auth');
            set({ profile: null, isLoading: false, error: fetchError.message });
            return { error: fetchError.message };
          }

          if (profileData) {
            set({ profile: profileData, isLoading: false, error: null });
            logAuth('Profile fetched successfully');
            return { error: null };
          } else {
            set({ profile: null, isLoading: false, error: 'Profile not found' });
            return { error: 'Profile not found' };
          }
        } catch (error: any) {
          logger.error('Profile fetch exception:', error, 'Auth');
          set({ profile: null, isLoading: false, error: error.message || 'Failed to fetch profile' });
          return { error: error.message || 'Failed to fetch profile' };
        }
      },
      signOut: async () => {
        set({ isLoading: true, authError: null })
        try {
          get().clear()
          
          if (typeof window !== 'undefined') {
            document.cookie.split(';').forEach(cookie => {
              const trimmedCookie = cookie.trim()
              if (trimmedCookie.startsWith('sb-')) {
                const name = trimmedCookie.split('=')[0]
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
              }
            })
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
                localStorage.removeItem(key)
              }
            })
            sessionStorage.removeItem(STORAGE_KEY)
          }
          
          const { error: supabaseError } = await supabaseClientSignOut(); // Use imported client signOut
          
          if (supabaseError) {
            set({ authError: supabaseError.message, isLoading: false });
            return { error: supabaseError };
          }
          set({ isLoading: false, authError: null });
          return { error: null };
        } catch (e: any) {
          const errMsg = e?.message ?? 'Unknown error during sign out';
          set({ authError: errMsg, isLoading: false });
          return { error: new Error(errMsg) };
        }
      },
      signIn: async (email, password) => {
        // Prevent multiple concurrent sign-in attempts
        const currentState = get();
        if (currentState.isLoading) {
          logger.warn("Sign in already in progress, ignoring duplicate request", undefined, 'Auth');
          return { data: null, error: new Error("Sign in already in progress") };
        }

        set({ isLoading: true, authError: null, error: null });
        
        try {
          logAuth("Attempting sign in with:", email);
          
          // Clear any existing state to prevent conflicts
          set({ 
            user: null,
            session: null,
            profile: null,
            error: null,
            authError: null,
            isLoading: true
          });
          
          const result = await supabaseClientSignIn(email, password); 
          
          if (result.error) {
            logger.error("Sign in error:", result.error.message, 'Auth');
            set({ authError: result.error.message, isLoading: false });
            return { data: null, error: result.error };
          }

          if (result.data && result.data.user && result.data.session) {
            logAuth("Sign in successful, setting user and session");
            
            // Set user and session immediately
            set({ 
              user: result.data.user, 
              session: result.data.session, 
              authError: null
            });
            
            // Fetch profile with retry logic
            let profileFetchAttempts = 0;
            const maxProfileAttempts = 3;
            
            while (profileFetchAttempts < maxProfileAttempts) {
              try {
                logAuth(`Fetching profile after successful login (attempt ${profileFetchAttempts + 1}/${maxProfileAttempts})`);
                const profileResult = await get().fetchProfile();
                
                if (profileResult.error) {
                  logger.warn(`Profile fetch error (attempt ${profileFetchAttempts + 1}):`, profileResult.error, 'Auth');
                  
                  // For the last attempt, don't retry but still succeed login
                  if (profileFetchAttempts === maxProfileAttempts - 1) {
                    logger.warn("Profile fetch failed after all attempts, but login succeeded", undefined, 'Auth');
                    break;
                  }
                  
                  // Wait before retry
                  await new Promise(resolve => setTimeout(resolve, 1000 * (profileFetchAttempts + 1)));
                  profileFetchAttempts++;
                  continue;
                } else {
                  logAuth("Profile fetched successfully");
                  break;
                }
              } catch (profileError) {
                logger.error(`Profile fetch exception (attempt ${profileFetchAttempts + 1}):`, profileError, 'Auth');
                profileFetchAttempts++;
                
                if (profileFetchAttempts < maxProfileAttempts) {
                  await new Promise(resolve => setTimeout(resolve, 1000 * profileFetchAttempts));
                }
              }
            }
            
            set({ isLoading: false });
            
            // Login was successful regardless of profile fetch status
            return { data: result.data, error: null };
          } else {
            // Handle unexpected case where we have no error but also no user/session
            logger.error("Sign in returned no error but also missing user/session data", undefined, 'Auth');
            const errorMessage = "Authentication succeeded but user data is missing. Please try again.";
            set({ authError: errorMessage, isLoading: false });
            return { data: null, error: new Error(errorMessage) };
          }
        } catch (e) {
          logger.error("Sign in exception:", e, 'Auth');
          const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred during sign in. Please try again.";
          set({ 
            authError: errorMessage, 
            isLoading: false,
            user: null,
            session: null,
            profile: null
          });
          return { data: null, error: new Error(errorMessage) };
        }
      },
      signUp: async (email, password) => {
        set({ isLoading: true, authError: null });
        try {
          logAuth("Attempting sign up with:", email);
          const result = await supabaseClientSignUp(email, password);
          
          if (result.error) {
            logger.error("Sign up error:", result.error.message, 'Auth');
            set({ authError: result.error.message, isLoading: false });
            return { data: null, error: result.error };
          }

          if (result.data && result.data.user) {
            set({ 
              user: result.data.user, 
              session: result.data.session, 
              authError: null,
              isLoading: false
            });
            return { data: result.data, error: null };
          } else {
            logger.error("Sign up succeeded but no user data returned", undefined, 'Auth');
            set({ authError: "Registration succeeded but user data is missing", isLoading: false });
            return { data: null, error: new Error("Registration succeeded but user data is missing") };
          }
        } catch (e) {
          logger.error("Sign up exception:", e, 'Auth');
          set({ 
            authError: e instanceof Error ? e.message : "Unknown error during sign up", 
            isLoading: false 
          });
          return { data: null, error: e instanceof Error ? e : new Error("Unknown error during sign up") };
        }
      },
      updateProfile: async (profileData: Partial<Profile>) => {
        const { user } = get();
        if (!user) {
          logger.error('AuthStore: updateProfile failed - User not found.', undefined, 'Auth');
          return { error: 'User not found. Please log in again.' };
        }

        set({ isLoading: true, error: null });
        logAuth('AuthStore: updateProfile started', { user_id: user.id });

        try {
          logAuth('AuthStore: Starting profile update for user:', user.id);
          
          // Validate required fields
          if (!profileData.username && !profileData.display_name && !profileData.bio) {
            const errorMessage = 'At least one field (username, display name, or bio) must be provided for update.';
            set({ isLoading: false, error: errorMessage });
            return { error: errorMessage };
          }

          // Prepare the update data with timestamp, ensuring proper types
          const updateData: ProfileFormData = {
            username: profileData.username || undefined,
            display_name: profileData.display_name || undefined,
            bio: profileData.bio || undefined,
            avatar_url: profileData.avatar_url || undefined,
            banner_url: profileData.banner_url || undefined,
            bitcoin_address: profileData.bitcoin_address || undefined,
          };

          logAuth('AuthStore: Updating profile with data:', updateData);

          const result = await supabaseUpdateProfile(user.id, updateData);
          
          if (result.error) {
            logger.error('AuthStore: Profile update failed:', result.error, 'Auth');
            set({ isLoading: false, error: result.error });
            return { error: result.error };
          }

          if (result.data) {
            logAuth('AuthStore: Profile updated successfully:', result.data);
            set({ profile: result.data, isLoading: false, error: null });
            return { error: null };
          } else {
            const errorMessage = 'Profile update succeeded but no data was returned.';
            logger.warn('AuthStore:', errorMessage, 'Auth');
            set({ isLoading: false, error: errorMessage });
            return { error: errorMessage };
          }
        } catch (error: any) {
          logger.error('AuthStore: Error during profile update:', error, 'Auth');
          const errorMessage = error.message || 'An unexpected error occurred during profile update.';
          set({ isLoading: false, error: errorMessage });
          return { error: errorMessage };
        }
      },
      setError: (error) => {
        set({ error })
      },
      setAuthError: (error) => {
        set({ authError: error })
      },
    }),
    {
      name: 'orangecat-auth-store',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') return sessionStorage;

        // Try to detect storage availability
        const testKey = 'storage-test';
        const testValue = 'test';
        
        try {
          // Try localStorage first
          localStorage.setItem(testKey, testValue);
          const value = localStorage.getItem(testKey);
          localStorage.removeItem(testKey);
          
          if (value === testValue) {
            return localStorage;
          }
        } catch (e) {
          logger.warn('localStorage not available:', e, 'Auth');
        }
        
        try {
          // Fall back to sessionStorage
          sessionStorage.setItem(testKey, testValue);
          const value = sessionStorage.getItem(testKey);
          sessionStorage.removeItem(testKey);
          
          if (value === testValue) {
            return sessionStorage;
          }
        } catch (e) {
          logger.warn('sessionStorage not available:', e, 'Auth');
        }
        
        // If both fail, use memory storage
        logger.warn('No persistent storage available, using memory storage', undefined, 'Auth');
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        profile: state.profile,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hydrated = true;
          
          // Add a safety timeout to prevent stuck loading state
          if (typeof window !== 'undefined' && state.isLoading) {
            logAuth('Auth store: Setting safety timeout for loading state');
            setTimeout(() => {
              const currentState = useAuthStore.getState();
              if (currentState.isLoading) {
                logger.warn('Auth store: Loading state stuck for 10 seconds, resetting', undefined, 'Auth');
                useAuthStore.setState({ isLoading: false });
              }
            }, 10000);
          }
        }
      },
    }
  )
)

// ---------- live session watcher (client only) ----------
if (typeof window !== 'undefined' && supabase) {
  let isUpdating = false; // Prevent concurrent updates
  let lastUpdateTime = 0; // Throttle updates
  let authCheckCount = 0; // Count consecutive auth checks
  let lastEvent = ''; // Track last event to prevent duplicates
  let lastSessionId = ''; // Track session changes
  let lastUserId = ''; // Track user changes

  supabase.auth.onAuthStateChange(async (event, session) => {
    // Much more aggressive throttling - don't process more than one update every 10 seconds
    const now = Date.now();
    if (now - lastUpdateTime < 10000) {
      return; // Skip processing for throttled updates
    }
    
    // Skip if same event and same session happened recently
    const currentSessionId = session?.access_token?.slice(-8) || 'none';
    const currentUserId = session?.user?.id || 'none';
    
    if (event === lastEvent && 
        currentSessionId === lastSessionId && 
        currentUserId === lastUserId &&
        now - lastUpdateTime < 30000) {
      return; // Skip duplicate events within 30 seconds
    }
    
    if (isUpdating) {
      return; // Skip processing for concurrent updates
    }

    isUpdating = true;
    lastUpdateTime = now;
    lastEvent = event;
    lastSessionId = currentSessionId;
    lastUserId = currentUserId;
    authCheckCount++;
    
    // Only log critical events and much less frequently
    const shouldLogEvent = (
      event === 'SIGNED_IN' || 
      event === 'SIGNED_OUT' || 
      event === 'TOKEN_REFRESHED' && authCheckCount % 50 === 1 || // Only every 50th token refresh
      authCheckCount === 1 // First event only
    );
    
    if (shouldLogEvent) {
      logAuth(`Auth state change event ${authCheckCount}: ${event}`, { 
        hasSession: !!session,
        userId: session?.user?.id?.slice(-8) || 'none'
      });
    }
    
    const { setInitialAuthState, clear, fetchProfile } = useAuthStore.getState();

    try {
      if (event === 'SIGNED_OUT') {
        if (shouldLogEvent) {
          logAuth('User signed out, clearing auth state');
        }
        clear();
      } else if (session?.user) {
        // Only update if there's a meaningful change in user or session
        const currentState = useAuthStore.getState();
        const userChanged = currentState.user?.id !== session.user.id;
        const sessionChanged = currentState.session?.access_token !== session.access_token;
        const missingProfile = !currentState.profile && session.user;
        
        if (userChanged || sessionChanged || (event === 'SIGNED_IN' && !currentState.user)) {
          if (shouldLogEvent) {
            logAuth('Auth state changed, updating with session:', {
              userId: session.user.id.slice(-8),
              eventType: event,
              userChanged,
              sessionChanged
            });
          }
          
          setInitialAuthState(session.user, session, userChanged ? null : currentState.profile);
          
          // Fetch profile asynchronously only when needed and throttled
          if (userChanged || missingProfile) {
            setTimeout(() => {
              fetchProfile().catch(error => {
                logger.error('Failed to fetch profile after auth change:', error, 'Auth');
              });
            }, 500); // Increased delay to reduce rapid-fire calls
          }
        }
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // For token refresh, only update session if user exists and session actually changed
        const currentState = useAuthStore.getState();
        if (currentState.user && 
            currentState.session?.access_token !== session.access_token) {
          setInitialAuthState(currentState.user, session, currentState.profile);
        }
      }
    } catch (error) {
      logger.error('Error handling auth state change:', error, 'Auth');
    } finally {
      isUpdating = false;
    }
  });
}