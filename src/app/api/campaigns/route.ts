import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/db'
import { campaignSchema, type CampaignData } from '@/lib/validation'
import { handleApiError, AuthError, ValidationError } from '@/lib/errors'
import { rateLimit, createRateLimitResponse } from '@/lib/rate-limit'

// GET /api/campaigns - Get all campaigns
export async function GET(request: NextRequest) {
  try {
    // Rate limiting check
    const rateLimitResult = rateLimit(request)
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult)
    }

    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error('Failed to fetch campaigns')
    }

    return Response.json({ success: true, data: campaigns || [] })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/campaigns - Create new campaign
export async function POST(request: NextRequest) {
  try {
    // Rate limiting check (stricter for POST)
    const rateLimitResult = rateLimit(request)
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult)
    }

    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new AuthError()
    }

    const body = await request.json()
    const validatedData = campaignSchema.parse(body)

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .insert({
        ...validatedData,
        creator_id: user.id
      })
      .select('*')
      .single()

    if (error) {
      throw new Error('Failed to create campaign')
    }

    return Response.json({ success: true, data: campaign }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return handleApiError(new ValidationError('Invalid campaign data'))
    }
    return handleApiError(error)
  }
}