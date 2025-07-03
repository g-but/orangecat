import { NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth'
import { createServerClient } from '@/services/supabase/server'
import { logger } from '@/utils/logger'
import type { OrganizationFormData, OrganizationSearchParams } from '@/types/organization'

// Simple in-memory rate limiting (in production, use Redis or database)
const rateLimit = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10 // 10 requests per minute

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

async function handleGetOrganizations(request: AuthenticatedRequest) {
  try {
    const supabase = await createServerClient()
    const user = request.user
    const { searchParams } = new URL(request.url)

    // Parse search parameters
    const params: OrganizationSearchParams = {
      q: searchParams.get('q') || undefined,
      type: searchParams.get('type') as any || undefined,
      category: searchParams.get('category') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100), // Cap at 100
      sort: searchParams.get('sort') as any || 'created_at',
      order: searchParams.get('order') as any || 'desc'
    }

    // Rate limiting
    const rateLimitId = `orgs_get:${user.id}`
    if (!checkRateLimit(rateLimitId)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute.' },
        { status: 429 }
      )
    }

    // Build query
    let query = supabase
      .from('organizations')
      .select(`
        *,
        memberships!inner(count)
      `)

    // Apply filters
    if (params.type) {
      query = query.eq('type', params.type)
    }

    if (params.category) {
      query = query.eq('category', params.category)
    }

    // Search functionality
    if (params.q) {
      query = query.or(`name.ilike.%${params.q}%,description.ilike.%${params.q}%`)
    }

    // Only show public organizations or those user is member of
    query = query.or(`is_public.eq.true,memberships.profile_id.eq.${user.id}`)

    // Sorting
    const validSortFields = ['name', 'created_at', 'trust_score']
    const sortField = validSortFields.includes(params.sort || '') ? params.sort : 'created_at'
    const sortOrder = params.order === 'asc' ? 'asc' : 'desc'
    
    query = query.order(sortField, { ascending: sortOrder === 'asc' })

    // Pagination
    const offset = ((params.page || 1) - 1) * (params.limit || 20)
    query = query.range(offset, offset + (params.limit || 20) - 1)

    const { data: organizations, error, count } = await query

    if (error) {
      logger.error('Error fetching organizations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch organizations' },
        { status: 500 }
      )
    }

    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / (params.limit || 20))

    return NextResponse.json({
      success: true,
      data: organizations || [],
      pagination: {
        page: params.page || 1,
        limit: params.limit || 20,
        total: count || 0,
        total_pages: totalPages
      }
    })

  } catch (error) {
    logger.error('Unexpected error in GET /api/organizations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleCreateOrganization(request: AuthenticatedRequest) {
  try {
    const supabase = await createServerClient()
    const user = request.user

    // Rate limiting
    const rateLimitId = `orgs_create:${user.id}`
    if (!checkRateLimit(rateLimitId)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute.' },
        { status: 429 }
      )
    }

    const formData: OrganizationFormData = await request.json()

    // Validate required fields
    if (!formData.name || !formData.type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      )
    }

    // Generate slug from name
    const slug = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    // Check if slug is already taken
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('slug')
      .eq('slug', slug)
      .single()

    if (existingOrg) {
      return NextResponse.json(
        { error: 'Organization name already taken. Please choose a different name.' },
        { status: 400 }
      )
    }

    // Create organization
    const { data: organization, error } = await supabase
      .from('organizations')
      .insert({
        profile_id: user.id,
        name: formData.name,
        slug,
        description: formData.description,
        website_url: formData.website_url,
        avatar_url: formData.avatar_url,
        banner_url: formData.banner_url,
        type: formData.type,
        category: formData.category,
        tags: formData.tags || [],
        governance_model: formData.governance_model || 'hierarchical',
        treasury_address: formData.treasury_address,
        is_public: formData.is_public !== false, // Default to true
        requires_approval: formData.requires_approval !== false, // Default to true
        contact_info: formData.contact_info || {},
        settings: formData.settings || {},
        founded_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating organization:', error)
      return NextResponse.json(
        { error: 'Failed to create organization' },
        { status: 500 }
      )
    }

    // Create owner membership for the creator
    const { error: membershipError } = await supabase
      .from('memberships')
      .insert({
        organization_id: organization.id,
        profile_id: user.id,
        role: 'owner',
        status: 'active',
        title: 'Founder',
        joined_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
        permissions: {
          manage_members: true,
          invite_members: true,
          manage_settings: true,
          manage_treasury: true,
          create_proposals: true,
          moderate_content: true,
          view_analytics: true
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (membershipError) {
      logger.error('Error creating founder membership:', membershipError)
      // Don't fail the org creation, but log the error
    }

    logger.info(`Organization created successfully: ${organization.id}`, {
      userId: user.id,
      organizationId: organization.id,
      name: organization.name
    })

    return NextResponse.json({
      success: true,
      data: organization,
      message: 'Organization created successfully'
    })

  } catch (error) {
    logger.error('Unexpected error in POST /api/organizations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export the wrapped handlers
export const GET = withAuth(handleGetOrganizations)
export const POST = withAuth(handleCreateOrganization)