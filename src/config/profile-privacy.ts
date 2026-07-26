/**
 * Profile field privacy — SSOT
 *
 * Which public profile fields an owner may hide from visitors, and the pure
 * helpers that read/apply that choice. The choice is persisted in the existing
 * `profiles.privacy_settings` jsonb column as `{ hidden_fields: string[] }`, so
 * this feature needs no database migration.
 *
 * Scope: only genuinely optional public-contact/presence fields are hideable.
 * Core identity (username, name, bio, avatar) is never hideable — hiding it
 * would make the profile pointless. Location has its own richer control
 * (actual / hidden / group) in `location-privacy.ts` and is intentionally not
 * duplicated here.
 */

import { z } from 'zod';

/** A public profile field the owner may hide. `key` is the actual profiles column. */
export const HIDEABLE_PROFILE_FIELDS = [
  { key: 'website', label: 'Website' },
  { key: 'social_links', label: 'Social media & links' },
  { key: 'contact_email', label: 'Contact email' },
  { key: 'phone', label: 'Phone number' },
] as const;

export type HideableProfileField = (typeof HIDEABLE_PROFILE_FIELDS)[number]['key'];

export const HIDEABLE_PROFILE_FIELD_KEYS: readonly HideableProfileField[] =
  HIDEABLE_PROFILE_FIELDS.map(f => f.key);

/**
 * Shape of the `privacy_settings` blob. Deliberately lenient: `hidden_fields`
 * is a plain string array (validated against known keys only when applied) and
 * unknown keys pass through, so a future/legacy blob can never reject a whole
 * profile save. This schema is spread into the canonical `profileSchema` so the
 * field survives the client zodResolver AND the server `profileSchema.parse`.
 */
export const profilePrivacySettingsSchema = z
  .object({ hidden_fields: z.array(z.string()).optional() })
  .passthrough()
  .optional()
  .nullable();

export type ProfilePrivacySettings = z.infer<typeof profilePrivacySettingsSchema>;

/** Read the hidden-field list from a raw privacy_settings value, keeping only known keys. */
export function getHiddenProfileFields(privacySettings: unknown): HideableProfileField[] {
  if (!privacySettings || typeof privacySettings !== 'object') {
    return [];
  }
  const raw = (privacySettings as { hidden_fields?: unknown }).hidden_fields;
  if (!Array.isArray(raw)) {
    return [];
  }
  const known = HIDEABLE_PROFILE_FIELD_KEYS as readonly string[];
  return raw.filter((k): k is HideableProfileField => typeof k === 'string' && known.includes(k));
}

/**
 * Merge a new hidden-field selection into an existing privacy_settings blob,
 * preserving any unrelated keys already stored there.
 */
export function buildPrivacySettings(
  existing: unknown,
  hiddenFields: HideableProfileField[]
): Record<string, unknown> {
  const base =
    existing && typeof existing === 'object' ? { ...(existing as Record<string, unknown>) } : {};
  return { ...base, hidden_fields: hiddenFields };
}

/**
 * Redact owner-hidden fields from a profile row before it is sent to a visitor.
 *
 * - Owner sees everything (their own editor and public view are unredacted).
 * - Visitors get each hidden field nulled — indistinguishable from "not set",
 *   so the presence of a hidden value never leaks — plus the hide-list itself
 *   (`privacy_settings`) stripped.
 *
 * Pure and allocation-light: returns the same object untouched for owners.
 */
export function applyProfilePrivacy<T extends object>(profile: T, opts: { isOwner: boolean }): T {
  if (opts.isOwner) {
    return profile;
  }
  // Cast to a record: profile is a DB row (ScalableProfile / plain object) whose
  // TS interface lacks an index signature, so we widen it to read/write by key.
  const record = profile as Record<string, unknown>;
  const clean: Record<string, unknown> = { ...record };
  for (const key of getHiddenProfileFields(record.privacy_settings)) {
    clean[key] = null;
  }
  // Never expose the hide-list to visitors.
  if ('privacy_settings' in clean) {
    clean.privacy_settings = null;
  }
  return clean as T;
}
