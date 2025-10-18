import { createServerClient } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await createServerClient()
    const { userId } = params

    // Get organizations user is founder of
    const { data: foundedOrgs, error: founderError } = await supabase
      .from('organizations')
      .select(
        `
        id,
        name,
        slug,
        description,
        type,
        governance_model,
        avatar_url,
        website_url,
        is_public,
        member_count,
        trust_score,
        status,
        created_at,
        updated_at
      `
      )
      .eq('profile_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (founderError) {
      throw founderError
    }

    // Get organizations user is member of
    const { data: memberOrgs, error: memberError } = await supabase
      .from('memberships')
      .select(
        `
        organization_id,
        role,
        joined_at,
        organizations!inner(
          id,
          name,
          slug,
          description,
          type,
          governance_model,
          avatar_url,
          website_url,
          is_public,
          member_count,
          trust_score,
          status,
          created_at,
          updated_at
        )
      `
      )
      .eq('profile_id', userId)
      .eq('status', 'active')
      .eq('organizations.status', 'active')
      .order('joined_at', { ascending: false })

    if (memberError) {
      throw memberError
    }

    // Extract org data from member orgs and exclude duplicates (founder orgs)
    const memberOrgData = (memberOrgs || [])
      .map(m => ({ ...m.organizations, memberRole: m.role }))
      .filter(org => !foundedOrgs.some(f => f.id === org.id))

    // Combine: founded orgs + member orgs
    const allOrgs = [
      ...foundedOrgs.map(org => ({ ...org, memberRole: 'founder' })),
      ...memberOrgData
    ]

    return NextResponse.json(
      {
        success: true,
        data: allOrgs,
        counts: {
          founded: foundedOrgs.length,
          member: memberOrgData.length,
          total: allOrgs.length
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching user organizations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    )
  }
}
