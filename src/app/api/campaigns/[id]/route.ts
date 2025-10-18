import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/db'
import { handleApiError, AuthError, NotFoundError } from '@/lib/errors'

// GET /api/campaigns/[id] - Get specific campaign
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    const { id } = params

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        profiles:creator_id (
          id,
          username,
          display_name,
          avatar_url
        ),
        donations (
          id,
          amount,
          currency,
          status,
          anonymous,
          message,
          created_at,
          profiles:donor_id (
            id,
            username,
            display_name,
            avatar_url
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error || !campaign) {
      throw new NotFoundError('Campaign')
    }

    return Response.json({ success: true, data: campaign })
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/campaigns/[id] - Update campaign
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new AuthError()
    }

    const { id } = params
    const body = await request.json()

    // Check if user owns the campaign
    const { data: existingCampaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('creator_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingCampaign) {
      throw new NotFoundError('Campaign')
    }

    if (existingCampaign.creator_id !== user.id) {
      throw new AuthError('You can only update your own campaigns')
    }

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error('Failed to update campaign')
    }

    return Response.json({ success: true, data: campaign })
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/campaigns/[id] - Delete campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new AuthError()
    }

    const { id } = params

    // Check if user owns the campaign
    const { data: existingCampaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('creator_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingCampaign) {
      throw new NotFoundError('Campaign')
    }

    if (existingCampaign.creator_id !== user.id) {
      throw new AuthError('You can only delete your own campaigns')
    }

    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error('Failed to delete campaign')
    }

    return Response.json({ success: true, message: 'Campaign deleted' })
  } catch (error) {
    return handleApiError(error)
  }
}
