/**
 * What a claim carries.
 *
 * ADR-0004 D1: one primitive, extended — not a second mechanism. A claim used
 * to hold a person and nothing else, so there was nowhere to put the bar that
 * Karl is opening. It now holds a person AND the things that person will own,
 * in the discriminated shape ADR-0003 specified for cold prospecting. A friend
 * setting up a friend and the studio pitching a stranger differ in
 * *provenance*, not in structure.
 *
 * BACKWARD COMPATIBILITY IS NOT OPTIONAL HERE. The claims dashboard became
 * reachable on 2026-09-07 (it had no navigation entry before that, which is
 * why the table had zero rows). Any claim created between then and this
 * deploy carries the old flat person shape:
 *
 *   { name, bio?, avatarUrl?, ... }        ← legacy
 *   { kind: 'person', profile: {...} }     ← current
 *
 * `normalizeClaimDraft` accepts either and always returns the current shape,
 * so a link somebody has already sent to a real person keeps working.
 */

import { z } from 'zod';
import { GROUP_LABELS } from '@/config/group-labels';

const socialLinkSchema = z.object({
  platform: z.string(),
  label: z.string().optional(),
  value: z.string(),
});

export const claimPersonSchema = z.object({
  name: z.string().trim().min(1).max(100),
  bio: z.string().max(1000).optional(),
  avatarUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
  website: z.string().optional(),
  socialLinks: z.array(socialLinkSchema).optional(),
});

const groupLabels = Object.keys(GROUP_LABELS) as [string, ...string[]];

/**
 * A "bar" is structurally a `groups` row with `label='company'`, so the group
 * entity covers every organisation shape the platform has.
 */
export const claimGroupEntitySchema = z.object({
  kind: z.literal('group'),
  name: z.string().trim().min(1).max(100),
  label: z.enum(groupLabels).default('circle'),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string()).max(10).optional(),
});

export const claimProjectEntitySchema = z.object({
  kind: z.literal('project'),
  title: z.string().trim().min(1).max(100),
  description: z.string().max(1000).optional(),
  goalAmount: z.number().positive().optional(),
  currency: z.string().optional(),
});

export const claimEntitySchema = z.discriminatedUnion('kind', [
  claimGroupEntitySchema,
  claimProjectEntitySchema,
]);

/**
 * How many things one claim may create.
 *
 * A cap exists because materialisation runs on the recipient's behalf the
 * moment they accept: an uncapped list would let one link mint arbitrarily
 * many fundable rows owned by someone who clicked once.
 */
export const MAX_CLAIM_ENTITIES = 5;

export const claimDraftSchema = z.object({
  kind: z.literal('person'),
  profile: claimPersonSchema,
  entities: z.array(claimEntitySchema).max(MAX_CLAIM_ENTITIES).optional(),
});

export type ClaimEntityDraft = z.infer<typeof claimEntitySchema>;
export type ClaimDraft = z.infer<typeof claimDraftSchema>;

/**
 * Accept either draft shape, always return the current one.
 *
 * Returns `null` only when the value is not a usable draft at all — a caller
 * that gets null should treat the claim as broken rather than render an empty
 * person.
 */
export function normalizeClaimDraft(raw: unknown): ClaimDraft | null {
  const current = claimDraftSchema.safeParse(raw);
  if (current.success) {
    return current.data;
  }

  // Legacy flat person shape: lift it into `profile` and keep going.
  const legacy = claimPersonSchema.safeParse(raw);
  if (legacy.success) {
    return { kind: 'person', profile: legacy.data };
  }

  return null;
}

/** A short human label for an entity, for previews and confirmations. */
export function describeClaimEntity(entity: ClaimEntityDraft): string {
  return entity.kind === 'group' ? entity.name : entity.title;
}
