import { createClient } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = createClient()
    const { userId } = params

    // Get user's personal campaigns
    const { data: personalCampaigns, error: personalError } = await supabase
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
      .eq('user_id', userId)
      .eq('organization_id', null)
      .order('created_at', { ascending: false })

    if (personalError) {
      throw personalError
    }

    // Get campaigns from organizations user is member of
    const { data: orgMemberships, error: membershipsError } = await supabase
      .from('memberships')
      .select('organization_id')
      .eq('profile_id', userId)
      .eq('status', 'active')

    if (membershipsError) {
      throw membershipsError
    }

    let orgCampaigns = []
    if (orgMemberships && orgMemberships.length > 0) {
      const orgIds = orgMemberships.map(m => m.organization_id)
      const { data: campaigns, error: campaignsError } = await supabase
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
          updated_at,
          organization_id,
          organizations(name, slug)
        `
        )
        .in('organization_id', orgIds)
        .order('created_at', { ascending: false })

      if (campaignsError) {
        throw campaignsError
      }
      orgCampaigns = campaigns || []
    }

    // Combine and sort
    const allCampaigns = [
      ...personalCampaigns,
      ...orgCampaigns
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json(
      {
        success: true,
        data: allCampaigns,
        counts: {
          personal: personalCampaigns.length,
          organization: orgCampaigns.length,
          total: allCampaigns.length
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching user campaigns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}
