import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

const cache = new Map<string, { t: number; data: any }>();
const CACHE_TTL_MS = 10_000;

function base() {
  return process.env.EXPLORER_BASE_URL || 'https://mempool.space';
}
async function j(url: string) {
  const r = await fetch(url, { cache: 'no-store' as any });
  if (!r.ok) {
    throw new Error(`${r.status} ${url}`);
  }
  return r.json();
}
function txUrl(txid: string) {
  return `${base()}/tx/${txid}`;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient();
    const { data: project } = await supabase
      .from('projects')
      .select('id, bitcoin_address, user_id')
      .eq('id', params.id)
      .single();
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // For MVP, all projects are public - simplified from organization checks
    // Future: Add is_public column if needed
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user && project.user_id !== user.id) {
      // Only owner can view treasury details (for now)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const addr = project.bitcoin_address;
    if (!addr) {
      return NextResponse.json({ error: 'No wallet address configured' }, { status: 400 });
    }

    const key = `project-activity:${addr}`;
    const now = Date.now();
    const c = cache.get(key);
    if (c && now - c.t < CACHE_TTL_MS) {
      return NextResponse.json(c.data);
    }

    const b = base();
    const [stats, chainTxs, memTxs, tip] = await Promise.all([
      j(`${b}/api/address/${addr}`),
      j(`${b}/api/address/${addr}/txs`).catch(() => []),
      j(`${b}/api/address/${addr}/txs/mempool`).catch(() => []),
      j(`${b}/api/blocks/tip/height`).catch(() => 0),
    ]);
    const chain = stats.chain_stats || {};
    const mem = stats.mempool_stats || {};
    const received_sats = chain.funded_txo_sum || 0;
    const spent_sats = chain.spent_txo_sum || 0;
    const balance_sats = received_sats - spent_sats;
    const unconfirmed_sats = (mem.funded_txo_sum || 0) - (mem.spent_txo_sum || 0);

    function mapTx(tx: any) {
      const vin = tx.vin || [];
      const vout = tx.vout || [];
      const rcv = vout
        .filter((o: any) => o?.scriptpubkey_address === addr)
        .reduce((a: number, o: any) => a + (o?.value || 0), 0);
      const spt = vin
        .filter((i: any) => i?.prevout?.scriptpubkey_address === addr)
        .reduce((a: number, i: any) => a + (i?.prevout?.value || 0), 0);
      const d = rcv - spt;
      const confirmed = !!tx.status?.confirmed;
      const height = tx.status?.block_height || null;
      const confs = confirmed && tip ? Math.max(0, tip - height + 1) : 0;
      return {
        txid: tx.txid,
        time: tx.status?.block_time || tx.received_at || null,
        amount_sats: Math.abs(d),
        direction: d >= 0 ? 'in' : 'out',
        confirmations: confs,
        explorer_url: txUrl(tx.txid),
      };
    }
    const txs = [...(memTxs || []), ...(chainTxs || [])].slice(0, 20).map(mapTx);
    const payload = {
      address: addr,
      explorer_base: b,
      received_sats,
      spent_sats,
      balance_sats,
      unconfirmed_sats,
      txs,
      last_updated: new Date().toISOString(),
    };
    cache.set(key, { t: now, data: payload });
    return NextResponse.json(payload);
  } catch (e) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
