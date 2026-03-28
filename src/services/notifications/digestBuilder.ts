/**
 * Weekly Digest Builder
 *
 * Aggregates a user's weekly activity into a structured digest object.
 * The digest is passed to the weekly-digest email template for rendering.
 *
 * Handles missing data gracefully — sections with no data are omitted,
 * not shown as zeros. If there's nothing meaningful to report,
 * hasContent is false and the digest should not be sent.
 *
 * Uses the admin client (server-side only, not user-initiated).
 *
 * Created: 2026-03-27
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { DATABASE_TABLES } from '@/config/database-tables';
import { ENTITY_REGISTRY, ENTITY_TYPES, type EntityType } from '@/config/entity-registry';
import { logger } from '@/utils/logger';

const LOG_SOURCE = 'DigestBuilder';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://orangecat.ch';

// =====================================================================
// TYPES
// =====================================================================

export interface WeeklyDigestData {
  userName: string;
  period: { start: string; end: string };

  /** Stats — skip section if zero / undefined */
  stats?: {
    totalViews?: number;
    viewsChange?: number;
    totalPaymentsReceived?: number;
    paymentAmountBtc?: number;
    newFollowers?: number;
    newMessages?: number;
  };

  /** Entity performance — top 3 by views */
  topEntities?: Array<{
    title: string;
    type: string;
    views: number;
    viewsChange: number;
  }>;

  /** Cat suggestions — max 3, context-aware */
  suggestions?: Array<{
    text: string;
    actionLabel: string;
    actionUrl: string;
  }>;

  /** Whether there's any meaningful content worth sending */
  hasContent: boolean;
}

// =====================================================================
// HELPERS
// =====================================================================

function weekRange(): { start: Date; end: Date; prevStart: Date } {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 7);
  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - 7);
  return { start, end, prevStart };
}

function _pctChange(current: number, previous: number): number | undefined {
  if (previous === 0 && current === 0) {
    return undefined;
  }
  if (previous === 0) {
    return 100;
  }
  return Math.round(((current - previous) / previous) * 100);
}

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

// =====================================================================
// QUERY FUNCTIONS
// =====================================================================

async function fetchUserProfile(
  admin: ReturnType<typeof createAdminClient>,
  userId: string
): Promise<{ name: string; bio: string | null } | null> {
  const { data } = await (admin.from(DATABASE_TABLES.PROFILES) as any)
    .select('display_name, username, bio')
    .eq('id', userId)
    .single();

  if (!data) {
    return null;
  }
  return {
    name: data.display_name || data.username || 'there',
    bio: data.bio ?? null,
  };
}

async function fetchActorId(
  admin: ReturnType<typeof createAdminClient>,
  userId: string
): Promise<string | null> {
  const { data } = await (admin.from(DATABASE_TABLES.ACTORS) as any)
    .select('id')
    .eq('user_id', userId)
    .eq('actor_type', 'user')
    .single();

  return data?.id ?? null;
}

async function fetchPaymentStats(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  since: Date,
  _prevSince: Date
): Promise<{
  totalPaymentsReceived?: number;
  paymentAmountBtc?: number;
} | null> {
  // Current week
  const { data: currentPayments } = await admin
    .from(DATABASE_TABLES.PAYMENT_INTENTS)
    .select('amount_sats')
    .eq('seller_id', userId)
    .eq('status', 'completed')
    .gte('created_at', since.toISOString());

  if (!currentPayments || currentPayments.length === 0) {
    return null;
  }

  const totalPaymentsReceived = currentPayments.length;
  const totalSats = currentPayments.reduce(
    (sum: number, p: { amount_sats: number }) => sum + (p.amount_sats || 0),
    0
  );
  const paymentAmountBtc = totalSats / 100_000_000;

  return { totalPaymentsReceived, paymentAmountBtc };
}

async function fetchNewFollowers(
  admin: ReturnType<typeof createAdminClient>,
  actorId: string,
  since: Date
): Promise<number | undefined> {
  const { count, error } = await admin
    .from(DATABASE_TABLES.USER_FOLLOWS)
    .select('*', { count: 'exact', head: true })
    .eq('following_id', actorId)
    .gte('created_at', since.toISOString());

  if (error || count === null || count === 0) {
    return undefined;
  }
  return count;
}

async function fetchNewMessages(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  since: Date
): Promise<number | undefined> {
  const { count, error } = await admin
    .from(DATABASE_TABLES.MESSAGES)
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .gte('created_at', since.toISOString());

  // Messages table may use different columns — if this fails, skip gracefully
  if (error || count === null || count === 0) {
    return undefined;
  }
  return count;
}

async function fetchUserEntities(
  admin: ReturnType<typeof createAdminClient>,
  actorId: string
): Promise<Array<{ title: string; type: string; status: string; id: string }>> {
  const entities: Array<{ title: string; type: string; status: string; id: string }> = [];

  // Query entity tables that use actor_id
  const entityTypesToCheck: EntityType[] = ENTITY_TYPES.filter(
    t => t !== 'wallet' && ENTITY_REGISTRY[t].userIdField === 'actor_id'
  ) as EntityType[];

  for (const entityType of entityTypesToCheck) {
    const meta = ENTITY_REGISTRY[entityType];
    const { data } = await (admin.from(meta.tableName) as any)
      .select('id, title, status')
      .eq('actor_id', actorId);

    if (data) {
      for (const row of data) {
        entities.push({
          id: row.id,
          title: row.title || 'Untitled',
          type: entityType,
          status: row.status || 'draft',
        });
      }
    }
  }

  return entities;
}

async function fetchWalletExists(
  admin: ReturnType<typeof createAdminClient>,
  userId: string
): Promise<boolean> {
  const { count } = await admin
    .from(DATABASE_TABLES.WALLETS)
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', userId);

  return (count ?? 0) > 0;
}

// =====================================================================
// SUGGESTION ENGINE
// =====================================================================

function generateSuggestions(context: {
  hasWallet: boolean;
  entities: Array<{ title: string; type: string; status: string }>;
  profileBio: string | null;
  hasPayments: boolean;
}): Array<{ text: string; actionLabel: string; actionUrl: string }> {
  const suggestions: Array<{ text: string; actionLabel: string; actionUrl: string }> = [];

  if (!context.hasWallet) {
    suggestions.push({
      text: 'Connect a Bitcoin wallet to start receiving payments on your listings.',
      actionLabel: 'Add wallet',
      actionUrl: `${APP_URL}/dashboard/wallets`,
    });
  }

  if (context.entities.length === 0) {
    suggestions.push({
      text: 'Create your first listing — a product, service, or project — to start reaching supporters.',
      actionLabel: 'Create listing',
      actionUrl: `${APP_URL}/dashboard`,
    });
  }

  const allDraft = context.entities.length > 0 && context.entities.every(e => e.status === 'draft');
  if (allDraft) {
    suggestions.push({
      text: 'You have draft listings waiting. Publish them so others can discover and support your work.',
      actionLabel: 'Go to dashboard',
      actionUrl: `${APP_URL}/dashboard`,
    });
  }

  if (context.entities.length > 0 && !context.hasPayments && context.hasWallet) {
    suggestions.push({
      text: 'Share your listings with your community to attract your first supporters.',
      actionLabel: 'View your listings',
      actionUrl: `${APP_URL}/dashboard`,
    });
  }

  if (!context.profileBio) {
    suggestions.push({
      text: 'Complete your profile with a bio to build trust with potential supporters.',
      actionLabel: 'Edit profile',
      actionUrl: `${APP_URL}/dashboard/info/edit`,
    });
  }

  // Max 3
  return suggestions.slice(0, 3);
}

// =====================================================================
// MAIN BUILDER
// =====================================================================

export async function buildWeeklyDigest(userId: string): Promise<WeeklyDigestData> {
  const admin = createAdminClient();
  const { start, end, prevStart } = weekRange();

  const period = { start: isoDate(start), end: isoDate(end) };

  // Fetch profile — required
  const profile = await fetchUserProfile(admin, userId);
  if (!profile) {
    logger.warn('User profile not found for digest', { userId }, LOG_SOURCE);
    return { userName: 'there', period, hasContent: false };
  }

  // Fetch actor ID for entity queries
  const actorId = await fetchActorId(admin, userId);

  // Run data fetches in parallel where possible
  const [paymentStats, newFollowers, newMessages, hasWallet] = await Promise.all([
    fetchPaymentStats(admin, userId, start, prevStart),
    actorId ? fetchNewFollowers(admin, actorId, start) : Promise.resolve(undefined),
    fetchNewMessages(admin, userId, start),
    fetchWalletExists(admin, userId),
  ]);

  // Fetch entities (needed for suggestions)
  const entities = actorId ? await fetchUserEntities(admin, actorId) : [];

  // Build stats — only include fields that have data
  const statsObj: WeeklyDigestData['stats'] = {};
  let hasStats = false;

  if (paymentStats) {
    if (paymentStats.totalPaymentsReceived) {
      statsObj.totalPaymentsReceived = paymentStats.totalPaymentsReceived;
      hasStats = true;
    }
    if (paymentStats.paymentAmountBtc) {
      statsObj.paymentAmountBtc = paymentStats.paymentAmountBtc;
      hasStats = true;
    }
  }
  if (newFollowers !== undefined) {
    statsObj.newFollowers = newFollowers;
    hasStats = true;
  }
  if (newMessages !== undefined) {
    statsObj.newMessages = newMessages;
    hasStats = true;
  }

  // Generate suggestions
  const suggestions = generateSuggestions({
    hasWallet,
    entities,
    profileBio: profile.bio,
    hasPayments: !!paymentStats,
  });

  // Determine if there's meaningful content
  const hasContent = hasStats || suggestions.length > 0;

  const digest: WeeklyDigestData = {
    userName: profile.name,
    period,
    hasContent,
  };

  if (hasStats) {
    digest.stats = statsObj;
  }

  if (suggestions.length > 0) {
    digest.suggestions = suggestions;
  }

  logger.debug('Weekly digest built', { userId, hasContent, hasStats }, LOG_SOURCE);

  return digest;
}
