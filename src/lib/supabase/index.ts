/**
 * UNIFIED SUPABASE CLIENT EXPORTS
 *
 * Single source of truth for all Supabase client access
 * Created: 2025-10-23
 * Priority 1: Consolidation of 4 clients into 2
 */

// Browser client (for client components, hooks, etc.)
export { supabase, createSupabaseClient } from './browser'

// Server client (for API routes, Server Components, Server Actions)
export { createServerClient } from './server'

// Types
export type { Database } from '@/types/database'
