import { NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth'
import { createServerClient } from '@/services/supabase/server'
import { logger } from '@/utils/logger'
import { validateCampaignCreate } from '@/lib/validation/schemas'

async function handleCreateCampaign(request: AuthenticatedRequest) {
  try {
    const supabase = await createServerClient()
    const user = request.user
    const body = await request.json()

    const {
      title,
      description,
      goal,
      category,
      tags,
      bitcoinAddress,
      lightningAddress,
      endDate,
      imageUrl
    } = body || {}

    const validation = validateCampaignCreate({
      title,
      description,
      goal,
      category,
      tags,
      bitcoinAddress,
      lightningAddress,
      endDate,
      imageUrl
    })
    if (!validation.valid) {
      return NextResponse.json({ error: 'Invalid campaign data', details: validation.details }, { status: 400 })
    }

    try {
      const insertData: any = {
        creator_id: user.id,
        title,
        description,
        goal_btc: goal ? parseFloat(goal) : null,
        category: category || null,
        tags: Array.isArray(tags) ? tags : [],
        bitcoin_address: bitcoinAddress || null,
        lightning_address: lightningAddress || null,
        end_date: endDate || null,
        image_url: imageUrl || null,
        is_public: true,
        is_active: true
      }

      const { data: campaign, error } = await supabase
        .from('funding_pages')
        .insert(insertData)
        .select()
        .single()

      if (error || !campaign) {
        logger.error('Failed to create campaign', error)
        return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
      }

      return NextResponse.json({ success: true, data: campaign, message: 'Campaign created successfully' })
    } catch (err: any) {
      logger.warn('Campaigns table not available', { message: err?.message })
      return NextResponse.json({
        error: 'Campaigns are not enabled on this environment.',
        hint: 'Ensure funding_pages table exists and required columns are present.'
      }, { status: 501 })
    }
  } catch (error) {
    logger.error('Unexpected error in POST /api/campaigns:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withAuth(handleCreateCampaign)

