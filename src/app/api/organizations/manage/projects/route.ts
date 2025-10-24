import { logger } from '@/utils/logger'
import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    const { id: orgId } = params

    const { data: projects, error } = await supabase
      .from('projects')
      .select(
        `
        id,
        name,
        slug,
        description,
        category,
        tags,
        status,
        visibility,
        website_url,
        github_url,
        image_url,
        featured,
        created_at,
        updated_at
      `
      )
      .eq('owner_type', 'organization')
      .eq('owner_id', orgId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json(
      {
        success: true,
        data: projects || [],
        count: projects?.length || 0
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('Error fetching organization projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    const { id: orgId } = params

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is organization member with permission
    const { data: membership, error: memberError } = await supabase
      .from('memberships')
      .select('role, permissions')
      .eq('organization_id', orgId)
      .eq('profile_id', user.id)
      .eq('status', 'active')
      .single()

    if (memberError || !membership) {
      return NextResponse.json(
        { error: 'Not a member of this organization' },
        { status: 403 }
      )
    }

    // Check if user has permission to create projects
    if (membership.role !== 'owner' && membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'No permission to create projects' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, slug, description, long_description, category, tags, website_url, github_url, visibility } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug' },
        { status: 400 }
      )
    }

    // Check for unique slug within organization
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id')
      .eq('slug', slug)
      .eq('owner_type', 'organization')
      .eq('owner_id', orgId)
      .single()

    if (existingProject) {
      return NextResponse.json(
        { error: 'A project with this slug already exists in this organization' },
        { status: 400 }
      )
    }

    const { data: project, error: createError } = await supabase
      .from('projects')
      .insert({
        owner_type: 'organization',
        owner_id: orgId,
        name,
        slug,
        description: description || null,
        long_description: long_description || null,
        category: category || null,
        tags: tags || [],
        status: 'active',
        visibility: visibility || 'public',
        website_url: website_url || null,
        github_url: github_url || null,
        featured: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      throw createError
    }

    return NextResponse.json(
      {
        success: true,
        data: project,
        message: 'Project created successfully'
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
