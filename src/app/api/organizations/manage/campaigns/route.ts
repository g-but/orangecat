import { createServerClient } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    const { id: orgId } = params

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
        project_id,
        created_at,
        updated_at
      `
      )
      .eq('organization_id', orgId)
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
    console.error('Error fetching organization campaigns:', error)
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

    // Check if user has permission to create campaigns
    const permissions = membership.permissions || {}
    if (!permissions.create_campaigns && membership.role !== 'owner' && membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'No permission to create campaigns' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, description, goal_amount, bitcoin_address, category, tags, is_public, project_id } = body

    if (!title || !bitcoin_address) {
      return NextResponse.json(
        { error: 'Missing required fields: title, bitcoin_address' },
        { status: 400 }
      )
    }

    const { data: campaign, error: createError } = await supabase
      .from('campaigns')
      .insert({
        organization_id: orgId,
        title,
        description: description || null,
        goal_amount: goal_amount || 0,
        bitcoin_address,
        category: category || null,
        tags: tags || [],
        status: 'active',
        is_public: is_public !== false,
        project_id: project_id || null,
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
        data: campaign,
        message: 'Campaign created successfully'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating campaign:', error)
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    )
  }
}
