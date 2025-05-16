'use client'

import { createBrowserClient } from '@supabase/ssr' // Use createBrowserClient for client-side
import { Database } from '@/types/database'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Add debug logging for environment variables in development
if (process.env.NODE_ENV === 'development') {
  console.log('Supabase URL:', supabaseUrl ? `${supabaseUrl.slice(0, 15)}...` : 'undefined')
  console.log('Supabase Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.slice(0, 6)}...` : 'undefined')
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined')
}

// Add a DNS test function to help debug connection issues
async function testDnsResolution() {
  if (typeof window === 'undefined') return; // Only run in browser
  
  const url = new URL(supabaseUrl!);
  const hostname = url.hostname;
  
  console.log(`Testing DNS resolution for: ${hostname}`);
  
  try {
    // We can't directly test DNS in the browser, but we can try a HEAD request
    const startTime = performance.now();
    const response = await fetch(`${url.origin}/healthz`, {
      method: 'HEAD',
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    const endTime = performance.now();
    
    console.log(`DNS/Connection test result: ${response.status}, took ${(endTime - startTime).toFixed(2)}ms`);
    return response.status >= 200 && response.status < 500;
  } catch (error) {
    console.error(`DNS/Connection test failed:`, error);
    return false;
  }
}

// Test connection when the module loads
if (typeof window !== 'undefined') {
  testDnsResolution().then(success => {
    if (!success) {
      console.warn(`⚠️ Potential connectivity issue with Supabase. Network requests may fail.`);
    }
  });
}

// Helper to create AbortSignal with timeout
const createTimeoutSignal = (timeoutMs = 10000) => {
  return AbortSignal.timeout(timeoutMs);
};

// Create a single, shared Supabase client instance for browser-side operations.
// This instance is created once when the module is first imported.
const supabase = createBrowserClient<Database>(
  supabaseUrl, 
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      fetch: async (url, options = {}) => {
        // Simple fetch logger
        console.log('[SB-FETCH]', options.method || 'GET', url.toString().slice(0, 100));
        
        // Apply a timeout abort signal if none is provided
        const fetchOptions = {
          ...options,
          signal: options.signal || createTimeoutSignal(30000), // Increase to 30 second timeout
        };
        
        try {
          const response = await fetch(url, fetchOptions);
          // Log response status for debugging
          if (process.env.NODE_ENV === 'development') {
            console.log(`[SB-RESPONSE] ${response.status} for ${options.method || 'GET'} ${url.toString().slice(0, 100)}`);
          }
          return response;
        } catch (error) {
          console.error('[SB-FETCH-ERROR]', error);
          throw error;
        }
      }
    },
    // Add schema for type safety
    db: {
      schema: 'public',
    }
  }
)

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
}

// Export the single instance
export default supabase

// Auth helpers with proper type handling (using the exported supabase instance)
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      data: {
        email_confirmed: true
      }
    },
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email)
  return { data, error }
}

export const updatePassword = async (newPassword: string) => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  })
  return { data, error }
}

// Profile helpers with proper type handling
export const getProfile = async (userId: string) => {
  // @ts-ignore - Ignore type error for helper function
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

export const updateProfile = async (userId: string, updates: any) => {
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
export const getFundingPage = async (username: string) => {
  // @ts-ignore - Ignore type error for helper function
  const { data, error } = await supabase
    .from('funding_pages')
    .select('*')
    .eq('username', username)
    .single()
  return { data, error }
}

export const createFundingPage = async (pageData: any) => {
  const { data, error } = await supabase
    .from('funding_pages')
    .insert(pageData)
    .select()
    .single()
  return { data, error }
}

export const updateFundingPage = async (pageId: string, updates: any) => {
  // @ts-ignore - Ignore type error for helper function
  const { data, error } = await supabase
    .from('funding_pages')
    .update(updates)
    .eq('id', pageId)
  return { data, error }
} 