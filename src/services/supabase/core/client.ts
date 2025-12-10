/**
 * SUPABASE CORE CLIENT - CENTRALIZED DATABASE ACCESS
 *
 * This file provides the core Supabase client configuration and utilities
 * that are shared across all Supabase services in the application.
 *
 * Created: 2025-01-22
 * Last Modified: 2025-01-22
 * Last Modified Summary: Core Supabase client with auth and database access
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Fail-fast in production for missing configuration
if (process.env.NODE_ENV === 'production') {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not set in production')
  }
}

// Create the main client for client-side operations
export const supabase = createClient<Database>((supabaseUrl as string) || 'http://localhost', (supabaseAnonKey as string) || 'dev-placeholder', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

// Create service role client for server-side operations (admin access)
export const supabaseAdmin = createClient<Database>((supabaseUrl as string) || 'http://localhost', (supabaseServiceRoleKey as string) || 'dev-service-role', {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Supabase configuration object for easy access
export const supabaseConfig = {
  supabaseUrl,
  supabaseAnonKey,
  supabaseServiceRoleKey,
  hasValidConfig: !!(supabaseUrl && supabaseAnonKey)
}

// Default export for backwards compatibility
export default supabase
