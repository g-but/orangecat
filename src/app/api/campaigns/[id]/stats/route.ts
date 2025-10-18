import { createServerClient } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    const { id: campaignId } = params

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
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
        created_at,
        updated_at,
        user_id,
        organization_id,
        project_id
      `
      )
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Get transaction/donation count (if transactions table exists)
    // For now, we'll calculate based on raised amount
    const donorCount = campaign.raised_amount > 0 ? Math.ceil(campaign.raised_amount / 10000) : 0

    // Calculate progress
    const progressPercent = campaign.goal_amount > 0
      ? Math.min((campaign.raised_amount / campaign.goal_amount) * 100, 100)
      : 0

    // Calculate days remaining (30 days from creation by default)
    const createdDate = new Date(campaign.created_at)
    const endDate = new Date(createdDate.getTime() + 30 * 24 * 60 * 60 * 1000)
    const now = new Date()
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))

    // Calculate funding rate
    const daysSinceCreation = Math.max(1, Math.ceil((now.getTime() - createdDate.getTime()) / (24 * 60 * 60 * 1000)))
    const dailyFundingRate = campaign.raised_amount / daysSinceCreation

    // Get campaign category and related campaigns
    const { data: relatedCampaigns, error: relatedError } = await supabase
      .from('campaigns')
      .select('id, title, raised_amount')
      .eq('category', campaign.category || '')
      .neq('id', campaignId)
      .limit(5)

    const categoryRank = relatedCampaigns?.length || 0

    return NextResponse.json(
      {
        success: true,
        data: {
          campaignId: campaign.id,
          title: campaign.title,
          fundingMetrics: {
            goalAmount: campaign.goal_amount,
            raisedAmount: campaign.raised_amount,
            progressPercent: Math.round(progressPercent * 100) / 100,
            remaining: Math.max(0, campaign.goal_amount - campaign.raised_amount),
            donorCount,
            averageDonation: donorCount > 0 ? Math.round(campaign.raised_amount / donorCount) : 0
          },
          timeMetrics: {
            createdAt: campaign.created_at,
            daysActive: daysSinceCreation,
            daysRemaining,
            endDate: endDate.toISOString(),
            daysPercentElapsed: Math.min((daysSinceCreation / 30) * 100, 100)
          },
          performanceMetrics: {
            dailyFundingRate: Math.round(dailyFundingRate),
            projectedTotal: Math.round(campaign.raised_amount + (dailyFundingRate * daysRemaining)),
            willReachGoal: (campaign.raised_amount + (dailyFundingRate * daysRemaining)) >= campaign.goal_amount,
            category: campaign.category || 'uncategorized',
            categoryRank
          },
          status: campaign.status,
          visibility: campaign.is_public ? 'public' : 'private'
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching campaign stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign stats' },
      { status: 500 }
    )
  }
}
