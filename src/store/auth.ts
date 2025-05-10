import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createBrowserClient } from '@supabase/ssr'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '@/types/database'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  isLoading: boolean
  isAdmin: boolean
  error: string | null
  hydrated: boolean

  setInitialAuthState: (user: User | null, session: Session | null, profile: Profile | null) => void
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void

  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<{ error?: string }>
  checkProfileCompletion: () => boolean
  updateProfile: (profileData: Partial<Profile>) => Promise<{ error: string | null }>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      profile: null,
      isLoading: true,
      isAdmin: false,
      error: null,
      hydrated: false,

      setInitialAuthState: (user, session, profile) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('AuthStore - setInitialAuthState: Setting resolved auth state:', { user, session, profile });
        }
        set({
          user,
          session,
          profile,
          isLoading: false,
          hydrated: true,
          error: null,
          isAdmin: user?.app_metadata?.role === 'admin',
        });
        if (process.env.NODE_ENV === 'development') {
          console.log('AuthStore - setInitialAuthState: State updated, hydrated set to true, isLoading false');
        }
      },

      setUser: (user) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('AuthStore - Setting user:', user);
        }
        set({ user, isAdmin: user?.app_metadata?.role === 'admin' });
      },

      setSession: (session) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('AuthStore - Setting session:', session);
        }
        set({ session });
      },

      setProfile: (profile) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('AuthStore - Setting profile:', profile);
        }
        set({ profile });
      },

      setLoading: (isLoading) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('AuthStore - Setting loading:', isLoading);
        }
        set({ isLoading });
      },

      setError: (error) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('AuthStore - Setting error:', error);
        }
        set({ error });
      },

      signIn: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;
          if (process.env.NODE_ENV === 'development') {
            console.log('AuthStore - signIn: Successful, onAuthStateChange will take over.');
          }
          return {};
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          return { error: error.message };
        }
      },

      signUp: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
            },
          });

          if (error) throw error;
          if (!data.user) throw new Error('No user returned from sign up');
          
          const userId = data.user.id;
          const userEmail = data.user.email;
          const now = new Date().toISOString();
          const { data: newProfile, error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              username: userEmail?.split('@')[0] || null,
              display_name: userEmail?.split('@')[0] || null,
              avatar_url: null,
              bio: null,
              bitcoin_address: null,
              created_at: now,
              updated_at: now,
            })
            .select()
            .single();

          if (profileError) throw profileError;

          if (process.env.NODE_ENV === 'development') {
            console.log('AuthStore - signUp: Successful, profile created. onAuthStateChange will update store.');
          }
          return {};
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          return { error: error.message };
        }
      },

      signOut: async () => {
        set({ isLoading: true, error: null });
        try {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
          if (process.env.NODE_ENV === 'development') {
            console.log('AuthStore - signOut: Successful, onAuthStateChange will clear state.');
          }
          return { error: undefined };
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          return { error: error.message };
        }
      },

      checkProfileCompletion: () => {
        const { profile } = get()
        return !!(profile?.username && profile?.bitcoin_address)
      },

      updateProfile: async (profileData) => {
        try {
          const { user } = get()
          if (!user) {
            throw new Error('User not found')
          }

          const { data, error } = await supabase
            .from('profiles')
            .update(profileData)
            .eq('id', user.id)
            .select()
            .single()

          if (error) throw error

          set({ profile: data })
          return { error: null }
        } catch (error: any) {
          return { error: error.message }
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('AuthStore - onRehydrateStorage: Store has been rehydrated from localStorage.');
        }
      },
    }
  )
)

supabase.auth.onAuthStateChange(async (event, session) => {
  const { setUser, setSession, setProfile, setLoading, setError, setInitialAuthState } = useAuthStore.getState();
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`AuthStore onAuthStateChange - Event: ${event}`, session ? { userId: session.user?.id } : { session: null });
  }

  // setLoading(true); // Commenting this out to prevent overriding AuthProvider's initial isLoading: false

  try {
    if (event === 'INITIAL_SESSION') {
      if (session && session.user) {
        const existingState = useAuthStore.getState();
        let profileToSetInitially: Profile | null = null;
        if (existingState.profile && existingState.user?.id === session.user.id) {
          profileToSetInitially = existingState.profile;
        }
        setInitialAuthState(session.user, session, profileToSetInitially);

        // Asynchronously fetch profile
        try {
          setLoading(true);
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profileError) {
            if (process.env.NODE_ENV === 'development') {
              console.error('AuthStore onAuthStateChange (INITIAL_SESSION) - Profile fetch error:', profileError.message);
            }
            setError(profileError.message);
            setProfile(null);
          } else {
            setProfile(profileData as Profile); // Cast to Profile
          }
        } catch (err: any) {
          if (process.env.NODE_ENV === 'development') {
            console.error('AuthStore onAuthStateChange (INITIAL_SESSION) - Generic profile fetch error:', err.message);
          }
          setError(err.message);
          setProfile(null);
        } finally {
          setLoading(false);
        }
      } else {
        setInitialAuthState(null, null, null);
      }
    } else if (event === 'SIGNED_IN') {
      if (session && session.user) {
        const existingState = useAuthStore.getState();
        let profileToSetInitially: Profile | null = null;
        if (existingState.profile && existingState.user?.id === session.user.id) {
          profileToSetInitially = existingState.profile;
        }
        setInitialAuthState(session.user, session, profileToSetInitially);

        // Asynchronously fetch and update the profile.
        try {
          setLoading(true);
          if (process.env.NODE_ENV === 'development') {
            console.log('AuthStore onAuthStateChange (SIGNED_IN) - Fetching profile for user:', session.user.id);
          }
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            if (process.env.NODE_ENV === 'development') {
              console.error('AuthStore onAuthStateChange (SIGNED_IN) - Profile fetch error:', profileError.message);
            }
            setError(profileError.message);
            setProfile(null); // Explicitly set profile to null on error
          } else {
            setProfile(profileData as Profile); // Update the profile in the store, Cast to Profile
          }
        } catch (err: any) {
          if (process.env.NODE_ENV === 'development') {
            console.error('AuthStore onAuthStateChange (SIGNED_IN) - Generic profile fetch error:', err.message);
          }
          setError(err.message);
          setProfile(null); // Explicitly set profile to null on error
        } finally {
          setLoading(false);
        }
      } else {
        // No session or user, treat as signed out
        setInitialAuthState(null, null, null);
      }
    } else if (event === 'SIGNED_OUT') {
      setInitialAuthState(null, null, null);
    } else if (event === 'USER_UPDATED') {
      if (session && session.user) {
        // User data might have updated. Refresh user, session. isLoading: false.
        // Profile will be refetched.
        const existingState = useAuthStore.getState();
        let profileToSetInitially: Profile | null = null;
        if (existingState.profile && existingState.user?.id === session.user.id) {
          profileToSetInitially = existingState.profile;
        }
        setInitialAuthState(session.user, session, profileToSetInitially); // Profile initially as existing or null, will be updated

        try {
          setLoading(true);
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            if (process.env.NODE_ENV === 'development') {
              console.error('AuthStore onAuthStateChange (USER_UPDATED) - Profile fetch error:', profileError.message);
            }
            setError(profileError.message);
            setProfile(null); // Clear profile if fetch fails
          } else {
            setProfile(profileData as Profile); // Cast to Profile
          }
        } catch (err: any) {
          if (process.env.NODE_ENV === 'development') {
            console.error('AuthStore onAuthStateChange (USER_UPDATED) - Generic profile fetch error:', err.message);
          }
          setError(err.message);
          setProfile(null); // Clear profile on generic error
        } finally {
          setLoading(false);
        }
      } else {
        // User logged out or session became invalid
        setInitialAuthState(null, null, null);
      }
    } else if (event === 'TOKEN_REFRESHED') {
      if (session && session.user) {
        const existingProfile = useAuthStore.getState().profile;
        // Ensure existingProfile matches Profile | null type for setInitialAuthState
        setInitialAuthState(session.user, session, existingProfile as Profile | null);
      } else {
        setInitialAuthState(null, null, null);
      }
    } else if (event === 'PASSWORD_RECOVERY') {
      setLoading(false);
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log(`AuthStore onAuthStateChange - Unhandled Event: ${event}. Resetting loading state.`);
      }
      setLoading(false);
    }
  } catch (e: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Critical error in onAuthStateChange handler's main try/catch:", e.message);
    }
    setError(e.message);
    setInitialAuthState(null, null, null);
  }
});

// Initialization effect: check for existing session/user on app start
// (Removed: now handled by AuthProvider hydration) 