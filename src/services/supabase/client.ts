'use client'

import { createBrowserClient } from '@supabase/ssr' // Use createBrowserClient for client-side
import { Session, User, SupabaseClient } from '@supabase/supabase-js' // Corrected import
import { Database } from '@/types/database'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Localstorage key for our zustand store (must not collide with Supabase default)
const AUTH_STORE_KEY = 'orangecat-auth-store';

// Add debug logging for environment variables in development
if (process.env.NODE_ENV === 'development') {
  console.log('Supabase URL:', supabaseUrl ? `${supabaseUrl.slice(0, 15)}...` : 'undefined')
  console.log('Supabase Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.slice(0, 6)}...` : 'undefined')
  
  // Add more detailed URL debugging
  if (supabaseUrl) {
    try {
      const url = new URL(supabaseUrl);
      console.log('URL Debug:', {
        fullUrl: supabaseUrl,
        protocol: url.protocol,
        hostname: url.hostname,
        pathname: url.pathname,
        isValid: true
      });
      
      // Check that it's a valid Supabase URL
      if (!url.hostname.includes('supabase') && !url.hostname.includes('supabase.co')) {
        console.error('⚠️ CRITICAL: Supabase URL does not appear to be a valid Supabase domain. Check your .env.local file!');
        console.error('The URL should be in the format: https://[project-id].supabase.co');
      }
      
      // Check that URL has right protocol
      if (url.protocol !== 'https:') {
        console.error('⚠️ CRITICAL: Supabase URL should use https protocol! Current protocol:', url.protocol);
      }
    } catch (error: any) {
      console.error('Invalid Supabase URL:', {
        url: supabaseUrl,
        error: error?.message || 'Unknown error'
      });
      
      // Try to help with common issues
      if (supabaseUrl.includes('http://') || supabaseUrl.includes('https://')) {
        console.error('The URL appears to be using an URL format but is invalid. Check for malformed characters.');
      } else {
        console.error('The URL should start with https:// - make sure your .env.local file has the complete URL.');
      }
    }
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined')
}

// Add a DNS test function to help debug connection issues
async function testDnsResolution() {
  if (typeof window === 'undefined') return; // Only run in browser
  
  const url = new URL(supabaseUrl!);
  const hostname = url.hostname;
  
  console.log(`Testing basic connectivity to: ${hostname}`);
  
  try {
    // Simplest possible health check - just check if the domain resolves
    const startTime = performance.now();
    const response = await fetch(`${url.origin}/auth/v1/health`, {
      method: 'HEAD',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    const endTime = performance.now();
    
    console.log(`Connection test result: ${response.status}, took ${(endTime - startTime).toFixed(2)}ms`);
    // For Supabase, any response is good - it means the server is reachable
    return true;
  } catch (error: any) {
    console.error(`Connection test failed:`, error);
    return false;
  }
}

// Test connection when the module loads
if (typeof window !== 'undefined') {
  // Delay the test to ensure it doesn't block page load
  setTimeout(() => {
    testDnsResolution().then(success => {
      if (!success) {
        console.warn(`⚠️ Potential connectivity issue with Supabase. Network requests may fail.`);
      } else {
        console.log('✅ Supabase connection test successful');
      }
    });
  }, 1000);
}

// Helper to create AbortSignal with timeout
const createTimeoutSignal = (timeoutMs = 10000) => {
  return AbortSignal.timeout(timeoutMs);
};

// Create a single, shared Supabase client instance for browser-side operations.
const supabase = createBrowserClient<Database>(
  supabaseUrl, 
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // use default storageKey to avoid collision with our auth store
      debug: process.env.NODE_ENV === 'development', // Enable auth debugging in development
      storage: {
        getItem: (key) => {
          try {
            // Try localStorage first, then sessionStorage
            let value = null;
            
            try {
              value = localStorage.getItem(key);
            } catch (e) {
              console.warn('Error reading from localStorage:', e);
            }
            
            if (!value) {
              try {
                value = sessionStorage.getItem(key);
              } catch (e) {
                console.warn('Error reading from sessionStorage:', e);
              }
            }
            
            if (!value) return null;
            
            try {
              return JSON.parse(value);
            } catch (e) {
              console.warn('Error parsing storage value:', e);
              return null;
            }
          } catch (error) {
            console.warn('Error reading from storage:', error);
            return null;
          }
        },
        setItem: (key, value) => {
          try {
            const jsonValue = JSON.stringify(value);
            
            // Try to save in both storages for redundancy
            let localStorageSuccess = false;
            let sessionStorageSuccess = false;
            
            try {
              localStorage.setItem(key, jsonValue);
              localStorageSuccess = true;
            } catch (e) {
              console.warn('Unable to save to localStorage:', e);
            }
            
            try {
              sessionStorage.setItem(key, jsonValue);
              sessionStorageSuccess = true;
            } catch (e) {
              console.warn('Unable to save to sessionStorage:', e);
            }
            
            if (!localStorageSuccess && !sessionStorageSuccess) {
              console.error('Failed to store auth data in any storage mechanism');
            }
          } catch (error) {
            console.warn('Error writing to storage:', error);
          }
        },
        removeItem: (key) => {
          try {
            // Clean up from both storages
            try {
              localStorage.removeItem(key);
            } catch (e) {
              console.warn('Unable to remove from localStorage:', e);
            }
            
            try {
              sessionStorage.removeItem(key);
            } catch (e) {
              console.warn('Unable to remove from sessionStorage:', e);
            }
          } catch (error) {
            console.warn('Error removing from storage:', error);
          }
        }
      }
    },
    // Top-level cookieOptions property (not inside auth)
    cookieOptions: {
      path: '/',
      sameSite: 'lax', // Works on http://localhost and https production
      secure: process.env.NODE_ENV === 'production',
    },
    db: {
      schema: 'public'
    }
  }
)

// Initialize auth state and set up session refresh
if (typeof window !== 'undefined') {
  // Global auth state check variable to prevent race conditions
  (window as any).__checkingAuthState = false;
  (window as any).__lastAuthCheck = 0;
  
  // Function to synchronize auth state across the app
  const synchronizeAuthState = async () => {
    // Prevent multiple simultaneous checks
    if ((window as any).__checkingAuthState) {
      return;
    }
    
    // Don't check too frequently
    const now = Date.now();
    if (now - (window as any).__lastAuthCheck < 2000) { // Don't check more than once every 2 seconds
      return;
    }
    
    (window as any).__checkingAuthState = true;
    (window as any).__lastAuthCheck = now;
    
    try {
      // Get current session state
      const { data: { session } }: { data: { session: Session | null } } = await supabase.auth.getSession();
      
      // Get user from a separate call to ensure consistency
      const { data: { user } }: { data: { user: User | null } } = await supabase.auth.getUser();
      
      // Check for mismatched state
      if ((session && !user) || (!session && user)) {
        console.warn('Detected inconsistent auth state, forcing synchronization');
        
        // If we have session but no user, try refreshing session
        if (session && !user) {
          await supabase.auth.refreshSession();
        }
        
        // If we have user but no session, clear the state
        if (!session && user) {
          await supabase.auth.signOut();
        }
      }
      
      // If session is about to expire (less than 5 mins), refresh it
      if (session && ((session.expires_at || 0) - Date.now()/1000 < 300)) {
        console.log('Session expiring soon, refreshing...');
        await supabase.auth.refreshSession();
      }
    } catch (error) {
      console.error('Error during auth state synchronization:', error);
    } finally {
      (window as any).__checkingAuthState = false;
    }
  };
  
  // Set up session refresh interval
  const refreshIntervalId = setInterval(async () => {
    await synchronizeAuthState();
  }, 1000 * 60 * 2); // Check every 2 minutes
  
  // Run initial synchronization after a short delay
  setTimeout(synchronizeAuthState, 2000);
  
  // Listen for storage events to detect changes in other tabs
  window.addEventListener('storage', (event) => {
    if (event.key === AUTH_STORE_KEY || event.key === null) {
      // If specific storage key changed or was cleared, synchronize state
      synchronizeAuthState();
    }
  });
  
  // Add visibility change listener to sync on tab activation
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      synchronizeAuthState();
    }
  });
  
  // Check initial session
  supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
    if (session) {
      console.log('Initial session found:', session.user.id);
      
      // Attempt an immediate refresh if session exists but might be stale
      if (Math.floor((session.expires_at || 0) - Date.now() / 1000) < 600) { // Less than 10 minutes left
        console.log('Session expiring soon, refreshing...');
        supabase.auth.refreshSession().catch(err => {
          console.warn('Error refreshing initial session:', err);
        });
      }
    } else {
      console.log('No initial session found');
    }
  });
}

// Expose the client to window for debugging purposes
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.supabase = supabase;
  
  // Add a debug helper function
  // @ts-ignore
  window.testProfileUpdate = async (userId, field = 'bio', value = 'Test from console ' + new Date().toISOString()) => {
    console.log('%cDEBUG: Manual profile update test starting', 'background: #333; color: #fff', { userId, field, value });
    
    try {
      // @ts-ignore - Ignore type errors for testing function
      const result = await supabase
        .from('profiles')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select('*')
        .single();
        
      console.log('%cDEBUG: Manual test result', 'background: green; color: white', result);
      return result;
    } catch (error) {
      console.error('%cDEBUG: Manual test error', 'background: red; color: white', error);
      throw error;
    }
  };
  
  // Add a direct manual fetch test helper
  // @ts-ignore
  window.testDirectFetch = async (userId) => {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase credentials');
      return;
    }
    
    const value = 'Test direct fetch ' + new Date().toISOString();
    console.log('%cDIRECT FETCH TEST: Starting', 'background: #333; color: #fff', { userId });
    
    try {
      // Construct the same request supabase-js would make but manually
      const url = `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`;
      const headers = {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      };
      
      console.log('Sending manual fetch to:', url.replace(supabaseAnonKey, '[REDACTED]'));
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ bio: value, updated_at: new Date().toISOString() })
      });
      
      const result = await response.json();
      console.log('%cDIRECT FETCH RESULT:', 'background:green; color:white', {
        status: response.status,
        ok: response.ok,
        data: result
      });
      
      return { status: response.status, data: result };
    } catch (error) {
      console.error('%cDIRECT FETCH ERROR:', 'background:red; color:white', error);
      throw error;
    }
  };
  
  // Add a network connectivity tester
  // @ts-ignore
  window.testSupabaseConnection = async () => {
    console.log('%cTesting Supabase connectivity...', 'background: #333; color: #fff');
    return testDnsResolution();
  };
  
  // Add a function to check for duplicate clients
  // @ts-ignore
  window.checkForDuplicateClients = () => {
    // @ts-ignore
    const all = Object.values(window).filter(x => x?.constructor?.name === 'SupabaseClient');
    console.log('Client count', all.length);
    return all.length;
  };
  
  // Add a function to check if profile exists
  // @ts-ignore
  window.checkProfile = async (userId) => {
    if (!userId) {
      userId = '6a3398ea-e4ca-49e1-807b-41b3a73b49aa';
    }
    console.log('Checking if profile exists for', userId);
    // @ts-ignore
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId);
    console.log('Profile check result:', { data, error });
    
    if (!data || data.length === 0) {
      console.log('Profile does not exist! You need to create it first.');
    }
    
    return { data, error };
  };
  
  // Add a function to create profile
  // @ts-ignore
  window.createProfile = async (userId) => {
    if (!userId) {
      userId = '6a3398ea-e4ca-49e1-807b-41b3a73b49aa';
    }
    console.log('Creating profile for', userId);
    // @ts-ignore
    const { data, error } = await supabase.from('profiles').insert({
      id: userId,
      username: 'mao',
      display_name: 'butaeff',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).select();
    
    console.log('Profile creation result:', { data, error });
    return { data, error };
  };

  // Add auth state debug helper
  // @ts-ignore
  window.debugAuth = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    const storedSession = localStorage.getItem(AUTH_STORE_KEY);
    
    console.log('Auth Debug:', {
      user,
      userError,
      session,
      sessionError,
      storedSession: storedSession ? JSON.parse(storedSession) : null,
      accessToken: session?.access_token ? `${session.access_token.slice(0, 10)}...` : null,
      refreshToken: session?.refresh_token ? `${session.refresh_token.slice(0, 10)}...` : null,
      isUserObject: user instanceof Object,
      isSessionObject: session instanceof Object
    });
    
    return { user, session, userError, sessionError };
  };
  
  // Add session refresh helper
  // @ts-ignore
  window.refreshSession = async (): Promise<{ data: { session: Session | null }, error: Error | null }> => {
    const { data, error } = await supabase.auth.refreshSession();
    console.log('Session refresh result:', { data, error });
    return { data, error };
  };

  // Add auto-test function
  // @ts-ignore
  window.autoTestAuth = async (): Promise<{ success: boolean; error?: string; session?: boolean; user?: boolean; profile?: boolean; update?: boolean; refresh?: boolean; }> => {
    console.log('%cStarting Auth Auto-Test...', 'background: #333; color: #fff');
    
    try {
      // 1. Test session
      const { data: { session }, error: sessionError }: { data: { session: Session | null }, error: Error | null } = await supabase.auth.getSession();
      console.log('1. Session Test:', { hasSession: !!session, error: sessionError });
      
      if (sessionError) {
        throw new Error(`Session error: ${sessionError.message}`);
      }
      
      if (!session) {
        throw new Error('No active session found');
      }
      
      // 2. Test user
      const { data: { user }, error: userError }: { data: { user: User | null }, error: Error | null } = await supabase.auth.getUser();
      console.log('2. User Test:', { hasUser: !!user, error: userError });
      
      if (userError) {
        throw new Error(`User error: ${userError.message}`);
      }
      
      if (!user) {
        throw new Error('No authenticated user found');
      }
      
      // 3. Test profile access
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      console.log('3. Profile Access Test:', { hasProfile: !!profile, error: profileError });
      
      if (profileError) {
        console.warn(`Profile access warning (may not be an error): ${profileError.message}`);
      }
      
      // 4. Test profile update (only if profile exists or no error accessing)
      let updateResult = null;
      if (!profileError) {
        const testUpdate = {
          bio: `Test update ${new Date().toISOString()}`,
          updated_at: new Date().toISOString()
        };
        
        const { data: updateData, error: updateError } = await supabase
          .from('profiles')
          .update(testUpdate)
          .eq('id', user.id)
          .select('*')
          .single();
        updateResult = updateData;
        
        console.log('4. Profile Update Test:', { success: !!updateResult, error: updateError });
        
        if (updateError) {
          throw new Error(`Profile update error: ${updateError.message}`);
        }
      }
      
      // 5. Test session refresh
      const { data: refreshData, error: refreshError }: { data: { session: Session | null, user: User | null }, error: Error | null } = await supabase.auth.refreshSession();
      console.log('5. Session Refresh Test:', { 
        success: !!refreshData.session, 
        error: refreshError 
      });
      
      if (refreshError) {
        throw new Error(`Session refresh error: ${refreshError.message}`);
      }
      
      console.log('%c✅ Auth Auto-Test Completed Successfully', 'background: green; color: white');
      return {
        success: true,
        session: !!session,
        user: !!user,
        profile: !!profile,
        update: !!updateResult,
        refresh: !!refreshData.session
      };
    } catch (error: any) {
      console.error('%c❌ Auth Auto-Test Failed:', 'background: red; color: white', error);
      return {
        success: false,
        error: error.message
      };
    }
  };
  
  // Run auto-test on load
  setTimeout(() => {
    // @ts-ignore
    window.autoTestAuth().then(result => {
      if (!result.success) {
        console.warn('Auth auto-test failed, attempting to fix...');
        // Try to refresh session
        supabase.auth.refreshSession().then(({ data, error }: { data: { session: Session | null, user: User | null }, error: Error | null }) => {
          if (error) {
            console.error('Failed to fix auth:', error);
          } else {
            console.log('Auth fixed, running test again...');
            // @ts-ignore
            window.autoTestAuth();
          }
        });
      }
    });
  }, 2000); // Wait 2 seconds after page load
}

// Export the single instance
export default supabase

// Auth helpers with proper type handling (using the exported supabase instance)
export const signIn = async (email: string, password: string): Promise<{ data: { user: User | null, session: Session | null }, error: Error | null }> => {
  console.log('Attempting sign in with Supabase client...');
  console.time('SupabaseSignIn'); // Start timer
  try {
    // Clean up any existing storage to avoid conflicts - this is okay before sign-in
    if (typeof window !== 'undefined') {
      try {
        console.log('Clearing potential stale auth storage...');
        localStorage.removeItem(AUTH_STORE_KEY);
        sessionStorage.removeItem(AUTH_STORE_KEY);
        // Also clear Supabase specific keys if they exist, more aggressively
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key);
          }
        });
        console.log('Stale auth storage cleared.');
      } catch (e) {
        console.warn('Error clearing storage before sign in:', e);
      }
    }

    console.log(`Calling supabase.auth.signInWithPassword for ${email}...`);
    // Direct call to Supabase client - let it handle its own timeouts / errors primarily
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    console.timeEnd('SupabaseSignIn'); // End timer

    if (error) {
      console.error('Supabase client signInWithPassword returned error:', error);
      // If this fails, we can consider a direct fetch as a secondary fallback if absolutely necessary
      // For now, let's see if this simpler approach works.
      return { data: { user: null, session: null }, error };
    }

    if (data?.session && data?.user) {
      console.log('Supabase client signInWithPassword successful. User:', data.user.id, 'Session exists:', !!data.session);
      // Explicitly set session to ensure cookies are written for middleware
      try {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });
      } catch (setErr) {
        console.warn('Error calling setSession', setErr);
      }
      return { data, error: null };
    } else {
      console.error('Supabase client signInWithPassword returned no error but missing session, user, or both.', { data });
      return { 
        data: { user: null, session: null }, 
        error: new Error('Authentication response incomplete. Missing session or user data.') 
      };
    }

  } catch (e: any) {
    console.timeEnd('SupabaseSignIn'); // End timer in case of exception
    console.error('Exception during supabase.auth.signInWithPassword call or processing:', e);
    return { data: { user: null, session: null }, error: e };
  }
}

export const signUp = async (email: string, password: string): Promise<{ data: { user: User | null, session: Session | null }, error: Error | null }> => {
  // Keeping signUp simple as it wasn't the primary issue
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      // data: { email_confirmed: true } // This might be better handled by Supabase default settings or post-signup flow
    },
  })
  if (error) console.error("Supabase signUp error:", error.message);
  else console.log("Supabase signUp successful. User:", data.user?.id, "Session:", !!data.session);
  return { data, error }
}

export const signOut = async (): Promise<{ error: Error | null }> => {
  console.log('Starting sign out process...');
  let apiError: Error | null = null;

  try {
    // Attempt API sign out first
    const { error } = await supabase.auth.signOut();
    if (error) {
      apiError = error;
      console.warn('Supabase API signOut error:', error.message);
    } else {
      console.log('Supabase API signOut successful.');
    }
  } catch (e: any) {
    apiError = e;
    console.error('Exception during Supabase API signOut:', e.message);
  }

  // Always clear local storage and cookies, regardless of API call outcome
  if (typeof window !== 'undefined') {
    try {
      console.log('Clearing local auth state and cookies post-API call...');
      localStorage.removeItem(AUTH_STORE_KEY);
      sessionStorage.removeItem(AUTH_STORE_KEY);
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });
      document.cookie.split(';').forEach(cookie => {
        const trimmedCookie = cookie.trim();
        if (trimmedCookie.startsWith('sb-') || trimmedCookie.includes('supabase')) {
          const name = trimmedCookie.split('=')[0];
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });
      console.log('Local auth state and cookies cleared.');
    } catch (e) {
      console.warn('Error clearing storage/cookies during sign out:', e);
    }
  }
  
  // Redirect to home page
  if (typeof window !== 'undefined') {
    console.log('Redirecting to home page after signOut...');
    window.location.href = '/';
  }

  // If there was an API error, return it, otherwise null for success
  return { error: apiError };
}

export const resetPassword = async (email: string): Promise<{ data: {} | null, error: Error | null }> => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email)
  return { data, error }
}

export const updatePassword = async (newPassword: string): Promise<{ data: { user: User | null }, error: Error | null }> => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  })
  return { data, error }
}

// Profile helpers with proper type handling
export const getProfile = async (userId: string): Promise<{ data: any, error: Error | null }> => {
  // @ts-ignore - Ignore type error for helper function
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

export const updateProfile = async (userId: string, updates: any): Promise<{ data: any, error: any, status: string | number }> => {
  console.log(`Supabase client: Updating profile for userId ${userId} with data:`, updates);
  
  try {
    // Enable debug mode for this request
    // @ts-ignore - Ignore type error for helper function
    const { data, error, status, statusText } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select('*')
      .single();
    
    console.log('Supabase updateProfile complete. Status:', status, statusText);
    
    if (error) {
      console.error('Supabase client updateProfile error:', error);
    } else {
      console.log('Supabase client updateProfile success:', data);
    }
    
    return { data, error, status };
  } catch (err) {
    console.error('Supabase client updateProfile exception:', err);
    return { data: null, error: err, status: 'error' };
  }
}

// Funding page helpers with proper type handling
export const getFundingPage = async (username: string): Promise<{ data: any, error: Error | null }> => {
  // @ts-ignore - Ignore type error for helper function
  const { data, error } = await supabase
    .from('funding_pages')
    .select('*')
    .eq('username', username)
    .single()
  return { data, error }
}

export const createFundingPage = async (pageData: any): Promise<{ data: any, error: Error | null }> => {
  const { data, error } = await supabase
    .from('funding_pages')
    .insert(pageData)
    .select()
    .single()
  return { data, error }
}

export const updateFundingPage = async (pageId: string, updates: any): Promise<{ data: any, error: Error | null }> => {
  // @ts-ignore - Ignore type error for helper function
  const { data, error } = await supabase
    .from('funding_pages')
    .update(updates)
    .eq('id', pageId)
  return { data, error }
} 