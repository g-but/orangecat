/**
 * Notification Preferences Types
 *
 * Defines the shape of user notification preferences.
 * Category-level toggles control broad opt-in/out.
 * Per-type overrides are sparse — only explicit opt-outs are stored.
 *
 * Transactional notifications are always sent regardless of preferences.
 *
 * Created: 2026-03-27
 */

export type DigestFrequency = 'daily' | 'weekly' | 'never';

export interface NotificationPreferences {
  /** User who owns these preferences */
  user_id: string;

  // ---- Category-level toggles (default: true except where noted) ----

  /** Payments, contributions, order status */
  economic_emails: boolean;
  /** Follows, messages, mentions, comments */
  social_emails: boolean;
  /** Proposals, votes, members, treasury */
  group_emails: boolean;
  /** Milestones, onboarding drip, weekly digest */
  progress_emails: boolean;
  /** Dormant user outreach */
  reengagement_emails: boolean;

  // ---- Digest ----

  /** How often to receive digest emails (default: 'weekly') */
  digest_frequency: DigestFrequency;

  // ---- Per-type overrides ----

  /**
   * Sparse map of type -> boolean. Only stores explicit deviations
   * from the category default. For example, if social_emails is true
   * but the user opts out of 'comment' emails specifically:
   *   { comment: false }
   */
  type_overrides: Record<string, boolean>;

  // ---- Metadata ----

  updated_at: string;
}

/**
 * Default preferences for new users.
 * All categories enabled, weekly digest, no overrides.
 */
export function createDefaultPreferences(userId: string): NotificationPreferences {
  return {
    user_id: userId,
    economic_emails: true,
    social_emails: true,
    group_emails: true,
    progress_emails: true,
    reengagement_emails: true,
    digest_frequency: 'weekly',
    type_overrides: {},
    updated_at: new Date().toISOString(),
  };
}

/**
 * Fields that can be updated via the PUT endpoint.
 * Excludes user_id (immutable) and updated_at (set server-side).
 */
export type NotificationPreferencesUpdate = Partial<
  Omit<NotificationPreferences, 'user_id' | 'updated_at'>
>;
