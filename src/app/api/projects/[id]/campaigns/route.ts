import { createServerClient } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    const { id: projectId } = params

    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select(
        `
        id,
        title,
        description,
        goal_amount,
        raised_amount,
        bitcoin_address,
        status,
        is_public,
        category,
        tags,
        created_at,
        updated_at
      `
      )
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json(
      {
        success: true,
        data: campaigns || [],
        count: campaigns?.length || 0
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching project campaigns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
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
    const { id: projectId } = params

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get project to check ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('owner_type, owner_id')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to manage campaigns
    let hasPermission = false
    if (project.owner_type === 'profile' && project.owner_id === user.id) {
      hasPermission = true
    } else if (project.owner_type === 'organization') {
      const { data: membership } = await supabase
        .from('memberships')
        .select('role')
        .eq('organization_id', project.owner_id)
        .eq('profile_id', user.id)
        .eq('status', 'active')
        .single()

      if (membership && (membership.role === 'owner' || membership.role === 'admin')) {
        hasPermission = true
      }
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'No permission to manage campaigns for this project' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { campaign_id } = body

    if (!campaign_id) {
      return NextResponse.json(
        { error: 'Missing required field: campaign_id' },
        { status: 400 }
      )
    }

    // Verify campaign exists
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, organization_id, user_id')
      .eq('id', campaign_id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Check campaign ownership matches project owner
    if (project.owner_type === 'organization') {
      if (campaign.organization_id !== project.owner_id) {
        return NextResponse.json(
          { error: 'Campaign must belong to the same organization' },
          { status: 400 }
        )
      }
    } else if (project.owner_type === 'profile') {
      if (campaign.user_id !== project.owner_id) {
        return NextResponse.json(
          { error: 'Campaign must belong to the project owner' },
          { status: 400 }
        )
      }
    }

    // Add campaign to project
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({ project_id: projectId })
      .eq('id', campaign_id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Campaign added to project'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error adding campaign to project:', error)
    return NextResponse.json(
      { error: 'Failed to add campaign to project' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    const { id: projectId } = params

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get project to check ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('owner_type, owner_id')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check if user has permission
    let hasPermission = false
    if (project.owner_type === 'profile' && project.owner_id === user.id) {
      hasPermission = true
    } else if (project.owner_type === 'organization') {
      const { data: membership } = await supabase
        .from('memberships')
        .select('role')
        .eq('organization_id', project.owner_id)
        .eq('profile_id', user.id)
        .eq('status', 'active')
        .single()

      if (membership && (membership.role === 'owner' || membership.role === 'admin')) {
        hasPermission = true
      }
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'No permission' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { campaign_id } = body

    if (!campaign_id) {
      return NextResponse.json(
        { error: 'Missing required field: campaign_id' },
        { status: 400 }
      )
    }

    // Remove campaign from project
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({ project_id: null })
      .eq('id', campaign_id)
      .eq('project_id', projectId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Campaign removed from project'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error removing campaign from project:', error)
    return NextResponse.json(
      { error: 'Failed to remove campaign from project' },
      { status: 500 }
    )
  }
}
