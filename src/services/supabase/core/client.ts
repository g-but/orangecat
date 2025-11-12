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

// Environment variables with fallbacks for development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key'
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key'

// Create the main client for client-side operations
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

// Create service role client for server-side operations (admin access)
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
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