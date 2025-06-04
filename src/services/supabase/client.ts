'use client'

import { createBrowserClient } from '@supabase/ssr' // Use createBrowserClient for client-side
import { Session, User, SupabaseClient } from '@supabase/supabase-js' // Corrected import
import { Database } from '@/types/database'
import { logSupabase, logger } from '@/utils/logger'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Localstorage key for our zustand store (must not collide with Supabase default)
const AUTH_STORE_KEY = 'orangecat-auth-store';

// Add debug logging for environment variables in development
logSupabase('Supabase URL:', supabaseUrl ? `${supabaseUrl.slice(0, 15)}...` : 'undefined')
logSupabase('Supabase Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.slice(0, 6)}...` : 'undefined')

// Add more detailed URL debugging
if (supabaseUrl) {
  try {
    const url = new URL(supabaseUrl);
    logSupabase('URL Debug:', {
      fullUrl: supabaseUrl,
      protocol: url.protocol,
      hostname: url.hostname,
      pathname: url.pathname,
      isValid: true
    });
    
    // Check that it's a valid Supabase URL
    if (!url.hostname.includes('supabase') && !url.hostname.includes('supabase.co')) {
      logger.error('⚠️ CRITICAL: Supabase URL does not appear to be a valid Supabase domain. Check your .env.local file!', undefined, 'Supabase');
      logger.error('The URL should be in the format: https://[project-id].supabase.co', undefined, 'Supabase');
    }
    
    // Check that URL has right protocol
    if (url.protocol !== 'https:') {
      logger.error('⚠️ CRITICAL: Supabase URL should use https protocol! Current protocol:', url.protocol, 'Supabase');
    }
  } catch (error: any) {
    logger.error('Invalid Supabase URL:', {
      url: supabaseUrl,
      error: error?.message || 'Unknown error'
    }, 'Supabase');
    
    // Try to help with common issues
    if (supabaseUrl.includes('http://') || supabaseUrl.includes('https://')) {
      logger.error('The URL appears to be using an URL format but is invalid. Check for malformed characters.', undefined, 'Supabase');
    } else {
      logger.error('The URL should start with https:// - make sure your .env.local file has the complete URL.', undefined, 'Supabase');
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
  
  logSupabase(`Testing basic connectivity to: ${hostname}`);
  
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
    
    logSupabase(`Connection test result: ${response.status}, took ${(endTime - startTime).toFixed(2)}ms`);
    // For Supabase, any response is good - it means the server is reachable
    return true;
  } catch (error: any) {
    logger.error(`Connection test failed:`, error, 'Supabase');
    return false;
  }
}

// Test connection when the module loads
if (typeof window !== 'undefined') {
  // Delay the test to ensure it doesn't block page load
  setTimeout(() => {
    testDnsResolution().then(success => {
      if (!success) {
        logger.warn(`⚠️ Potential connectivity issue with Supabase. Network requests may fail.`, undefined, 'Supabase');
      } else {
        logSupabase('✅ Supabase connection test successful');
      }
    });
  }, 2000); // Increased delay to reduce startup noise
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
      // Disable debug mode to reduce console noise
      debug: false, // Disabled to prevent excessive GoTrueClient logging
      storage: {
        getItem: (key) => {
          try {
            // Try localStorage first, then sessionStorage
            let value = null;
            
            try {
              value = localStorage.getItem(key);
            } catch (e) {
              logger.warn('Error reading from localStorage:', e, 'Supabase');
            }
            
            if (!value) {
              try {
                value = sessionStorage.getItem(key);
              } catch (e) {
                logger.warn('Error reading from sessionStorage:', e, 'Supabase');
              }
            }
            
            if (!value) return null;
            
            try {
              return JSON.parse(value);
            } catch (e) {
              logger.warn('Error parsing storage value:', e, 'Supabase');
              return null;
            }
          } catch (error) {
            logger.warn('Error reading from storage:', error, 'Supabase');
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
              logger.warn('Unable to save to localStorage:', e, 'Supabase');
            }
            
            try {
              sessionStorage.setItem(key, jsonValue);
              sessionStorageSuccess = true;
            } catch (e) {
              logger.warn('Unable to save to sessionStorage:', e, 'Supabase');
            }
            
            if (!localStorageSuccess && !sessionStorageSuccess) {
              logger.error('Failed to store auth data in any storage mechanism', undefined, 'Supabase');
            }
          } catch (error) {
            logger.warn('Error writing to storage:', error, 'Supabase');
          }
        },
        removeItem: (key) => {
          try {
            // Clean up from both storages
            try {
              localStorage.removeItem(key);
            } catch (e) {
              logger.warn('Unable to remove from localStorage:', e, 'Supabase');
            }
            
            try {
              sessionStorage.removeItem(key);
            } catch (e) {
              logger.warn('Unable to remove from sessionStorage:', e, 'Supabase');
            }
          } catch (error) {
            logger.warn('Error removing from storage:', error, 'Supabase');
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
    
    // Don't check too frequently - increased to 5 seconds
    const now = Date.now();
    if (now - (window as any).__lastAuthCheck < 5000) {
      return;
    }
    
    (window as any).__checkingAuthState = true;
    (window as any).__lastAuthCheck = now;
    
    try {
      // Use getUser() for security - it authenticates with the server
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        logger.warn('Error fetching authenticated user, clearing auth state:', userError.message, 'Supabase');
        await supabase.auth.signOut();
        return;
      }
      
      // Only get session if we have a valid authenticated user
      if (user) {
        // Use getUser() result instead of potentially stale getSession()
        // The session data comes from the same authenticated context
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        // Validate that session matches the authenticated user
        if (sessionError || !session || session.user.id !== user.id) {
          logger.warn('Session validation failed, clearing auth state:', sessionError?.message || 'Session/user mismatch', 'Supabase');
          await supabase.auth.signOut();
          return;
        }
        
        // If we get here, both user and session are valid and consistent
        logSupabase('Auth state synchronized successfully', {
          userId: user.id.slice(-8),
          hasSession: !!session
        });
      } else {
        // No authenticated user, ensure clean state
        await supabase.auth.signOut();
      }
    } catch (error) {
      logger.error('Error during auth state synchronization:', error, 'Supabase');
      await supabase.auth.signOut();
    } finally {
      (window as any).__checkingAuthState = false;
    }
  };
  
  // Initial sync after a delay to prevent race conditions on app load
  setTimeout(synchronizeAuthState, 3000);
  
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
  
  // Check initial session with authenticated user
  supabase.auth.getUser().then(async ({ data: { user }, error }) => {
    if (error) {
      logger.warn('Error checking initial auth state:', error.message, 'Supabase');
      return;
    }
    
    if (user) {
      logSupabase('Initial authenticated user found:', user.id);
      
      // Get session for token info if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (session && Math.floor((session.expires_at || 0) - Date.now() / 1000) < 600) { // Less than 10 minutes left
        logSupabase('Session expiring soon, refreshing...');
        supabase.auth.refreshSession().catch(err => {
          logger.warn('Error refreshing initial session:', err, 'Supabase');
        });
      }
    } else {
      logSupabase('No initial authenticated user found');
    }
  });

  // Simple connection verification on load (no heavy auto-testing)
  setTimeout(() => {
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error) {
        logger.warn('⚠️ Supabase connection issue:', error.message, 'Supabase');
      } else if (user) {
        logSupabase('✅ Supabase auth user authenticated');
      } else {
        logSupabase('📝 Supabase connected (no authenticated user)');
      }
    });
  }, 1000); // Wait 1 second after page load
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

  // Add a function to debug funding pages
  // @ts-ignore
  window.debugFundingPages = async (userId) => {
    if (!userId) {
      // Get current user ID from auth
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    }
    
    if (!userId) {
      console.error('No user ID provided and no authenticated user found');
      return;
    }
    
    console.log('🔍 Debugging funding pages for user:', userId);
    
    // Test 1: Check if table exists and what columns are accessible
    try {
      console.log('Test 1: Basic table access...');
      const { data: basic, error: basicError } = await supabase
        .from('funding_pages')
        .select('id')
        .limit(1);
      console.log('Basic access result:', { basic, basicError });
    } catch (e) {
      console.error('Basic access failed:', e);
    }
    
    // Test 2: Check user's campaigns
    try {
      console.log('Test 2: User campaigns...');
      const { data: userPages, error: userError } = await supabase
        .from('funding_pages')
        .select('*')
        .eq('user_id', userId);
      console.log('User pages result:', { count: userPages?.length || 0, userPages, userError });
    } catch (e) {
      console.error('User pages query failed:', e);
    }
    
    // Test 3: Check draft query specifically
    try {
      console.log('Test 3: Draft query...');
      const { data: drafts, error: draftError } = await supabase
        .from('funding_pages')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', false)
        .eq('is_public', false);
      console.log('Draft query result:', { count: drafts?.length || 0, drafts, draftError });
    } catch (e) {
      console.error('Draft query failed:', e);
    }
    
    return { userId };
  };
}

// Export the single instance
export default supabase

// Auth helpers with proper type handling (using the exported supabase instance)
export const signIn = async (email: string, password: string): Promise<{ data: { user: User | null, session: Session | null }, error: Error | null }> => {
  logSupabase('Attempting sign in with Supabase client...');
  try {
    // Clean up any existing storage to avoid conflicts - this is okay before sign-in
    if (typeof window !== 'undefined') {
      try {
        logSupabase('Clearing potential stale auth storage...');
        localStorage.removeItem(AUTH_STORE_KEY);
        sessionStorage.removeItem(AUTH_STORE_KEY);
        // Also clear Supabase specific keys if they exist, more aggressively
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key);
          }
        });
        logSupabase('Stale auth storage cleared.');
      } catch (e) {
        logger.warn('Error clearing storage before sign in:', e, 'Supabase');
      }
    }

    // Validate input before making the request
    if (!email || !password) {
      const error = new Error('Email and password are required');
      logger.error('Validation error:', error.message, 'Supabase');
      return { data: { user: null, session: null }, error };
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    logSupabase(`Calling supabase.auth.signInWithPassword for ${normalizedEmail}...`);
    
    // Add timeout wrapper around the auth call
    const authPromise = supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    // Set a reasonable timeout for the auth request
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Authentication request timed out. Please check your connection and try again.')), 15000);
    });

    const { data, error } = await Promise.race([authPromise, timeoutPromise]) as any;

    if (error) {
      logger.error('Supabase client signInWithPassword returned error:', error, 'Supabase');
      
      // Provide more user-friendly error messages
      let userFriendlyMessage = error.message;
      if (error.message?.includes('Invalid login credentials')) {
        userFriendlyMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.message?.includes('Email not confirmed')) {
        userFriendlyMessage = 'Please check your email and click the confirmation link before signing in.';
      } else if (error.message?.includes('Too many requests')) {
        userFriendlyMessage = 'Too many login attempts. Please wait a few minutes before trying again.';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        userFriendlyMessage = 'Network connection issue. Please check your internet connection and try again.';
      }
      
      return { data: { user: null, session: null }, error: new Error(userFriendlyMessage) };
    }

    if (data?.session && data?.user) {
      logSupabase('Supabase client signInWithPassword successful. User: ' + data.user.id + ', Session exists: ' + !!data.session);
      
      // Explicitly set session to ensure cookies are written for middleware
      try {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });
        logSupabase('Session set successfully');
      } catch (setErr) {
        logger.warn('Error calling setSession', setErr, 'Supabase');
        // Don't fail the whole login for this
      }
      
      // Update last sign in time for analytics/debugging
      try {
        await supabase.auth.updateUser({
          data: { last_client_login: new Date().toISOString() }
        });
      } catch (updateErr) {
        logger.warn('Could not update last login time:', updateErr, 'Supabase');
        // This is not critical, don't fail the login
      }
      
      return { data, error: null };
    } else {
      logger.error('Supabase client signInWithPassword returned no error but missing session, user, or both.', { data }, 'Supabase');
      return { 
        data: { user: null, session: null }, 
        error: new Error('Authentication response incomplete. Please try again or contact support if the issue persists.') 
      };
    }

  } catch (e: any) {
    logger.error('Exception during supabase.auth.signInWithPassword call or processing:', e, 'Supabase');
    
    // Handle timeout specifically
    if (e.message?.includes('timed out')) {
      return { data: { user: null, session: null }, error: e };
    }
    
    return { data: { user: null, session: null }, error: new Error('An unexpected error occurred during login. Please try again.') };
  }
}

export const signUp = async (email: string, password: string): Promise<{ data: { user: User | null, session: Session | null }, error: Error | null }> => {
  try {
    // Validate input
    if (!email || !password) {
      return { data: { user: null, session: null }, error: new Error('Email and password are required') };
    }

    // Validate password strength
    if (password.length < 6) {
      return { data: { user: null, session: null }, error: new Error('Password must be at least 6 characters long') };
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    logSupabase(`Attempting to sign up user: ${normalizedEmail}`);

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        data: {
          email_confirmed: false // Let Supabase handle email confirmation flow
        }
      },
    });

    if (error) {
      logger.error("Supabase signUp error:", error.message, 'Supabase');
      
      // Provide user-friendly error messages
      let userFriendlyMessage = error.message;
      if (error.message?.includes('User already registered')) {
        userFriendlyMessage = 'An account with this email already exists. Please try signing in instead.';
      } else if (error.message?.includes('Password should be at least')) {
        userFriendlyMessage = 'Password must be at least 6 characters long.';
      } else if (error.message?.includes('Unable to validate email address')) {
        userFriendlyMessage = 'Please enter a valid email address.';
      }
      
      return { data: { user: null, session: null }, error: new Error(userFriendlyMessage) };
    } else {
      logSupabase("Supabase signUp successful. User: " + data.user?.id + ", Session: " + !!data.session);
      
      // If user is created but needs email confirmation
      if (data.user && !data.session) {
        logSupabase("User created, email confirmation required");
      }
      
      return { data, error: null };
    }
  } catch (e: any) {
    logger.error('Exception during signUp:', e, 'Supabase');
    return { data: { user: null, session: null }, error: new Error('An unexpected error occurred during registration. Please try again.') };
  }
}

export const signOut = async (): Promise<{ error: Error | null }> => {
  logSupabase('Starting sign out process...');
  let apiError: Error | null = null;

  try {
    // Attempt API sign out first
    const { error } = await supabase.auth.signOut();
    if (error) {
      apiError = error;
      logger.warn('Supabase API signOut error:', error.message, 'Supabase');
    } else {
      logSupabase('Supabase API signOut successful.');
    }
  } catch (e: any) {
    apiError = e;
    logger.error('Exception during Supabase API signOut:', e.message, 'Supabase');
  }

  // Always clear local storage and cookies, regardless of API call outcome
  if (typeof window !== 'undefined') {
    try {
      logSupabase('Clearing local auth state and cookies post-API call...');
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
      logSupabase('Local auth state and cookies cleared.');
    } catch (e) {
      logger.warn('Error clearing storage/cookies during sign out:', e, 'Supabase');
    }
  }
  
  // Redirect to home page
  if (typeof window !== 'undefined') {
    logSupabase('Redirecting to home page after signOut...');
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
  logSupabase(`Supabase client: Updating profile for userId ${userId}`, updates);
  
  try {
    // Enable debug mode for this request
    // @ts-ignore - Ignore type error for helper function
    const { data, error, status, statusText } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select('*')
      .single();
    
    logSupabase('Supabase updateProfile complete. Status: ' + status + ' ' + statusText);
    
    if (error) {
      logger.error('Supabase client updateProfile error:', error, 'Supabase');
    } else {
      logSupabase('Supabase client updateProfile success:', data);
    }
    
    return { data, error, status };
  } catch (err) {
    logger.error('Supabase client updateProfile exception:', err, 'Supabase');
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
    .select()
    .single()
  return { data, error }
}

// Unified campaign creation/update function that handles both drafts and published pages
export const createOrUpdateFundingPage = async (
  pageData: any, 
  options: { 
    isDraft?: boolean, 
    pageId?: string,
    userId: string 
  }
): Promise<{ data: any, error: Error | null }> => {
  try {
    logSupabase('Creating/updating funding page with data:', {
      title: pageData.title,
      pageId: options.pageId,
      isDraft: options.isDraft,
      userId: options.userId
    });

    // First, let's check what columns exist in the table
    const { data: tableInfo, error: tableError } = await supabase
      .from('funding_pages')
      .select('*')
      .limit(1);
    
    if (tableError) {
      logger.error('Failed to access funding_pages table:', tableError, 'Supabase');
      return { data: null, error: tableError };
    }

    // Create normalized data that matches the current table structure
    const normalizedData: any = {
      user_id: options.userId,
      title: pageData.title || 'Untitled Campaign',
      description: pageData.description || null,
      goal_amount: pageData.goal_amount ? parseFloat(pageData.goal_amount) : null,
      current_amount: 0,
      status: options.isDraft ? 'draft' : 'active',
    };

    // Only add fields that exist in the table structure
    if (pageData.bitcoin_address) {
      normalizedData.bitcoin_address = pageData.bitcoin_address;
    }
    
    // Check if table has newer fields and add them conditionally
    const sampleRow = tableInfo?.[0];
    if (sampleRow) {
      if ('lightning_address' in sampleRow && pageData.lightning_address) {
        normalizedData.lightning_address = pageData.lightning_address;
      }
      if ('website_url' in sampleRow && pageData.website_url) {
        normalizedData.website_url = pageData.website_url;
      }
      if ('category' in sampleRow && pageData.categories && pageData.categories.length > 0) {
        normalizedData.category = pageData.categories[0];
      }
      if ('tags' in sampleRow && pageData.categories && pageData.categories.length > 1) {
        normalizedData.tags = pageData.categories.slice(1);
      }
      if ('currency' in sampleRow) {
        normalizedData.currency = pageData.currency || 'BTC';
      }
      if ('is_active' in sampleRow) {
        normalizedData.is_active = !options.isDraft;
      }
      if ('is_public' in sampleRow) {
        normalizedData.is_public = !options.isDraft;
      }
      if ('total_funding' in sampleRow) {
        normalizedData.total_funding = 0;
      }
      if ('contributor_count' in sampleRow) {
        normalizedData.contributor_count = 0;
      }
    }

    logSupabase('Normalized data for database:', normalizedData);

    if (options.pageId) {
      // Update existing page
      const { user_id, ...updateData } = normalizedData;
      
      logSupabase('Updating existing funding page:', options.pageId);
      
      const { data, error } = await supabase
        .from('funding_pages')
        .update(updateData)
        .eq('id', options.pageId)
        .eq('user_id', options.userId) // Ensure user can only update their own pages
        .select()
        .single();
        
      if (error) {
        logger.error('Failed to update funding page:', error, 'Supabase');
        return { data: null, error };
      }
      
      logSupabase('Successfully updated funding page');
      return { data, error: null };
    } else {
      // Create new page
      logSupabase('Creating new funding page');
      
      const { data, error } = await supabase
        .from('funding_pages')
        .insert(normalizedData)
        .select()
        .single();
        
      if (error) {
        logger.error('Failed to create funding page:', error, 'Supabase');
        return { data: null, error };
      }
      
      logSupabase('Successfully created funding page:', data?.id);
      return { data, error: null };
    }
  } catch (error: any) {
    logger.error('Exception in createOrUpdateFundingPage:', error, 'Supabase');
    return { data: null, error: error };
  }
}

// Legacy functions for backward compatibility - these now use the unified function
export const saveFundingPageDraft = async (userId: string, draftData: any): Promise<{ data: any, error: Error | null }> => {
  return createOrUpdateFundingPage(draftData, { isDraft: true, userId })
}

export const updateFundingPageDraft = async (draftId: string, draftData: any): Promise<{ data: any, error: Error | null }> => {
  // Get userId from the existing draft
  const { data: existingDraft, error: fetchError } = await supabase
    .from('funding_pages')
    .select('user_id')
    .eq('id', draftId)
    .single()
  
  if (fetchError || !existingDraft) {
    return { data: null, error: fetchError || new Error('Draft not found') }
  }
  
  return createOrUpdateFundingPage(draftData, { 
    isDraft: true, 
    pageId: draftId, 
    userId: existingDraft.user_id 
  })
}

export const getUserDrafts = async (userId: string): Promise<{ data: any[], error: Error | null }> => {
  console.log('🔍 getUserDrafts: Querying drafts for user:', userId)
  
  try {
    // DIAGNOSTIC: First test basic table access
    try {
      console.log('🔍 getUserDrafts: Testing basic table access...')
      const { data: testData, error: testError } = await supabase
        .from('funding_pages')
        .select('id, title, created_at')
        .limit(1)
      
      console.log('🔍 getUserDrafts: Basic test result:', { testData, testError })
      
      if (testError) {
        console.error('🔍 getUserDrafts: Basic table access failed:', testError)
        return { data: [], error: testError }
      }
    } catch (basicError) {
      console.error('🔍 getUserDrafts: Basic test exception:', basicError)
      return { data: [], error: basicError as Error }
    }

    // DIAGNOSTIC: Test user-specific query without boolean filters
    try {
      console.log('🔍 getUserDrafts: Testing user query without boolean filters...')
      const { data: userTestData, error: userTestError } = await supabase
        .from('funding_pages')
        .select('*')
        .eq('user_id', userId)
        .limit(5)
      
      console.log('🔍 getUserDrafts: User test result:', { 
        count: userTestData?.length || 0, 
        error: userTestError,
        sampleData: userTestData?.[0] ? {
          id: userTestData[0].id,
          title: userTestData[0].title,
          is_active: userTestData[0].is_active,
          is_public: userTestData[0].is_public,
          created_at: userTestData[0].created_at
        } : null
      })
      
      if (userTestError) {
        console.error('🔍 getUserDrafts: User query failed:', userTestError)
        return { data: [], error: userTestError }
      }

      // If user has no pages, return empty array
      if (!userTestData || userTestData.length === 0) {
        console.log('🔍 getUserDrafts: No pages found for user')
        return { data: [], error: null }
      }

      // Filter for drafts on client side to avoid server-side query issues
      const drafts = userTestData.filter(page => {
        const isInactive = page.is_active === false || page.is_active === 'false' || !page.is_active
        const isPrivate = page.is_public === false || page.is_public === 'false' || !page.is_public
        return isInactive && isPrivate
      }) || []
      
      console.log('🔍 getUserDrafts: Client-filtered drafts:', drafts.length)
      console.log('🔍 getUserDrafts: Draft details:', drafts.map(d => ({
        id: d.id,
        title: d.title,
        is_active: d.is_active,
        is_public: d.is_public,
        created_at: d.created_at
      })))
      
      return { data: drafts, error: null }

    } catch (userError) {
      console.error('🔍 getUserDrafts: User query exception:', userError)
      return { data: [], error: userError as Error }
    }
    
  } catch (err) {
    console.error('🔍 getUserDrafts: Complete failure:', err)
    return { data: [], error: err as Error }
  }
} 