/**
 * SSRF guard for user-supplied outbound URLs (webhook endpoints).
 *
 * A webhook URL is fetched server-side by the delivery worker and the response
 * body is stored where the endpoint owner can read it back — so without this
 * check an authenticated user could point a webhook at internal services
 * (localhost, RFC1918 ranges, cloud metadata) and exfiltrate responses.
 *
 * Checked twice: at mint time (fast feedback in the API) and again immediately
 * before every worker fetch (so a DNS record that later flips to a private
 * address is caught). Re-resolving just before the fetch narrows but does not
 * fully close the DNS-rebinding window; closing it entirely would require
 * pinning the resolved IP on the socket. Accepted residual risk for now.
 */

import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

type UrlCheck = { ok: true } | { ok: false; reason: string };

type Resolver = (hostname: string) => Promise<Array<{ address: string }>>;

const defaultResolver: Resolver = async hostname => lookup(hostname, { all: true, verbatim: true });

function isPrivateIPv4(ip: string): boolean {
  const octets = ip.split('.').map(Number);
  if (octets.length !== 4 || octets.some(o => Number.isNaN(o))) {
    return true; // malformed — treat as unsafe
  }
  const [a, b] = octets;
  return (
    a === 0 || // "this network"
    a === 10 || // RFC1918
    a === 127 || // loopback
    (a === 100 && b >= 64 && b <= 127) || // CGNAT 100.64/10
    (a === 169 && b === 254) || // link-local / cloud metadata
    (a === 172 && b >= 16 && b <= 31) || // RFC1918
    (a === 192 && b === 168) || // RFC1918
    (a === 192 && b === 0) || // IETF protocol assignments 192.0.0/24 + 192.0.2/24 test
    (a === 198 && (b === 18 || b === 19)) || // benchmarking 198.18/15
    a >= 224 // multicast + reserved + broadcast
  );
}

/** True when `ip` (v4 or v6) is loopback, link-local, private, or reserved. */
export function isPrivateAddress(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    return isPrivateIPv4(ip);
  }
  if (version === 6) {
    const lower = ip.toLowerCase();
    // IPv4-mapped (::ffff:a.b.c.d) — check the embedded v4 address
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) {
      return isPrivateIPv4(mapped[1]);
    }
    return (
      lower === '::' ||
      lower === '::1' ||
      lower.startsWith('fc') || // ULA fc00::/7
      lower.startsWith('fd') ||
      lower.startsWith('fe8') || // link-local fe80::/10
      lower.startsWith('fe9') ||
      lower.startsWith('fea') ||
      lower.startsWith('feb') ||
      lower.startsWith('fec') || // deprecated site-local fec0::/10
      lower.startsWith('fed') ||
      lower.startsWith('fee') ||
      lower.startsWith('fef')
    );
  }
  return true; // not an IP at all — caller should have resolved first
}

/**
 * Validate that a user-supplied URL is http(s) and does not point at a
 * private/internal address, resolving DNS when the host is a name.
 * Pure policy — callers decide when to enforce (production only, etc.).
 */
export async function checkPublicUrl(
  rawUrl: string,
  resolve: Resolver = defaultResolver
): Promise<UrlCheck> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, reason: 'not a valid URL' };
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return { ok: false, reason: 'only http(s) URLs are allowed' };
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    return { ok: false, reason: 'localhost is not allowed' };
  }

  if (isIP(hostname)) {
    return isPrivateAddress(hostname)
      ? { ok: false, reason: 'IP address is private or reserved' }
      : { ok: true };
  }

  let addresses: Array<{ address: string }>;
  try {
    addresses = await resolve(hostname);
  } catch {
    return { ok: false, reason: 'hostname does not resolve' };
  }
  if (addresses.length === 0) {
    return { ok: false, reason: 'hostname does not resolve' };
  }
  for (const { address } of addresses) {
    if (isPrivateAddress(address)) {
      return { ok: false, reason: 'hostname resolves to a private or reserved address' };
    }
  }
  return { ok: true };
}
