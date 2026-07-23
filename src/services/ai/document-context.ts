/**
 * Comprehensive Context Service for My Cat AI
 *
 * Orchestrates fetching all relevant context for personalized AI responses.
 * Sub-modules handle specific concerns:
 *   - document-context-types.ts — shared interfaces
 *   - entity-context-fetcher.ts — entity data (products, services, projects, …)
 *   - social-context-fetcher.ts — conversations, inbound activity, group memberships
 *   - context-string-builder.ts — format context as a prompt string
 */

import type { AnySupabaseClient } from '@/lib/supabase/types';
import { logger } from '@/utils/logger';
import { ENTITY_REGISTRY } from '@/config/entity-registry';
import { DATABASE_TABLES } from '@/config/database-tables';
import { isCatHubPath } from '@/config/routes';

import type {
  DocumentContext,
  ProfileContext,
  WalletSummary,
  TaskSummary,
  PaymentCapabilities,
  FullUserContext,
  RuntimeContext,
} from './document-context-types';
import { isSupportedCurrency, PLATFORM_DEFAULT_CURRENCY } from '@/config/currencies';
import { currencyConverter } from '@/services/currency/rates';

import { fetchEntitiesForCat } from './entity-context-fetcher';
import { getEconomicProfile } from '@/services/cat/economic-profile';
import {
  fetchConversationsForCat,
  fetchInboundActivityForCat,
  fetchGroupMembershipsForCat,
  fetchSocialGraphForCat,
} from './social-context-fetcher';
import { fetchProjectActivityForCat, fetchStakeholdersForCat } from './project-activity-fetcher';
import { fetchGitHubReposForCat } from './github-repos-fetcher';
import { fetchNotificationsForCat } from './notification-context-fetcher';

// Re-export types so existing callers stay unchanged
export type {
  DocumentContext,
  ProfileContext,
  EntitySummary,
  TaskSummary,
  WalletSummary,
  PaymentCapabilities,
  ConversationSummary,
  SaleRecord,
  GroupMembershipSummary,
  BookingRecord,
  InboundActivity,
  NotificationSummary,
  SocialGraphSummary,
  ProjectActivityEvent,
  StakeholderSummary,
  GitHubRepoSummary,
  FullUserContext,
  RuntimeContext,
} from './document-context-types';

// Re-export string builders so existing callers stay unchanged
export { buildFullContextString } from './context-string-builder';

// Re-export entity fetcher so callers can import directly if needed
export { fetchEntitiesForCat } from './entity-context-fetcher';

// Re-export social fetchers
export {
  fetchConversationsForCat,
  fetchInboundActivityForCat,
  fetchGroupMembershipsForCat,
  fetchSocialGraphForCat,
} from './social-context-fetcher';

// Re-export project-activity / stakeholder fetchers
export { fetchProjectActivityForCat, fetchStakeholdersForCat } from './project-activity-fetcher';

// Re-export GitHub repos fetcher
export { fetchGitHubReposForCat } from './github-repos-fetcher';

// Re-export notifications fetcher
export { fetchNotificationsForCat } from './notification-context-fetcher';

async function fetchDocumentsForCat(
  supabase: AnySupabaseClient,
  userId: string
): Promise<DocumentContext[]> {
  try {
    const { data: actor, error: actorError } = await supabase
      .from(DATABASE_TABLES.ACTORS)
      .select('id')
      .eq('actor_type', 'user')
      .eq('user_id', userId)
      .maybeSingle();

    if (actorError || !actor) {
      logger.warn('Could not find actor for user', { userId }, 'DocumentContext');
      return [];
    }

    const { data: documents, error: docsError } = await supabase
      .from(ENTITY_REGISTRY.document.tableName)
      .select('id, title, content, document_type, visibility')
      .eq('actor_id', actor.id)
      .in('visibility', ['cat_visible', 'public'])
      .order('document_type', { ascending: true });

    if (docsError) {
      logger.error('Failed to fetch documents for cat', docsError, 'DocumentContext');
      return [];
    }

    return (documents || []) as DocumentContext[];
  } catch (error) {
    logger.error('Exception fetching documents for cat', error, 'DocumentContext');
    return [];
  }
}

async function fetchProfileForCat(
  supabase: AnySupabaseClient,
  userId: string
): Promise<ProfileContext | null> {
  try {
    const { data: profile, error: profileError } = await supabase
      .from(DATABASE_TABLES.PROFILES)
      .select('username, name, bio, location_city, location_country, background, website')
      .eq('id', userId)
      .maybeSingle();

    if (profileError || !profile) {
      return null;
    }

    return {
      username: profile.username,
      name: profile.name,
      bio: profile.bio,
      location_city: profile.location_city,
      location_country: profile.location_country,
      background: profile.background,
      website: profile.website,
    };
  } catch (error) {
    logger.error('Exception fetching profile for cat', error, 'DocumentContext');
    return null;
  }
}

async function fetchWalletsForCat(
  supabase: AnySupabaseClient,
  userId: string
): Promise<WalletSummary[]> {
  try {
    const { data: profile } = await supabase
      .from(DATABASE_TABLES.PROFILES)
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) {
      return [];
    }

    const { data: wallets, error } = await supabase
      .from(DATABASE_TABLES.WALLETS)
      .select(
        'label, description, category, behavior_type, goal_amount, goal_currency, goal_deadline, budget_amount, budget_period, is_primary, balance_btc, balance_updated_at, nwc_connection_uri, lightning_address'
      )
      .eq('profile_id', profile.id)
      .eq('is_active', true)
      .limit(20);

    if (error) {
      logger.warn('Failed to fetch wallets for cat', { error: error.message }, 'DocumentContext');
      return [];
    }

    return (wallets || []).map(w => ({
      label: w.label,
      description: w.description,
      category: w.category,
      behavior_type: w.behavior_type,
      goal_amount: w.goal_amount,
      goal_currency: w.goal_currency,
      goal_deadline: w.goal_deadline,
      budget_amount: w.budget_amount,
      budget_period: w.budget_period,
      is_primary: w.is_primary,
      balance_btc: w.balance_btc ?? null,
      balance_updated_at: w.balance_updated_at ?? null,
      has_nwc: !!w.nwc_connection_uri,
      lightning_address: w.lightning_address ?? null,
    })) as WalletSummary[];
  } catch (error) {
    logger.error('Exception fetching wallets for cat', error, 'DocumentContext');
    return [];
  }
}

async function fetchTasksForCat(
  supabase: AnySupabaseClient,
  userId: string
): Promise<TaskSummary[]> {
  try {
    const { data: tasks, error } = await supabase
      .from(DATABASE_TABLES.TASKS)
      .select(
        'id, title, category, priority, current_status, task_type, schedule_human, due_date, is_reminder'
      )
      .eq('created_by', userId)
      .eq('is_archived', false)
      .eq('is_completed', false)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('priority', { ascending: false })
      .limit(30);

    if (error) {
      logger.warn('Failed to fetch tasks for cat', { error: error.message }, 'DocumentContext');
      return [];
    }

    return (tasks || []) as TaskSummary[];
  } catch (error) {
    logger.error('Exception fetching tasks for cat', error, 'DocumentContext');
    return [];
  }
}

/**
 * Client-provided hints about the user's current session.
 * Fully optional — when absent, we fall back to safe defaults (platform currency,
 * en-US locale, individual actor). Server never trusts these for security-critical
 * decisions; they only flavor how Cat phrases responses and which prices it quotes.
 */
export interface RuntimeContextHints {
  /** ISO currency code from client (e.g. 'CHF'). Validated server-side. */
  preferredCurrency?: string;
  /** BCP-47 locale (e.g. 'de-CH'). Free text but expected to look like a locale. */
  locale?: string;
  /** Same-origin path of the page user came from. Stripped if it looks unsafe. */
  lastVisitedPath?: string;
}

/**
 * Sanitize a path string. Accepts only absolute same-origin paths (starting with '/').
 * Caps length to 200 chars. Returns undefined for anything that doesn't look right —
 * we'd rather omit the field than feed Cat garbage.
 */
function sanitizeLastVisitedPath(path: string | undefined): string | undefined {
  if (!path || typeof path !== 'string') {
    return undefined;
  }
  if (!path.startsWith('/') || path.startsWith('//')) {
    return undefined;
  }
  if (path.length > 200) {
    return undefined;
  }
  // Avoid pushing the Cat page itself back into the prompt as "where you came from".
  if (isCatHubPath(path)) {
    return undefined;
  }
  return path;
}

async function fetchRuntimeContextForCat(
  supabase: AnySupabaseClient,
  userId: string,
  hints: RuntimeContextHints | undefined,
  profile: ProfileContext | null
): Promise<RuntimeContext> {
  // Currency: validate client hint against supported list; fall back to platform default.
  const candidateCurrency = hints?.preferredCurrency;
  const preferredCurrency =
    candidateCurrency && isSupportedCurrency(candidateCurrency)
      ? candidateCurrency
      : PLATFORM_DEFAULT_CURRENCY;

  // Locale: accept anything that looks like BCP-47 (letters and one optional '-region').
  // Default to 'en-US' — keeps existing date-format behavior when no hint provided.
  const candidateLocale = hints?.locale;
  const locale =
    candidateLocale && /^[a-z]{2,3}(-[a-zA-Z0-9]{2,4})?$/i.test(candidateLocale)
      ? candidateLocale
      : 'en-US';

  const lastVisitedPath = sanitizeLastVisitedPath(hints?.lastVisitedPath);

  // Current actor: for Tier 1 we always use the individual actor. Group-context
  // switching plumbs through later (Tier 5), with its own server-side validation
  // that the user is actually a member.
  let currentActor: RuntimeContext['currentActor'] = null;
  try {
    const { data: actorRow } = await supabase
      .from(DATABASE_TABLES.ACTORS)
      .select('id, actor_type')
      .eq('actor_type', 'user')
      .eq('user_id', userId)
      .maybeSingle();
    if (actorRow?.id) {
      currentActor = {
        id: actorRow.id,
        type: 'individual',
        name: profile?.name ?? profile?.username ?? null,
      };
    }
  } catch (error) {
    logger.warn('Could not resolve current actor for cat runtime', { error }, 'DocumentContext');
  }

  // Live BTC price so Cat quotes real conversions instead of recalling a stale
  // training-data rate. Non-fatal: on failure Cat just omits the rate line and
  // is instructed (in the system prompt) not to invent one.
  let btcRate: RuntimeContext['btcRate'] = null;
  try {
    const rates = await currencyConverter.getRates();
    const byCur: Record<string, number> = {
      CHF: rates.btcToChf,
      USD: rates.btcToUsd,
      EUR: rates.btcToEur,
    };
    const fiat = preferredCurrency === 'BTC' ? 'CHF' : preferredCurrency.toUpperCase();
    const rate = byCur[fiat];
    btcRate = rate ? { currency: fiat, rate } : { currency: 'CHF', rate: rates.btcToChf };
  } catch (error) {
    logger.warn('Could not fetch BTC rate for cat runtime', { error }, 'DocumentContext');
  }

  return {
    preferredCurrency,
    locale,
    currentActor,
    lastVisitedPath,
    btcRate,
  };
}

export async function fetchFullContextForCat(
  supabase: AnySupabaseClient,
  userId: string,
  runtimeHints?: RuntimeContextHints
): Promise<FullUserContext> {
  const [
    profile,
    documents,
    { entities, stats },
    tasks,
    wallets,
    conversations,
    notifications,
    inboundActivity,
    memberGroups,
    socialGraph,
    projectActivity,
    stakeholders,
    githubRepos,
    economicProfile,
  ] = await Promise.all([
    fetchProfileForCat(supabase, userId),
    fetchDocumentsForCat(supabase, userId),
    fetchEntitiesForCat(supabase, userId),
    fetchTasksForCat(supabase, userId),
    fetchWalletsForCat(supabase, userId),
    fetchConversationsForCat(supabase, userId),
    fetchNotificationsForCat(supabase, userId),
    fetchInboundActivityForCat(supabase, userId),
    fetchGroupMembershipsForCat(supabase, userId),
    fetchSocialGraphForCat(supabase, userId),
    fetchProjectActivityForCat(supabase, userId),
    fetchStakeholdersForCat(supabase, userId),
    fetchGitHubReposForCat(supabase, userId),
    getEconomicProfile(supabase, userId),
  ]);

  const runtime = await fetchRuntimeContextForCat(supabase, userId, runtimeHints, profile);

  const urgentTasks = tasks.filter(
    t => t.priority === 'urgent' || t.current_status === 'needs_attention'
  ).length;

  const paymentCapabilities: PaymentCapabilities = {
    hasNwcWallet: wallets.some(w => w.has_nwc),
    lightningAddress: wallets.find(w => w.lightning_address)?.lightning_address ?? null,
  };

  return {
    profile,
    economicProfile,
    documents,
    entities,
    tasks,
    wallets,
    conversations,
    notifications,
    inboundActivity,
    memberGroups,
    socialGraph,
    projectActivity,
    stakeholders,
    githubRepos,
    paymentCapabilities,
    runtime,
    stats: {
      ...stats,
      totalTasks: tasks.length,
      urgentTasks,
      totalWallets: wallets.length,
    },
  };
}
