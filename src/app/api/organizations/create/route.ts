import { logger } from '@/utils/logger'
import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface CreateOrganizationRequest {
  name: string
  slug: string
  description?: string
  type: string
  governance_model?: string
  avatar_url?: string
  banner_url?: string
  website_url?: string
  treasury_address?: string
  is_public?: boolean
  requires_approval?: boolean
}

interface CreateOrganizationResponse {
  id: string
  name: string
  slug: string
  type: string
  created_at: string
  message: string
}

// Helper function to generate a unique slug
async function generateUniqueSlug(supabase: any, baseSlug: string): Promise<string> {
  let slug = baseSlug.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  
  // Check if slug exists
  let attempt = 0
  let finalSlug = slug
  
  while (attempt < 100) {
    const { data, error } = await supabase
      .from('organizations')
      .select('slug')
      .eq('slug', finalSlug)
      .single()
    
    if (error && error.code === 'PGRST116') {
      // No matching row found, slug is unique
      return finalSlug
    }
    
    attempt++
    finalSlug = `${slug}-${attempt}`
  }
  
  throw new Error('Could not generate unique slug')
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrganizationRequest = await request.json()
    
    // Validate required fields
    if (!body.name || !body.slug || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug, type' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = await createServerClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: User not authenticated' },
        { status: 401 }
      )
    }

    // Generate unique slug
    const uniqueSlug = await generateUniqueSlug(supabase, body.slug)

    // Create organization with the authenticated user as creator
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert({
        profile_id: user.id,
        name: body.name,
        slug: uniqueSlug,
        description: body.description || null,
        type: body.type,
        governance_model: body.governance_model || 'hierarchical',
        avatar_url: body.avatar_url || null,
        banner_url: body.banner_url || null,
        website_url: body.website_url || null,
        treasury_address: body.treasury_address || null,
        is_public: body.is_public !== false, // Default to public
        requires_approval: body.requires_approval !== false,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (orgError) {
      logger.error('Organization creation error:', orgError)
      return NextResponse.json(
        { error: `Failed to create organization: ${orgError.message}` },
        { status: 500 }
      )
    }

    // Create membership record for the creator as owner
    const { data: membership, error: memberError } = await supabase
      .from('memberships')
      .insert({
        organization_id: organization.id,
        profile_id: user.id,
        role: 'owner',
        status: 'active',
        permissions: {
          manage_members: true,
          invite_members: true,
          manage_settings: true,
          manage_treasury: true,
          create_proposals: true,
          moderate_content: true,
          view_analytics: true
        },
        joined_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (memberError) {
      logger.error('Membership creation error:', memberError)
      // Organization was created but membership failed - this is a partial failure
      // In a transaction system, we'd rollback, but with Supabase we continue
      return NextResponse.json(
        {
          error: 'Organization created but membership setup failed',
          organization_id: organization.id
        },
        { status: 500 }
      )
    }

    // Return success response
    return NextResponse.json(
      {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        type: organization.type,
        created_at: organization.created_at,
        message: 'Organization created successfully'
      } as CreateOrganizationResponse,
      { status: 201 }
    )

  } catch (error) {
    logger.error('Error creating organization:', error)
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    )
  }
}
