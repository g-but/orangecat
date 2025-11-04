import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { fetchBitcoinBalance } from '@/services/blockchain';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient();

    const { data: project, error } = await supabase
      .from('projects')
      .select('id, user_id, bitcoin_address, bitcoin_balance_btc, bitcoin_balance_updated_at')
      .eq('id', params.id)
      .single();

    if (error || !project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.id !== project.user_id) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!project.bitcoin_address) {
      return Response.json({ error: 'No Bitcoin address configured' }, { status: 400 });
    }

    if (project.bitcoin_balance_updated_at) {
      const last = new Date(project.bitcoin_balance_updated_at);
      const secondsAgo = (Date.now() - last.getTime()) / 1000;
      if (secondsAgo < 1) {
        return Response.json(
          {
            success: true,
            balance_btc: project.bitcoin_balance_btc,
            updated_at: project.bitcoin_balance_updated_at,
            cached: true,
          },
          { status: 202 }
        );
      }
      const minutesAgo = secondsAgo / 60;
      if (minutesAgo < 5) {
        const wait = Math.ceil(5 - minutesAgo);
        return Response.json(
          {
            error: `Please wait ${wait} more minute${wait > 1 ? 's' : ''}`,
            next_refresh_at: new Date(last.getTime() + 5 * 60000).toISOString(),
          },
          { status: 429 }
        );
      }
    }

    const balance = await fetchBitcoinBalance(project.bitcoin_address);

    const { error: updateError } = await supabase
      .from('projects')
      .update({
        bitcoin_balance_btc: balance.balance_btc,
        bitcoin_balance_updated_at: balance.updated_at,
      })
      .eq('id', params.id);

    if (updateError) {
      throw updateError;
    }

    return Response.json({
      success: true,
      balance_btc: balance.balance_btc,
      tx_count: balance.tx_count,
      updated_at: balance.updated_at,
    });
  } catch (err: any) {
    return Response.json({ error: err?.message || 'Failed to refresh balance' }, { status: 500 });
  }
}
