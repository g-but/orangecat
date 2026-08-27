/**
 * GET /api/internal/tls-check?domain=<host> — may Caddy issue a certificate?
 *
 * This is the endpoint Caddy's `on_demand_tls { ask ... }` calls before it
 * obtains a certificate for a hostname it has never seen. 200 means yes.
 *
 * WHY THIS EXISTS
 *
 * The alternative to on-demand TLS is a wildcard certificate, which needs a
 * DNS-01 challenge, an Infomaniak API token on the box, and a Caddy plugin — and
 * it still would not cover a customer's own domain. On-demand needs none of
 * that, and it inverts the relationship in the right direction: instead of
 * infrastructure being edited every time a customer appears, Caddy ASKS
 * OrangeCat which hostnames are real, and OrangeCat already knows.
 *
 * THIS IS A GATE, NOT A LOOKUP
 *
 * Answering 200 too freely is a denial of service against ourselves: every yes
 * is an ACME order, and Let's Encrypt rate-limits an account that fails them.
 * Somebody who points `whatever.example` at this box and requests it can
 * therefore burn our issuance budget. So the rule is strict — the hostname must
 * resolve to a site that is published RIGHT NOW, reserved subdomains are
 * refused before any query, and anything unrecognised is a flat 403.
 *
 * Internal by convention only: Caddy calls it over loopback, and it discloses
 * nothing an ordinary visitor could not learn by loading the site itself.
 */

import { isReservedSubdomain, normaliseHost, SITES_BASE_DOMAIN } from '@/config/sites';
import { siteByHost } from '@/services/sites/registry';
import { logger } from '@/utils/logger';

/** Caddy blocks on this call, so it must be quick and must never hang. */
export const dynamic = 'force-dynamic';

// Plain `Response`, not `NextResponse`: this returns a status and a line of
// text, and nothing here needs Next's cookie or rewrite helpers.
function deny(reason: string): Response {
  // Caddy treats any non-2xx as "do not issue". The body is for our logs.
  return new Response(reason, { status: 403 });
}

export async function GET(request: Request): Promise<Response> {
  const domain = new URL(request.url).searchParams.get('domain');
  if (!domain) {
    return deny('missing domain');
  }

  const host = normaliseHost(domain);
  if (!host || host.length > 253) {
    return deny('malformed domain');
  }

  // Reserved names are refused before a query runs. They have their own Caddy
  // blocks and their own certificates; issuing a second one here would at best
  // be waste and at worst hand `security.orangecat.ch` to whoever asked.
  const suffix = `.${SITES_BASE_DOMAIN}`;
  if (host.endsWith(suffix)) {
    const label = host.slice(0, -suffix.length);
    if (!label || label.includes('.') || isReservedSubdomain(label)) {
      return deny('reserved or malformed subdomain');
    }
  }

  try {
    const resolved = await siteByHost(host);
    if (!resolved) {
      return deny('no published site answers on this host');
    }
    return new Response('ok', { status: 200 });
  } catch (error) {
    // Fail CLOSED. A database blip must not become an open certificate mint.
    logger.warn('TLS check failed', { host, error: String(error) }, 'Sites');
    return deny('lookup failed');
  }
}
