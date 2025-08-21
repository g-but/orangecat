'use client'

import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'
import { logger } from '@/utils/logger'

// Environment variables with fallbacks for production builds
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

// Log warning if using fallback values
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  if (process.env.NODE_ENV === 'development') {
    logger.error('Supabase configuration error', {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      message: 'Missing required environment variables. Check .env.local file.'
    }, 'Supabase')
  } else {
    logger.warn('Using fallback Supabase configuration. Authentication features may not work correctly.', undefined, 'Supabase')
  }
}

// Validate URL format
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
      logger.warn('Supabase URL format looks incorrect. Expected format: https://your-project.supabase.co', undefined, 'Supabase')
}

// Create the browser client with optimized configuration for authentication
const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Fixed: Aligned timeout with auth operations
    flowType: 'pkce',
    debug: process.env.NODE_ENV === 'development',
  },
  // Fixed: Increased timeout to match auth operations (20s)
  global: {
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        // Fixed: Set timeout to 20 seconds to match auth operations
        signal: AbortSignal.timeout(20000),
      });
    },
  },
  // Add database configuration
  db: {
    schema: 'public',
  },
  // Realtime configuration (disable if not needed to reduce connection overhead)
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
})

// Add connection test in development (non-blocking)
if (process.env.NODE_ENV === 'development') {
  const testConnection = async () => {
    try {
      const { error } = await supabase.from('profiles').select('count').limit(1);
      if (error) {
        logger.warn('Supabase connection test failed', { errorMessage: error.message }, 'Supabase');
      } else {
        logger.info('Supabase connection test successful', undefined, 'Supabase');
      }
    } catch {
      // Silently fail connection test - don't block app startup
    }
  };
  // Run test after a delay to avoid blocking initialization
  setTimeout(testConnection, 1000);
}

// Export the client instance directly - createBrowserClient handles internal caching
export default supabase

// Provide a factory function for testing/mocking purposes
export const createSupabaseClient = () => 
  createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      debug: process.env.NODE_ENV === 'development',
    },
    global: {
      fetch: (url, options = {}) => {
        return fetch(url, {
          ...options,
          signal: AbortSignal.timeout(20000),
        });
      },
    },
    db: {
      schema: 'public',
    },
    realtime: {
      params: {
        eventsPerSecond: 2,
      },
    },
  })

export { supabase } // Legacy named export for backward compatibility 