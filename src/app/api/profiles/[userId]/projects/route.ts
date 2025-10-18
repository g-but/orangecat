import { createClient } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = createClient()
    const { userId } = params

    // Get user's personal projects
    const { data: personalProjects, error: personalError } = await supabase
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
      .eq('owner_type', 'profile')
      .eq('owner_id', userId)
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
          updated_at,
          owner_id,
          organizations(name, slug)
        `
        )
        .eq('owner_type', 'organization')
        .in('owner_id', orgIds)
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
    console.error('Error fetching user projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}
