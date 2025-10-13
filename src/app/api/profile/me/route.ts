import { NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth'
import { createServerClient } from '@/services/supabase/server'
import { logger } from '@/utils/logger'

async function handleGetCurrentProfile(request: AuthenticatedRequest) {
  try {
    const supabase = await createServerClient()
    const user = request.user

    // Fetch current user's profile - align with actual DB columns (display_name, no full_name)
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        display_name,
        avatar_url,
        website,
        created_at,
        updated_at
      `)
      .eq('id', user.id)
      .single()

    if (error) {
      logger.error('Error fetching current profile:', error)
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    if (!profile) {
      // Profile doesn't exist yet - create a default one using existing columns
      const username = user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          username: username,
          display_name: user.user_metadata?.full_name || username
        })
        .select(`id, username, display_name, avatar_url, website, created_at, updated_at`)
        .single()

      if (createError) {
        logger.error('Error creating profile:', createError)
        return NextResponse.json(
          { error: 'Failed to create profile' },
          { status: 500 }
        )
      }

    return NextResponse.json({
      success: true,
      data: newProfile
    })
    }

    return NextResponse.json({
      success: true,
      data: profile
    })

  } catch (error) {
    logger.error('Unexpected error in GET /api/profile/me:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(handleGetCurrentProfile)

// Update current user's profile (display_name, bio, avatar_url, website, bitcoin_address, lightning_address)
export const PUT = withAuth(async function updateCurrentProfile(request: AuthenticatedRequest) {
  try {
    const supabase = await createServerClient()
    const user = request.user

    const payload = await request.json()
    // Allow only known, safe fields
    const updates: Record<string, any> = {}
    const allowed = [
      'display_name',
      'bio',
      'avatar_url',
      'banner_url',
      'website',
      'bitcoin_address',
      'lightning_address'
    ]
    for (const key of allowed) {
      if (payload[key] !== undefined) updates[key] = typeof payload[key] === 'string' ? payload[key].trim() : payload[key]
    }
    updates.updated_at = new Date().toISOString()

    // Basic BTC address sanity check (non-authoritative)
    if (updates.bitcoin_address) {
      const btc = updates.bitcoin_address
      const valid = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,}$/i.test(btc)
      if (!valid) {
        return NextResponse.json({ error: 'Invalid Bitcoin address format' }, { status: 400 })
      }
    }

    // Optional lightning address sanity check: simple local@domain.tld pattern
    if (updates.lightning_address) {
      const ln = String(updates.lightning_address)
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ln)
      if (!valid) {
        return NextResponse.json({ error: 'Invalid Lightning address format' }, { status: 400 })
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select('id, username, display_name, bio, avatar_url, banner_url, website, bitcoin_address, lightning_address, created_at, updated_at')
      .single()

    if (error) {
      logger.error('Error updating current profile:', error)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    logger.error('Unexpected error in PUT /api/profile/me:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
