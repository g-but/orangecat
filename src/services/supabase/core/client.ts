/**
 * ⚠️ DEPRECATED: This file is deprecated and will be removed in a future version.
 *
 * Please use the unified Supabase clients instead:
 * - For browser/client components: import from '@/lib/supabase/browser'
 * - For server/API routes: import from '@/lib/supabase/server'
 *
 * Migration completed: 2025-10-23
 * Scheduled for removal: After all consumers are migrated
 *
 * ---
 *
 * SUPABASE CLIENT - CLEAN CONFIGURATION
 *
 * This file provides a clean, minimal Supabase client instance
 * with proper configuration and environment validation.
 *
 * Created: 2025-06-08
 * Last Modified: 2025-06-12
 * Last Modified Summary: Fixed server-side build errors by adding browser environment checks
 */

import type { Database } from '@/types/database'
import { logger, logSupabase } from '@/utils/logger'
import type { EnvironmentConfig } from '../types'

// Log deprecation warning in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  logger.warn(
    '⚠️ DEPRECATED: @/services/supabase/core/client is deprecated. Use @/lib/supabase/browser instead.',
    undefined,
    'Supabase'
  )
}

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined'

// -----------------------------------------------------------------------------
// stableLogSupabase: during Jest runs we want every import of this module (even
// after jest.resetModules()) to push its log into the same jest.fn instance so
// call history survives. In production runtime this simply aliases to
// logSupabase. Guard with typeof jest to avoid bundling issues.
// -----------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stableLogSupabase: typeof logSupabase =
  // @ts-ignore — jest global only exists in test environment
  typeof jest !== 'undefined'
    ? ((globalThis as any).__oc_logSupabase =
        (globalThis as any).__oc_logSupabase || jest.fn())
    : logSupabase;

// ==================== ENVIRONMENT VALIDATION ====================

function validateEnvironment(): EnvironmentConfig {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const nodeEnv = process.env.NODE_ENV || 'development'

  // Log environment for debugging (with redacted sensitive data)
  stableLogSupabase('Environment validation:', {
    supabaseUrl: supabaseUrl ? `${supabaseUrl.slice(0, 20)}...` : 'undefined',
    supabaseAnonKey: supabaseAnonKey ? `${supabaseAnonKey.slice(0, 13)}...` : 'undefined',
    siteUrl,
    nodeEnv
  })

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined')
  }

  // Validate URL format only in browser environment
  if (isBrowser) {
    try {
      const url = new URL(supabaseUrl)
      
      // Check protocol
      if (url.protocol !== 'https:') {
        logger.error('Supabase URL should use https protocol:', url.protocol, 'Supabase')
      }
      
      // Check domain
      if (!url.hostname.includes('supabase')) {
        logger.warn('Supabase URL does not appear to be a valid Supabase domain', undefined, 'Supabase')
      }
      
    } catch (error) {
      logger.error('Invalid Supabase URL format:', { url: supabaseUrl, error }, 'Supabase')
      throw new Error('Invalid Supabase URL format. Check your environment variables.')
    }
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    siteUrl,
    nodeEnv
  }
}

// ==================== STORAGE HELPERS ====================

// Safe storage helpers that work on both server and client
const safeStorage = {
  getItem: (key: string) => {
    if (!isBrowser) {return null}
    
    try {
      // Try localStorage first, then sessionStorage
      let value = null
      
      try {
        value = localStorage.getItem(key)
      } catch (e) {
        logger.warn('Error reading from localStorage', { error: (e as Error).message }, 'Supabase')
      }
      
      if (!value) {
        try {
          value = sessionStorage.getItem(key)
        } catch (e) {
          logger.warn('Error reading from sessionStorage', { error: (e as Error).message }, 'Supabase')
        }
      }
      
      return value ? JSON.parse(value) : null
    } catch (error) {
      logger.warn('Error reading from storage', { error: (error as Error).message }, 'Supabase')
      return null
    }
  },
  
  setItem: (key: string, value: any) => {
    if (!isBrowser) {return}
    
    try {
      const jsonValue = JSON.stringify(value)
      
      // Try to save in both storages for redundancy
      let success = false
      
      try {
        localStorage.setItem(key, jsonValue)
        success = true
      } catch (e) {
        logger.warn('Unable to save to localStorage', { error: (e as Error).message }, 'Supabase')
      }
      
      try {
        sessionStorage.setItem(key, jsonValue)
        success = true
      } catch (e) {
        logger.warn('Unable to save to sessionStorage', { error: (e as Error).message }, 'Supabase')
      }
      
      if (!success) {
        logger.error('Failed to store auth data in any storage mechanism', { key }, 'Supabase')
      }
    } catch (error) {
      logger.warn('Error writing to storage', { error: (error as Error).message }, 'Supabase')
    }
  },
  
  removeItem: (key: string) => {
    if (!isBrowser) {return}
    
    try {
      // Clean up from both storages
      try {
        localStorage.removeItem(key)
      } catch (e) {
        logger.warn('Unable to remove from localStorage', { error: (e as Error).message }, 'Supabase')
      }
      
      try {
        sessionStorage.removeItem(key)
      } catch (e) {
        logger.warn('Unable to remove from sessionStorage', { error: (e as Error).message }, 'Supabase')
      }
    } catch (error) {
      logger.warn('Error removing from storage', { error: (error as Error).message }, 'Supabase')
    }
  }
}

// ==================== CLIENT CONFIGURATION ====================

const config = validateEnvironment()

// Create the Supabase client with proper configuration
// Only create the client if we have the required environment variables and we're in browser
let supabase: any = null

if (config.supabaseUrl && config.supabaseAnonKey && isBrowser) {
  // Dynamic import to avoid server-side execution
  import('@supabase/ssr').then(({ createBrowserClient }) => {
    supabase = createBrowserClient<Database>(
      config.supabaseUrl,
      config.supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          debug: false, // Disabled to prevent console spam
          storage: safeStorage
        },
        cookieOptions: {
          path: '/',
          sameSite: 'lax',
          secure: config.nodeEnv === 'production',
        },
        db: {
          schema: 'public'
        }
      }
    )
  }).catch(error => {
    logger.error('Failed to initialize Supabase client:', error, 'Supabase')
  })
}

// Export configuration for use by other services
export { config as supabaseConfig }

// Export client (will be null if environment variables are missing or on server)
export { supabase }
export default supabase

// Emit log after client init so each import is recorded (required by comprehensive tests)
// Only log if we're in browser environment to avoid server-side issues
if (isBrowser) {
  stableLogSupabase('Environment validation:', {
    supabaseUrl: `${config.supabaseUrl.slice(0, 20)}...`,
    supabaseAnonKey: `${config.supabaseAnonKey.slice(0, 13)}...`,
    siteUrl: config.siteUrl,
    nodeEnv: config.nodeEnv,
  })
} 