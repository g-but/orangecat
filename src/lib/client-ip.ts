/**
 * Who is calling — the one definition, and the one place that reads
 * `x-forwarded-for`.
 *
 * WHICH HOP, AND WHY NOT THE FIRST
 *
 * `X-Forwarded-For` is a list, and Caddy APPENDS to it. A request that arrived
 * through Caddy carries `<whatever the caller sent>, <what Caddy actually
 * saw>`, so the only entry the caller cannot forge is the LAST one.
 *
 * Six places here read that header and every one read it wrong: `rate-limit.ts`
 * used it whole, so any value at all was a fresh key; three payment routes each
 * copied `split(',')[0]`, the caller's own value; the entity audit log recorded
 * that value, making the trail writable by its subject; and the captcha route
 * forwarded it to the provider as `remoteip`.
 *
 * The limiter consequence is the sharp one. Vary the header per request and
 * every request lands in a fresh bucket, so no bucket ever fills — not a
 * weakened limiter but no limiter, on a route that reads as protected. On
 * `GET /api/v1/pay/...` and `POST /api/v1/payments/public` each such request
 * mints a real Lightning invoice through the recipient's own wallet, which is
 * how an attacker gets a seller throttled or banned by their wallet provider.
 *
 * Verified rather than assumed, 2026-08-28: orangecat.ch resolves straight to
 * the box, no CDN in front (`via: 1.1 Caddy`), one Caddy 2.11.4 with no
 * `trusted_proxies` configured — exactly one appended hop.
 *
 * Its own module, not a corner of `rate-limit.ts`, so the audit log and the
 * captcha route can ask who is calling without importing an Upstash client.
 *
 * See bitbaum/orangecat#563 finding 2. `limitkit@0.2.0` ships the same
 * correction as `clientIp()`; adopting it here is ADR-0002's remaining work.
 */

type HeadersLike = { get(name: string): string | null };
type RequestLike = { headers: HeadersLike };

/**
 * The caller's IP as seen by Caddy, or a shared `anonymous` bucket.
 *
 * The fallback throttles unattributable traffic collectively rather than
 * letting it past, and is never empty — an empty key would read as a real
 * identity in `l402:${key}` while collapsing every caller into one bucket.
 */
export function clientIpKey(request: RequestLike): string {
  const hops = (request.headers.get('x-forwarded-for') ?? '')
    .split(',')
    .map((hop) => hop.trim())
    .filter(Boolean);

  // One trusted proxy (Caddy), so the rightmost hop is the one it wrote.
  if (hops.length > 0) return hops[hops.length - 1]!;

  return request.headers.get('x-real-ip')?.trim() || 'anonymous';
}

/**
 * The same answer where an ADDRESS is wanted rather than a bucket key —
 * an audit row or a captcha `remoteip` wants nothing at all rather than the
 * word "anonymous", which is a limiter concept and not a place.
 */
export function clientIpOrUndefined(request: RequestLike): string | undefined {
  const key = clientIpKey(request);
  return key === 'anonymous' ? undefined : key;
}
