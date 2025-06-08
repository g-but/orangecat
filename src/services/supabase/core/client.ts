/**
 * SUPABASE CLIENT - CLEAN CONFIGURATION
 * 
 * This file provides a clean, minimal Supabase client instance
 * with proper configuration and environment validation.
 * 
 * Created: 2025-06-08
 * Last Modified: 2025-06-08
 * Last Modified Summary: Extracted from massive client.ts, clean separation of concerns
 */

'use client'

import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'
import { logger, logSupabase } from '@/utils/logger'
import type { EnvironmentConfig } from '../types'

// ==================== ENVIRONMENT VALIDATION ====================

function validateEnvironment(): EnvironmentConfig {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const nodeEnv = process.env.NODE_ENV || 'development'

  // Log environment for debugging (with redacted keys)
  logSupabase('Environment validation:', {
    supabaseUrl: supabaseUrl ? `${supabaseUrl.slice(0, 15)}...` : 'undefined',
    supabaseAnonKey: supabaseAnonKey ? `${supabaseAnonKey.slice(0, 6)}...` : 'undefined',
    siteUrl,
    nodeEnv
  })

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined')
  }

  // Validate URL format
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

  return {
    supabaseUrl,
    supabaseAnonKey,
    siteUrl,
    nodeEnv
  }
}

// ==================== CLIENT CONFIGURATION ====================

const config = validateEnvironment()

// Create the Supabase client with proper configuration
export const supabase = createBrowserClient<Database>(
  config.supabaseUrl,
  config.supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      debug: config.nodeEnv === 'development',
      storage: {
        getItem: (key) => {
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
        setItem: (key, value) => {
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
        removeItem: (key) => {
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

// Export configuration for use by other services
export { config as supabaseConfig }

// Export default client
export default supabase 