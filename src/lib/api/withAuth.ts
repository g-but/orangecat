import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/utils/logger'
import { apiUnauthorized, apiInternalError } from './standardResponse'

/**
 * Authentication Middleware for API Routes
 *
 * Eliminates DRY violations by centralizing authentication logic.
 * Used across all protected API routes.
 *
 * 🔒 SECURITY: Standardized authentication checks
 * ♻️ REFACTORED: Eliminates ~540 lines of duplicate auth code across 54 routes
 *
 * Created: 2025-01-15
 * Last Modified: 2025-12-27
 * Last Modified Summary: Use standardized response helpers, add supabase to context
 */

// =====================================================================
// TYPES
// =====================================================================

export interface AuthContext {
  user: User
  supabase: SupabaseClient
}

export type AuthenticatedRequest = NextRequest & {
  user: User
  supabase: SupabaseClient
}

export type AuthenticatedHandler<TContext = Record<string, unknown>> = (
  req: AuthenticatedRequest,
  context: TContext & { params?: Record<string, string> }
) => Promise<NextResponse>

export type OptionalAuthHandler<TContext = Record<string, unknown>> = (
  req: NextRequest & { user: User | null; supabase: SupabaseClient },
  context: TContext & { params?: Record<string, string> }
) => Promise<NextResponse>

// =====================================================================
// MIDDLEWARE FUNCTIONS
// =====================================================================

/**
 * Higher-order function that wraps API route handlers with authentication
 *
 * @example
 * // In your API route:
 * export const POST = withAuth(async (req, ctx) => {
 *   const { user, supabase } = req
 *   // user is guaranteed to exist
 *   return apiSuccess({ userId: user.id })
 * })
 */
export function withAuth<TContext = Record<string, unknown>>(
  handler: AuthenticatedHandler<TContext>
) {
  return async function authenticatedRoute(
    req: NextRequest,
    context: TContext & { params?: Record<string, string> }
  ): Promise<NextResponse> {
    try {
      const supabase = await createServerClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (!user || userError) {
        return apiUnauthorized('Authentication required')
      }

      // Add user and supabase to request object
      const authenticatedReq = req as AuthenticatedRequest
      authenticatedReq.user = user
      authenticatedReq.supabase = supabase

      return await handler(authenticatedReq, context)

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Authentication middleware error', { error: errorMessage }, 'Auth')
      return apiInternalError('Authentication failed')
    }
  }
}

/**
 * Optional authentication wrapper - allows both authenticated and unauthenticated access
 * User may be null if not authenticated
 *
 * @example
 * // In your API route:
 * export const GET = withOptionalAuth(async (req, ctx) => {
 *   const { user, supabase } = req
 *   if (user) {
 *     // Authenticated request - show private data
 *   } else {
 *     // Public request - show only public data
 *   }
 *   return apiSuccess(data)
 * })
 */
export function withOptionalAuth<TContext = Record<string, unknown>>(
  handler: OptionalAuthHandler<TContext>
) {
  return async function optionalAuthRoute(
    req: NextRequest,
    context: TContext & { params?: Record<string, string> }
  ): Promise<NextResponse> {
    try {
      const supabase = await createServerClient()
      const { data: { user } } = await supabase.auth.getUser()

      // Add user (may be null) and supabase to request object
      const augmentedReq = req as NextRequest & { user: User | null; supabase: SupabaseClient }
      augmentedReq.user = user
      augmentedReq.supabase = supabase

      return await handler(augmentedReq, context)

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Optional auth middleware error', { error: errorMessage }, 'Auth')
      return apiInternalError('Request failed')
    }
  }
}

/**
 * Role-based authentication wrapper
 * Checks if user has the required role before proceeding
 *
 * @example
 * export const DELETE = withRole('admin', async (req, ctx) => {
 *   // Only admins can reach here
 *   return apiSuccess({ deleted: true })
 * })
 */
export function withRole<TContext = Record<string, unknown>>(
  requiredRole: string,
  handler: AuthenticatedHandler<TContext>
) {
  return withAuth<TContext>(async (req, context) => {
    // Check user role from app_metadata or user_metadata
    const userRole = req.user.app_metadata?.role || req.user.user_metadata?.role

    if (userRole !== requiredRole) {
      return apiUnauthorized(`Role '${requiredRole}' required`)
    }

    return await handler(req, context)
  })
}

// =====================================================================
// UTILITY FUNCTIONS
// =====================================================================

/**
 * Extract authenticated user from request (for use in compose middleware)
 * Returns null if not authenticated
 */
export async function getAuthUser(req: NextRequest): Promise<AuthContext | null> {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (!user || error) {
      return null
    }

    return { user, supabase }
  } catch {
    return null
  }
}

/**
 * Require authentication and return user/supabase or throw error response
 * For use in handlers that need manual auth checking
 */
export async function requireAuth(req: NextRequest): Promise<{ user: User; supabase: SupabaseClient }> {
  const auth = await getAuthUser(req)

  if (!auth) {
    throw apiUnauthorized('Authentication required')
  }

  return auth
}