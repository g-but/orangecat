import { NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth'
import { createServerClient } from '@/services/supabase/server'
import { logger } from '@/utils/logger'

// Simple in-memory rate limiting
const rateLimit = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30 // 30 search requests per minute

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

async function handleSearchProfiles(request: AuthenticatedRequest) {
  try {
    const supabase = await createServerClient()
    const user = request.user
    const { searchParams } = new URL(request.url)

    // Rate limiting
    const rateLimitId = `profiles_search:${user.id}`
    if (!checkRateLimit(rateLimitId)) {
      return NextResponse.json(
        { error: 'Too many search requests. Please wait a minute.' },
        { status: 429 }
      )
    }

    const query = searchParams.get('q')
    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      )
    }

    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50) // Cap at 50 for search

    // Build search query
    const searchQuery = supabase
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
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%,bio.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit)

    const { data: profiles, error } = await searchQuery

    if (error) {
      logger.error('Error searching profiles:', error)
      return NextResponse.json(
        { error: 'Failed to search profiles' },
        { status: 500 }
      )
    }

    // Filter out profiles with no display name or username for better UX
    const filteredProfiles = (profiles || []).filter(profile => 
      profile.display_name || profile.username
    )

    // Log search for analytics (without exposing sensitive data)
    logger.info('Profile search performed', {
      userId: user.id,
      queryLength: query.length,
      resultsCount: filteredProfiles.length
    })

    return NextResponse.json({
      success: true,
      data: filteredProfiles,
      query: query,
      count: filteredProfiles.length
    })

  } catch (error) {
    logger.error('Unexpected error in GET /api/profiles/search:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export the wrapped handler
export const GET = withAuth(handleSearchProfiles)