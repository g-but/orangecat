import { logger } from '@/utils/logger'
import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    const { id: projectId } = params

    // Get project details
    const { data: project, error: projectError } = await supabase
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
        created_at,
        updated_at,
        user_id,
        organization_id,
        project_id
      `
      )
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Get transaction/donation count (if transactions table exists)
    // For now, we'll calculate based on raised amount
    const donorCount = project.raised_amount > 0 ? Math.ceil(project.raised_amount / 10000) : 0

    // Calculate progress
    const progressPercent = project.goal_amount > 0
      ? Math.min((project.raised_amount / project.goal_amount) * 100, 100)
      : 0

    // Calculate days remaining (30 days from creation by default)
    const createdDate = new Date(project.created_at)
    const endDate = new Date(createdDate.getTime() + 30 * 24 * 60 * 60 * 1000)
    const now = new Date()
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))

    // Calculate funding rate
    const daysSinceCreation = Math.max(1, Math.ceil((now.getTime() - createdDate.getTime()) / (24 * 60 * 60 * 1000)))
    const dailyFundingRate = project.raised_amount / daysSinceCreation

    // Get project category and related projects
    const { data: relatedProjects, error: relatedError } = await supabase
      .from('projects')
      .select('id, title, raised_amount')
      .eq('category', project.category || '')
      .neq('id', projectId)
      .limit(5)

    const categoryRank = relatedProjects?.length || 0

    return NextResponse.json(
      {
        success: true,
        data: {
          projectId: project.id,
          title: project.title,
          fundingMetrics: {
            goalAmount: project.goal_amount,
            raisedAmount: project.raised_amount,
            progressPercent: Math.round(progressPercent * 100) / 100,
            remaining: Math.max(0, project.goal_amount - project.raised_amount),
            donorCount,
            averageDonation: donorCount > 0 ? Math.round(project.raised_amount / donorCount) : 0
          },
          timeMetrics: {
            createdAt: project.created_at,
            daysActive: daysSinceCreation,
            daysRemaining,
            endDate: endDate.toISOString(),
            daysPercentElapsed: Math.min((daysSinceCreation / 30) * 100, 100)
          },
          performanceMetrics: {
            dailyFundingRate: Math.round(dailyFundingRate),
            projectedTotal: Math.round(project.raised_amount + (dailyFundingRate * daysRemaining)),
            willReachGoal: (project.raised_amount + (dailyFundingRate * daysRemaining)) >= project.goal_amount,
            category: project.category || 'uncategorized',
            categoryRank
          },
          status: project.status,
          visibility: project.is_public ? 'public' : 'private'
        }
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('Error fetching project stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project stats' },
      { status: 500 }
    )
  }
}
