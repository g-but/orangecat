/**
 * The Cat's account — created once, then re-asserted.
 *
 * The Cat is a real profile rather than a rendering convention, which is what
 * lets a Cat reply be an ordinary `messages` or `timeline_events` row: read
 * receipts, search, deletion, threading, moderation and realtime all work on it
 * without a single branch. The cost of that is exactly this file — something has
 * to create the row.
 *
 * Idempotent by design, and cheap when it is a no-op: one indexed lookup. It is
 * safe to call on every worker tick, and doing so makes the account
 * self-healing — if the profile is ever deleted, the Cat comes back rather than
 * every `@cat` on the platform quietly resolving to nobody.
 */

import { CAT_USERNAME, CAT_DISPLAY_NAME } from '@/config/cat-identity';
import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * The Cat's login address.
 *
 * `.invalid` is reserved by RFC 2606 and can never be delivered to or
 * registered by anyone, which matters more than it looks: an account's email is
 * its password-reset channel, so a bot identity with a routable address is a
 * bot identity somebody else can eventually take. This one has no password and
 * no reachable mailbox, so there is no credential to phish and no reset to
 * intercept.
 *
 * The local part is also load-bearing. `handle_new_user` derives the profile's
 * username from `split_part(email, '@', 1)`, so this address is what makes the
 * Cat's handle `cat` at creation time.
 */
const CAT_EMAIL = `${CAT_USERNAME}@orangecat.invalid`;

const CAT_BIO =
  'The OrangeCat agent. Tag @cat in a message or under a post and I will answer there.';

export interface CatAccount {
  id: string;
  username: string;
}

/**
 * @param admin a service-role client. Creating an auth user and writing another
 *   account's profile are both privileged, so this cannot run as the caller.
 * @returns the Cat's account, or null if it could not be established — callers
 *   must treat null as "do not attempt to speak as the Cat" rather than
 *   inventing a sender.
 */
export async function ensureCatAccount(
  admin: SupabaseClient
): Promise<CatAccount | null> {
  const existing = await findCatProfile(admin);
  if (existing) {
    return existing;
  }

  // No profile. Either the auth user does not exist either, or it does and its
  // profile row was removed; both are handled by creating and then re-reading.
  const { error: createError } = await admin.auth.admin.createUser({
    email: CAT_EMAIL,
    email_confirm: true,
    // No password is set, so the account cannot be signed into with one.
    user_metadata: { full_name: CAT_DISPLAY_NAME },
  });

  // "already registered" is the expected race and the expected second run: the
  // auth user survives even when the profile row does not.
  if (createError && !/already|exists|registered/i.test(createError.message)) {
    logger.error('Could not create the Cat auth user', { error: createError.message }, 'CatAccount');
    return null;
  }

  // handle_new_user inserts the profile from the email local part, so the
  // username is already `cat`. Re-assert the presentation fields so a partially
  // created account converges rather than staying half-built.
  const profile = await findCatProfile(admin);
  if (!profile) {
    logger.error('Cat auth user exists but no profile row followed', {}, 'CatAccount');
    return null;
  }

  const { error: updateError } = await admin
    .from(DATABASE_TABLES.PROFILES)
    .update({ name: CAT_DISPLAY_NAME, bio: CAT_BIO })
    .eq('id', profile.id);

  if (updateError) {
    // The account exists and is usable; only its presentation is stale.
    logger.warn('Cat profile created but could not be described', { error: updateError.message }, 'CatAccount');
  }

  logger.info('Cat account established', { id: profile.id }, 'CatAccount');
  return profile;
}

async function findCatProfile(admin: SupabaseClient): Promise<CatAccount | null> {
  const { data, error } = await admin
    .from(DATABASE_TABLES.PROFILES)
    .select('id, username')
    .eq('username', CAT_USERNAME)
    .maybeSingle();

  if (error) {
    logger.error('Could not look up the Cat profile', { error: error.message }, 'CatAccount');
    return null;
  }
  return data ? { id: data.id as string, username: data.username as string } : null;
}
