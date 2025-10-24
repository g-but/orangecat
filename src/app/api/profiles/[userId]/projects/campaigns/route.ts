import { logger } from '@/utils/logger'
import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await createServerClient()
    const { userId } = params

    // Get user's personal projects
    const { data: personalProjects, error: personalError } = await supabase
      .from('projects')
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
      .eq('user_id', userId)
      .eq('organization_id', null)
      .order('created_at', { ascending: false })

    if (personalError) {
      throw personalError
    }

    // Get projects from organizations user is member of
    const { data: orgMemberships, error: membershipsError } = await supabase
      .from('memberships')
      .select('organization_id')
      .eq('profile_id', userId)
      .eq('status', 'active')

    if (membershipsError) {
      throw membershipsError
    }

    let orgProjects = []
    if (orgMemberships && orgMemberships.length > 0) {
      const orgIds = orgMemberships.map(m => m.organization_id)
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
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
          updated_at,
          organization_id,
          organizations(name, slug)
        `
        )
        .in('organization_id', orgIds)
        .order('created_at', { ascending: false })

      if (projectsError) {
        throw projectsError
      }
      orgProjects = projects || []
    }

    // Combine and sort
    const allProjects = [
      ...personalProjects,
      ...orgProjects
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json(
      {
        success: true,
        data: allProjects,
        counts: {
          personal: personalProjects.length,
          organization: orgProjects.length,
          total: allProjects.length
        }
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('Error fetching user projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}
