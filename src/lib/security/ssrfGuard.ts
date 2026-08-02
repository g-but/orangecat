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

export { isPrivateAddress } from './private-address';
import { isPrivateAddress } from './private-address';

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
