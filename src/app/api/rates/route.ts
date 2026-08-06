/**
 * GET /api/rates — what Bitcoin costs, served from our own origin.
 *
 * Browsers used to call CoinGecko directly. Two things were wrong with that:
 * every visitor paid the upstream latency themselves (a cold call measured ~14s,
 * during which every amount on the page sat in BTC), and the page needed a
 * third-party host in `connect-src`, so the content policy could not honestly be
 * tightened. Routing through here collapses one upstream call per visitor into
 * one per minute for the whole platform, and keeps the policy at 'self'.
 *
 * 503 when we have no usable rate. That is the point: the client must be able to
 * tell "Bitcoin costs X" apart from "we don't know", because the honest response
 * to not knowing is to stop quoting francs — not to quote a guess.
 */

import { apiSuccess, apiServiceUnavailable } from '@/lib/api/standardResponse';
import { getRateSnapshot } from '@/services/currency/rateSource.server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const snapshot = await getRateSnapshot();

  if (!snapshot) {
    return apiServiceUnavailable('Bitcoin rates are unavailable right now.');
  }

  return apiSuccess(snapshot, {
    // Short and shared: a minute-old BTC rate is fine for display, and this is
    // what stops a traffic spike becoming a spike of upstream calls.
    headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=300' },
  });
}
