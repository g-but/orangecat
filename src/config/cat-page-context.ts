/**
 * Page → Cat context: turns the URL the user is currently on into a small,
 * safe descriptor Cat can reason about ("they're looking at project abc123").
 * This is what makes the global Cat launcher page-AWARE instead of generic —
 * open it on a project and Cat knows the project, open it on an article and it
 * knows the article. Client- and server-safe (no imports beyond types).
 *
 * Deliberately conservative: we only claim an entity for routes we recognise,
 * and never treat create/edit sub-routes as an entity ref.
 */

export interface CatPageEntity {
  /** Entity kind, e.g. 'project', 'article', 'profile'. */
  type: string;
  /** The id or slug from the URL. */
  ref: string;
}

export interface CatPageDescriptor {
  /** The absolute in-app path (same-origin). */
  path: string;
  /** Human phrase for UI ("a project", "your dashboard"). */
  label?: string;
  /** Recognised entity when the path is an entity view. */
  entity?: CatPageEntity;
}

/** Sub-route segments that are actions, not entity refs. */
const RESERVED_REFS = new Set(['new', 'create', 'edit', 'settings']);

interface Pattern {
  re: RegExp;
  type: string;
  label: string;
}

// Ordered most-specific first. `([^/]+)` captures the id/slug.
const ENTITY_PATTERNS: Pattern[] = [
  { re: /^\/projects\/([^/]+)/, type: 'project', label: 'a project' },
  { re: /^\/profiles\/([^/]+)/, type: 'profile', label: "a member's profile" },
  { re: /^\/(?:articles|blog)\/([^/]+)/, type: 'article', label: 'an article' },
  { re: /^\/groups\/([^/]+)/, type: 'group', label: 'a group' },
  { re: /^\/events\/([^/]+)/, type: 'event', label: 'an event' },
  { re: /^\/causes\/([^/]+)/, type: 'cause', label: 'a cause' },
  { re: /^\/assets\/([^/]+)/, type: 'asset', label: 'an asset' },
];

// Non-entity areas worth naming so Cat knows the surface the user is on.
const AREA_LABELS: Array<{ re: RegExp; label: string }> = [
  { re: /^\/dashboard\/store/, label: 'your store' },
  { re: /^\/dashboard\/wallet/, label: 'your wallet' },
  { re: /^\/dashboard(\/|$)/, label: 'your dashboard' },
  { re: /^\/discover/, label: 'the discover feed' },
  { re: /^\/timeline/, label: 'the timeline' },
  { re: /^\/search/, label: 'search' },
  { re: /^\/settings/, label: 'your settings' },
  { re: /^\/pricing/, label: 'the pricing page' },
];

/**
 * Describe the current page for Cat. Returns undefined for anything that isn't a
 * safe same-origin path (so callers can simply skip sending page context).
 */
export function describePageForCat(pathname: string | null | undefined): CatPageDescriptor | null {
  if (!pathname || !pathname.startsWith('/')) {
    return null;
  }
  const path = pathname.slice(0, 200);

  for (const p of ENTITY_PATTERNS) {
    const m = path.match(p.re);
    if (m) {
      const ref = decodeURIComponent(m[1]);
      const isEntity = !RESERVED_REFS.has(ref.toLowerCase());
      return {
        path,
        label: isEntity ? p.label : `creating ${p.label}`,
        entity: isEntity ? { type: p.type, ref } : undefined,
      };
    }
  }

  for (const a of AREA_LABELS) {
    if (a.re.test(path)) {
      return { path, label: a.label };
    }
  }

  return { path };
}
