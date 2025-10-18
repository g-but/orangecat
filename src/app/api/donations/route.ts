import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/db'
import { donationSchema, type DonationData } from '@/lib/validation'
import { handleApiError, AuthError, ValidationError } from '@/lib/errors'

// POST /api/donations - Create new donation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new AuthError()
    }

    const body = await request.json()
    const validatedData = donationSchema.parse(body)

    // Verify campaign exists
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, status')
      .eq('id', validatedData.campaign_id)
      .single()

    if (campaignError || !campaign) {
      throw new ValidationError('Campaign not found')
    }

    if (campaign.status !== 'active') {
      throw new ValidationError('Campaign is not active')
    }

    const { data: donation, error } = await supabase
      .from('donations')
      .insert({
        ...validatedData,
        donor_id: validatedData.anonymous ? null : user.id,
        status: 'pending'
      })
      .select(`
        *,
        campaigns:campaign_id (
          id,
          title,
          bitcoin_address,
          lightning_address
        )
      `)
      .single()

    if (error) {
      throw new Error('Failed to create donation')
    }

    return Response.json({ success: true, data: donation }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return handleApiError(new ValidationError('Invalid donation data'))
    }
    return handleApiError(error)
  }
}

// GET /api/donations - Get user's donations
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new AuthError()
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const { data: donations, error } = await supabase
      .from('donations')
      .select(`
        *,
        campaigns:campaign_id (
          id,
          title,
          creator_id,
          profiles:creator_id (
            id,
            username,
            display_name
          )
        )
      `)
      .eq('donor_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error('Failed to fetch donations')
    }

    return Response.json({ success: true, data: donations })
  } catch (error) {
    return handleApiError(error)
  }
}
