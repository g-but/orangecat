/**
 * Onboarding Drip Engine
 *
 * Determines which onboarding email a user should receive based on
 * their account age and completion state.
 *
 * Drip schedule:
 *   Day 0: Welcome (handled separately at registration)
 *   Day 1: Profile prompt (if not completed)
 *   Day 2: Wallet prompt (if not connected)
 *   Day 3: Entity prompt (if none created)
 *   Day 5: Inspiration (if still no entity — includes examples)
 *   Day 7: Summary (recap of progress)
 *
 * Once user has profile + wallet + published entity, onboarding is
 * considered complete and no more drip emails are sent.
 *
 * Created: 2026-03-27
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { DATABASE_TABLES } from '@/config/database-tables';
import { ENTITY_REGISTRY, ENTITY_TYPES, type EntityType } from '@/config/entity-registry';
import { ENTITY_STATUS } from '@/config/database-constants';
import { logger } from '@/utils/logger';

const LOG_SOURCE = 'OnboardingEngine';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://orangecat.ch';

// =====================================================================
// TYPES
// =====================================================================

export interface OnboardingState {
  accountAgeDays: number;
  hasProfile: boolean;
  hasWallet: boolean;
  hasEntity: boolean;
  hasPublishedEntity: boolean;
  onboardingComplete: boolean;
}

export interface OnboardingEmail {
  type: string;
  data: Record<string, unknown>;
}

// =====================================================================
// STATE DETECTION
// =====================================================================

export async function getOnboardingState(userId: string): Promise<OnboardingState> {
  const admin = createAdminClient();

  // Fetch user creation date from auth
  const { data: authUser } = await admin.auth.admin.getUserById(userId);
  const createdAt = authUser?.user?.created_at ? new Date(authUser.user.created_at) : new Date();

  const accountAgeDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

  // Check profile completeness (name + bio)
  const { data: profile } = await (admin.from(DATABASE_TABLES.PROFILES) as any)
    .select('display_name, bio')
    .eq('id', userId)
    .single();

  const hasProfile = !!(profile?.display_name && profile?.bio);

  // Check wallet
  const { count: walletCount } = await (admin.from(DATABASE_TABLES.WALLETS) as any)
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', userId);

  const hasWallet = (walletCount ?? 0) > 0;

  // Check entities via actor
  const { data: actor } = await (admin.from(DATABASE_TABLES.ACTORS) as any)
    .select('id')
    .eq('user_id', userId)
    .eq('actor_type', 'user')
    .single();

  let hasEntity = false;
  let hasPublishedEntity = false;

  if (actor?.id) {
    const entityTypes = ENTITY_TYPES.filter(
      t => t !== 'wallet' && ENTITY_REGISTRY[t].userIdField === 'actor_id'
    ) as EntityType[];

    for (const entityType of entityTypes) {
      if (hasPublishedEntity) {
        break;
      } // Already found what we need

      const meta = ENTITY_REGISTRY[entityType];
      const { data: entities } = await (admin.from(meta.tableName) as any)
        .select('status')
        .eq('actor_id', actor.id)
        .limit(5);

      if (entities && entities.length > 0) {
        hasEntity = true;
        if (entities.some((e: { status: string }) => e.status === ENTITY_STATUS.ACTIVE)) {
          hasPublishedEntity = true;
        }
      }
    }
  }

  const onboardingComplete = hasProfile && hasWallet && hasPublishedEntity;

  return {
    accountAgeDays,
    hasProfile,
    hasWallet,
    hasEntity,
    hasPublishedEntity,
    onboardingComplete,
  };
}

// =====================================================================
// EXAMPLE ENTITIES (for Day 5 inspiration email)
// =====================================================================

async function fetchExampleEntities(
  admin: ReturnType<typeof createAdminClient>
): Promise<Array<{ title: string; type: string; url: string }>> {
  const examples: Array<{ title: string; type: string; url: string }> = [];

  // Try to fetch a few active entities from different types for inspiration
  const typesToSample: EntityType[] = ['project', 'product', 'service'];

  for (const entityType of typesToSample) {
    if (examples.length >= 3) {
      break;
    }

    const meta = ENTITY_REGISTRY[entityType];
    const { data } = await (admin.from(meta.tableName) as any)
      .select('id, title')
      .eq('status', ENTITY_STATUS.ACTIVE)
      .limit(1);

    if (data && data.length > 0) {
      examples.push({
        title: data[0].title,
        type: meta.name,
        url: `${APP_URL}${meta.publicBasePath}/${data[0].id}`,
      });
    }
  }

  return examples;
}

// =====================================================================
// DRIP LOGIC
// =====================================================================

/**
 * Returns the next onboarding email to send, or null if none needed.
 *
 * This function is idempotent — it only looks at current state to decide.
 * The caller is responsible for tracking which emails have already been sent
 * (e.g., via a `notification_log` or checking existing notifications).
 */
export async function getNextOnboardingEmail(userId: string): Promise<OnboardingEmail | null> {
  try {
    const state = await getOnboardingState(userId);

    // Onboarding complete — no more drip emails
    if (state.onboardingComplete) {
      logger.debug('Onboarding complete, no email needed', { userId, state }, LOG_SOURCE);
      return null;
    }

    const { accountAgeDays } = state;

    // Day 1: Profile prompt (skip if profile already done)
    if (accountAgeDays >= 1 && !state.hasProfile) {
      return {
        type: 'onboarding_day1_profile',
        data: {
          editProfileUrl: `${APP_URL}/dashboard/info/edit`,
          accountAgeDays,
        },
      };
    }

    // Day 2: Wallet prompt (skip if wallet already connected)
    if (accountAgeDays >= 2 && !state.hasWallet) {
      return {
        type: 'onboarding_day2_wallet',
        data: {
          addWalletUrl: `${APP_URL}/dashboard/wallets`,
          accountAgeDays,
        },
      };
    }

    // Day 3: Entity creation prompt (skip if has entity)
    if (accountAgeDays >= 3 && !state.hasEntity) {
      return {
        type: 'onboarding_day3_entity',
        data: {
          dashboardUrl: `${APP_URL}/dashboard`,
          accountAgeDays,
        },
      };
    }

    // Day 5: Inspiration with examples (still no entity)
    if (accountAgeDays >= 5 && !state.hasEntity) {
      const admin = createAdminClient();
      const examples = await fetchExampleEntities(admin);
      return {
        type: 'onboarding_day5_inspiration',
        data: {
          examples,
          dashboardUrl: `${APP_URL}/dashboard`,
          discoverUrl: `${APP_URL}/discover`,
          accountAgeDays,
        },
      };
    }

    // Day 7: Summary of onboarding progress
    if (accountAgeDays >= 7) {
      return {
        type: 'onboarding_day7_summary',
        data: {
          hasProfile: state.hasProfile,
          hasWallet: state.hasWallet,
          hasEntity: state.hasEntity,
          hasPublishedEntity: state.hasPublishedEntity,
          dashboardUrl: `${APP_URL}/dashboard`,
          accountAgeDays,
        },
      };
    }

    // No email matches current state + age
    return null;
  } catch (err) {
    logger.error(
      'Failed to determine onboarding email',
      { userId, error: err instanceof Error ? err.message : err },
      LOG_SOURCE
    );
    return null;
  }
}
