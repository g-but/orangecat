/**
 * Public profile contract for the v1 API — SSOT.
 *
 * Everything that crosses the OrangeCat↔FleetCrown seam is keyed by
 * `actor_id`: `stakeholder_relationships.to_actor_id`, entity ownership,
 * payment intents, timeline events. Until now a client holding one of those
 * UUIDs had no way to turn it into a person or a team, so the typed customer
 * graph rendered as a column of UUIDs. This is the shape that fixes that.
 *
 * No `.openapi()` metadata here on purpose: that chain method only exists
 * after `@/lib/openapi/registry` has run `extendZodWithOpenApi`, and the route
 * handlers import this file without importing the registry. Descriptions live
 * in registerV1Routes.ts, which does. Same split as `config/stakeholders.ts`.
 *
 * WHY AN ALLOWLIST, WHEN publicProfile.server.ts USES A DENYLIST
 * That file serves the app's own profile page, where a denylist is right: the
 * page should show every public display column, including ones added after it
 * was written, and `src/types/database.ts` drifts from the live schema anyway.
 * A versioned contract has the opposite requirement. Under a denylist, adding
 * a column to `profiles` silently publishes it on a v1 endpoint that may never
 * take a field away again. So this list is explicit, and a new public field is
 * a deliberate (non-breaking) addition here.
 *
 * WHAT IS DELIBERATELY NOT HERE
 * - `email` / `contact_email` / `phone` — contact details behind a batch
 *   machine-readable resolver is a harvesting surface the rendered profile
 *   page is not. Email already flows, with consent, through the OIDC `email`
 *   scope (`/oauth/userinfo`), which is where it belongs.
 * - `bitcoin_address` / `lightning_address` — payment data has its own scope
 *   (`wallet.read`); an unauthenticated resolver is the wrong door for it.
 * - `location` — location has a richer three-state control of its own
 *   (`location-privacy.ts`). Publishing it here would bypass that.
 *
 * All four are additive later if a client genuinely needs them behind a scope.
 */

import { z } from 'zod';

/** A public identity is either a person or a team — the two `actors.actor_type`s. */
export const PUBLIC_PROFILE_KINDS = ['user', 'group'] as const;
export type PublicProfileKind = (typeof PUBLIC_PROFILE_KINDS)[number];

/**
 * Most identities a client can resolve in one request. A stakeholder graph or a
 * page of timeline events references tens of actors, not thousands — and a
 * resolver with no ceiling is a bulk-export endpoint wearing a different hat.
 */
export const PUBLIC_PROFILE_MAX_BATCH = 100;

export const publicProfileSchema = z.object({
  /** The join key — what stakeholder edges, entities, payments and timeline events reference. */
  actor_id: z.string().uuid(),
  /** Person (`user`) or team (`group`). */
  kind: z.enum(PUBLIC_PROFILE_KINDS),
  /** Profile id for a user, group id for a group. Prefer `actor_id` for joins. */
  id: z.string().uuid(),
  /** Username (user) or slug (group) — the value to pass back as `?handles=`. */
  handle: z.string().nullable(),
  display_name: z.string().nullable(),
  /** Profile bio for a user, group description for a group. */
  bio: z.string().nullable(),
  avatar_url: z.string().nullable(),
  banner_url: z.string().nullable(),
  /** Users only. Null when the owner has hidden it — indistinguishable from unset. */
  website: z.string().nullable(),
  /** Users only. Null when the owner has hidden it. */
  social_links: z.record(z.string(), z.unknown()).nullable(),
  /** Absolute canonical URL — a relative path would resolve against the caller's own origin. */
  url: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export type PublicProfile = z.infer<typeof publicProfileSchema>;

/**
 * Split a comma-separated query parameter into a bounded, deduped list.
 *
 * Returns `null` when the caller asked for more than the batch ceiling, so the
 * route answers 422 rather than silently resolving the first hundred — a
 * truncated resolve is indistinguishable from "those actors do not exist".
 */
export function parseBatchParam(raw: string | null): string[] | null {
  if (!raw) {
    return [];
  }
  const values = Array.from(
    new Set(
      raw
        .split(',')
        .map(v => v.trim())
        .filter(Boolean)
    )
  );
  return values.length > PUBLIC_PROFILE_MAX_BATCH ? null : values;
}
