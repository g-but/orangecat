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

  // setLoading(true); // Keep this commented or manage carefully

  try {
    if (event === 'INITIAL_SESSION') {
      const user = session?.user || null;
      const currentState = useAuthStore.getState();

      // Only set initial state if store is not yet hydrated OR if user ID differs
      if (!currentState.hydrated || currentState.user?.id !== user?.id) {
        if (process.env.NODE_ENV === 'development') {
          console.log('AuthStore onAuthStateChange (INITIAL_SESSION) - Hydrating/Updating initial state.');
        }
        setInitialAuthState(user, session, null); // Initialize profile as null, fetch below
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('AuthStore onAuthStateChange (INITIAL_SESSION) - Store already hydrated with this user, skipping initial set.');
        }
      }

      if (user) {
        // Asynchronously fetch profile, ensuring loading state is managed
        setLoading(true);
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (profileError) {
            if (profileError.code !== 'PGRST116') { // Ignore "No rows found" error
              if (process.env.NODE_ENV === 'development') {
                console.error('AuthStore onAuthStateChange (INITIAL_SESSION) - Profile fetch error:', profileError.message);
              }
              setError(profileError.message);
            }
            setProfile(null);
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.log('AuthStore onAuthStateChange (INITIAL_SESSION) - Profile fetched:', profileData);
            }
            setProfile(profileData);
          }
        } catch (fetchError: any) {
          if (process.env.NODE_ENV === 'development') {
            console.error('AuthStore onAuthStateChange (INITIAL_SESSION) - Profile fetch exception:', fetchError);
          }
          setError(fetchError.message);
          setProfile(null);
        } finally {
          setLoading(false);
        }
      }
      
    } else if (event === 'SIGNED_IN') {
      if (session && session.user) {
        setUser(session.user);
        setSession(session);
        // Fetch profile after sign-in
        setLoading(true);
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profileError) {
            if (profileError.code !== 'PGRST116') { // Ignore "No rows found" error
              if (process.env.NODE_ENV === 'development') {
                console.error('AuthStore onAuthStateChange (SIGNED_IN) - Profile fetch error:', profileError.message);
              }
              setError(profileError.message);
            }
            setProfile(null);
          } else {
             if (process.env.NODE_ENV === 'development') {
              console.log('AuthStore onAuthStateChange (SIGNED_IN) - Profile fetched:', profileData);
            }
            setProfile(profileData);
          }
        } catch (fetchError: any) {
          if (process.env.NODE_ENV === 'development') {
            console.error('AuthStore onAuthStateChange (SIGNED_IN) - Profile fetch exception:', fetchError);
          }
          setError(fetchError.message);
          setProfile(null);
        } finally {
          setLoading(false);
        }
      } else {
        // Should not happen for SIGNED_IN, but handle defensively
        setInitialAuthState(null, null, null);
      }
    } else if (event === 'SIGNED_OUT') {
      setInitialAuthState(null, null, null);
    } else if (event === 'PASSWORD_RECOVERY') {
      // Handle password recovery event if needed
      setError(null); // Clear previous errors
      setLoading(false);
    } else if (event === 'TOKEN_REFRESHED') {
      // Update session if needed, user/profile usually don't change
      setSession(session);
      setError(null);
      setLoading(false);
    } else if (event === 'USER_UPDATED') {
      // Update user object, refetch profile if necessary
      setUser(session?.user || null);
      if (session?.user) {
        setLoading(true);
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (profileError) {
            if (profileError.code !== 'PGRST116') {
              setError(profileError.message);
            }
            setProfile(null);
          } else {
            setProfile(profileData);
          }
        } catch (fetchError: any) {
          setError(fetchError.message);
          setProfile(null);
        } finally {
          setLoading(false);
        }
      }
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('AuthStore onAuthStateChange - General error:', error);
    }
    setError(error.message);
    setLoading(false);
  }
});

// Ensure initial state is potentially set on load
// if (typeof window !== 'undefined') {
//   useAuthStore.getState().setLoading(true); // Set initial loading
// }

// Initialization effect: check for existing session/user on app start
// (Removed: now handled by AuthProvider hydration) 