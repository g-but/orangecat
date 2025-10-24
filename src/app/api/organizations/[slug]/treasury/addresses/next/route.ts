import { logger } from '@/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { deriveP2WPKHFromXpub } from '@/lib/bitcoin'

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Load organization
    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .select('id, slug')
      .eq('slug', params.slug)
      .single()
    if (orgErr || !org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

    // Permission: owner/admin
    const { data: member } = await supabase
      .from('memberships')
      .select('role, status')
      .eq('organization_id', org.id)
      .eq('profile_id', user.id)
      .single()
    if (!member || member.status !== 'active' || !['owner','admin'].includes(member.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Load wallet
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id, xpub, descriptor, network, next_index_receive')
      .eq('organization_id', org.id)
      .single()
    if (!wallet) return NextResponse.json({ error: 'No wallet configured' }, { status: 400 })

    // Derive next address (receive chain m/0/index) - BIP84 P2WPKH by default
    if (!wallet.xpub) return NextResponse.json({ error: 'Missing xpub' }, { status: 400 })
    const address = deriveP2WPKHFromXpub(wallet.xpub, 0, wallet.next_index_receive, wallet.network)

    // Record and increment
    const { error: addrErr } = await supabase
      .from('wallet_addresses')
      .insert({
        wallet_id: wallet.id,
        idx: wallet.next_index_receive,
        addr_type: 'receive',
        address,
        status: 'allocated',
      })
    if (addrErr) return NextResponse.json({ error: addrErr.message }, { status: 400 })

    const { error: incErr } = await supabase
      .from('wallets')
      .update({ next_index_receive: wallet.next_index_receive + 1 })
      .eq('id', wallet.id)
    if (incErr) return NextResponse.json({ error: incErr.message }, { status: 400 })

    return NextResponse.json({ address, index: wallet.next_index_receive })
  } catch (e) {
    logger.error('derive_next_address error', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
