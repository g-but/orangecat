/**
 * Render-side guard for user-supplied URLs.
 *
 * `webUrl()` (src/lib/validation/base.ts) stops unsafe schemes at the write
 * boundary, but validation only binds rows written AFTER it shipped. Anything
 * already in the database — or written by a path that skips the schema, e.g. a
 * direct service-role insert or an import — reaches the renderer unchecked.
 *
 * So the href is guarded where it is produced, not only where it is stored:
 * two independent checks, because a single one is a single point of failure and
 * the failure mode here is executing an attacker's script in a visitor's
 * session. Note that `target="_blank"` + `rel="noopener noreferrer"` do NOT
 * help — they govern the opened context, while `javascript:` never opens one.
 */

/** Schemes that may appear in an href/src rendered from user data. */
const SAFE_SCHEME = /^https?:\/\//i;

/**
 * Returns the URL when it is safe to place in an `href`/`src`, else null.
 * Render the link only when this returns a value:
 *
 *   const href = safeHref(item.external_url);
 *   {href && <a href={href} target="_blank" rel="noopener noreferrer">…</a>}
 *
 * Dropping the link is deliberate: a value that is not an http(s) URL is either
 * an attack or corrupt data, and neither should be presented to a visitor as a
 * clickable link.
 */
export function safeHref(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  // Leading control characters/whitespace are stripped by browsers before the
  // scheme is parsed, so "\njavascript:…" is live — trim before testing.
  return SAFE_SCHEME.test(trimmed) ? trimmed : null;
}

/** Filters a list of user-supplied URLs down to the ones safe to link. */
export function safeHrefs(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }
  return values.map(safeHref).filter((url): url is string => url !== null);
}

/**
 * Host shown as a link's visible label — "orangecat.ch" reads better than a
 * full URL and, more importantly, makes the destination legible instead of
 * letting a long path hide where the link actually goes.
 */
export function hrefLabel(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return url;
  }
}
