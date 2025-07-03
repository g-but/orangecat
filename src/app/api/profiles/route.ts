import { NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth'
import { createServerClient } from '@/services/supabase/server'
import { logger } from '@/utils/logger'

// Simple in-memory rate limiting
const rateLimit = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20 // 20 requests per minute

function checkRateLimit(identifier: string): boolean {
  const now = Date.now()
  
  // Clean up old entries
  const entries = Array.from(rateLimit.entries())
  for (const [key, data] of entries) {
    if (data.resetTime < now) {
      rateLimit.delete(key)
    }
  }
  
  const current = rateLimit.get(identifier)
  
  if (!current) {
    rateLimit.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  
  if (current.resetTime < now) {
    rateLimit.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  
  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }
  
  current.count++
  return true
}

async function handleGetProfiles(request: AuthenticatedRequest) {
  try {
    const supabase = await createServerClient()
    const user = request.user
    const { searchParams } = new URL(request.url)

    // Rate limiting
    const rateLimitId = `profiles_get:${user.id}`
    if (!checkRateLimit(rateLimitId)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute.' },
        { status: 429 }
      )
    }

    // Parse search parameters
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // Cap at 100
    const offset = parseInt(searchParams.get('offset') || '0')
    const sort = searchParams.get('sort') || 'recent'

    // Build query
    let query = supabase
      .from('profiles')
      .select(`
        id,
        username,
        display_name,
        bio,
        avatar_url,
        website,
        bitcoin_address,
        lightning_address,
        created_at
      `)

    // Apply sorting
    switch (sort) {
      case 'popular':
        // Sort by a combination of factors - for now use created_at as proxy
        query = query.order('created_at', { ascending: false })
        break
      case 'verified':
        // Filter for verified users - for now just those with bitcoin addresses
        query = query.not('bitcoin_address', 'is', null)
        query = query.order('created_at', { ascending: false })
        break
      case 'recent':
      default:
        query = query.order('created_at', { ascending: false })
        break
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: profiles, error, count } = await query

    if (error) {
      logger.error('Error fetching profiles:', error)
      return NextResponse.json(
        { error: 'Failed to fetch profiles' },
        { status: 500 }
      )
    }

    // Filter out profiles with no display name or username for better UX
    const filteredProfiles = (profiles || []).filter(profile => 
      profile.display_name || profile.username
    )

    return NextResponse.json({
      success: true,
      data: filteredProfiles,
      pagination: {
        limit,
        offset,
        total: count || 0
      }
    })

  } catch (error) {
    logger.error('Unexpected error in GET /api/profiles:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export the wrapped handler
export const GET = withAuth(handleGetProfiles)