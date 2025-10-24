import { logger } from '@/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const supabase = await createServerClient()

    // Must be authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { description, website_url, treasury_address, xpub, descriptor, network } = body || {}

    // Load org
    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .select('id, slug')
      .eq('slug', params.slug)
      .single()
    if (orgErr || !org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Permission: owner/admin only
    const { data: member } = await supabase
      .from('memberships')
      .select('role, status')
      .eq('organization_id', org.id)
      .eq('profile_id', user.id)
      .single()
    if (!member || member.status !== 'active' || !['owner','admin'].includes(member.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update simple fields
    if (description !== undefined || website_url !== undefined || treasury_address !== undefined) {
      const { error: updErr } = await supabase
        .from('organizations')
        .update({
          description: description ?? undefined,
          website_url: website_url ?? undefined,
          treasury_address: treasury_address ?? undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', org.id)
      if (updErr) {
        return NextResponse.json({ error: updErr.message }, { status: 400 })
      }
    }

    // Upsert wallet if xpub/descriptor provided
    if (xpub || descriptor) {
      // Fetch wallet (one per org)
      const { data: wallet } = await supabase
        .from('wallets')
        .select('id')
        .eq('organization_id', org.id)
        .single()

      if (wallet) {
        const { error: werr } = await supabase
          .from('wallets')
          .update({
            xpub: xpub ?? undefined,
            descriptor: descriptor ?? undefined,
            network: network || 'mainnet',
            updated_at: new Date().toISOString(),
          })
          .eq('id', wallet.id)
        if (werr) return NextResponse.json({ error: werr.message }, { status: 400 })
      } else {
        const { error: werr } = await supabase
          .from('wallets')
          .insert({
            organization_id: org.id,
            xpub: xpub || null,
            descriptor: descriptor || null,
            network: network || 'mainnet',
          })
        if (werr) return NextResponse.json({ error: werr.message }, { status: 400 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    logger.error('Settings update error', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const supabase = await createServerClient()

    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .select('id, slug, description, website_url, treasury_address, is_public')
      .eq('slug', params.slug)
      .single()
    if (orgErr || !org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

    // Try to load wallet
    const { data: wallet } = await supabase
      .from('wallets')
      .select('xpub, descriptor, network, next_index_receive, next_index_change, gap_limit')
      .eq('organization_id', org.id)
      .single()

    return NextResponse.json({
      organization: {
        description: org.description || '',
        website_url: org.website_url || '',
        treasury_address: org.treasury_address || '',
        is_public: org.is_public,
      },
      wallet: wallet || null,
    })
  } catch (e) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
