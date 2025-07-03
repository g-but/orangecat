import { NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth'
import { createServerClient } from '@/services/supabase/server'
import { logger } from '@/utils/logger'
import type { MembershipFormData } from '@/types/organization'

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

async function handleGetMemberships(request: AuthenticatedRequest) {
  try {
    const supabase = await createServerClient()
    const user = request.user
    const { searchParams } = new URL(request.url)

    // Rate limiting
    const rateLimitId = `memberships_get:${user.id}`
    if (!checkRateLimit(rateLimitId)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute.' },
        { status: 429 }
      )
    }

    const organizationId = searchParams.get('organization_id')
    const profileId = searchParams.get('profile_id')

    // Build query
    let query = supabase
      .from('memberships')
      .select(`
        *,
        organization:organizations(*),
        profile:profiles(id, username, display_name, avatar_url, bio)
      `)

    // Filter by organization if specified
    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    // Filter by profile if specified (typically for user's own memberships)
    if (profileId) {
      if (profileId !== user.id) {
        return NextResponse.json(
          { error: 'Can only view your own memberships' },
          { status: 403 }
        )
      }
      query = query.eq('profile_id', profileId)
    }

    // Apply RLS - user can see:
    // 1. Their own memberships
    // 2. Memberships in organizations where they are members
    query = query.or(`profile_id.eq.${user.id},organization.memberships.profile_id.eq.${user.id}`)

    // Only active memberships by default
    query = query.eq('status', 'active')

    // Order by most recent
    query = query.order('created_at', { ascending: false })

    const { data: memberships, error } = await query

    if (error) {
      logger.error('Error fetching memberships:', error)
      return NextResponse.json(
        { error: 'Failed to fetch memberships' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: memberships || []
    })

  } catch (error) {
    logger.error('Unexpected error in GET /api/memberships:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleCreateMembership(request: AuthenticatedRequest) {
  try {
    const supabase = await createServerClient()
    const user = request.user

    // Rate limiting
    const rateLimitId = `memberships_create:${user.id}`
    if (!checkRateLimit(rateLimitId)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute.' },
        { status: 429 }
      )
    }

    const { organization_id, profile_id, ...membershipData }: MembershipFormData & { 
      organization_id: string
      profile_id: string 
    } = await request.json()

    // Validate required fields
    if (!organization_id || !profile_id) {
      return NextResponse.json(
        { error: 'Organization ID and Profile ID are required' },
        { status: 400 }
      )
    }

    // Check if user has permission to add members to this organization
    const { data: userMembership } = await supabase
      .from('memberships')
      .select('role, status')
      .eq('organization_id', organization_id)
      .eq('profile_id', user.id)
      .eq('status', 'active')
      .single()

    if (!userMembership || !['owner', 'admin'].includes(userMembership.role)) {
      return NextResponse.json(
        { error: 'Permission denied. Only owners and admins can add members.' },
        { status: 403 }
      )
    }

    // Check if membership already exists
    const { data: existingMembership } = await supabase
      .from('memberships')
      .select('id, status')
      .eq('organization_id', organization_id)
      .eq('profile_id', profile_id)
      .single()

    if (existingMembership) {
      return NextResponse.json(
        { error: 'User is already a member of this organization' },
        { status: 400 }
      )
    }

    // Validate role permissions
    if (membershipData.role === 'owner' && userMembership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only organization owners can assign owner role' },
        { status: 403 }
      )
    }

    // Create membership
    const { data: membership, error } = await supabase
      .from('memberships')
      .insert({
        organization_id,
        profile_id,
        role: membershipData.role || 'member',
        title: membershipData.title,
        bio: membershipData.bio,
        contribution_address: membershipData.contribution_address,
        reward_percentage: membershipData.reward_percentage || 0,
        permissions: membershipData.permissions || {},
        status: 'active',
        joined_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
        invited_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        *,
        organization:organizations(*),
        profile:profiles(id, username, display_name, avatar_url)
      `)
      .single()

    if (error) {
      logger.error('Error creating membership:', error)
      return NextResponse.json(
        { error: 'Failed to create membership' },
        { status: 500 }
      )
    }

    logger.info(`Membership created successfully: ${membership.id}`, {
      userId: user.id,
      organizationId: organization_id,
      newMemberId: profile_id,
      role: membershipData.role
    })

    return NextResponse.json({
      success: true,
      data: membership,
      message: 'Member added successfully'
    })

  } catch (error) {
    logger.error('Unexpected error in POST /api/memberships:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export the wrapped handlers
export const GET = withAuth(handleGetMemberships)
export const POST = withAuth(handleCreateMembership)