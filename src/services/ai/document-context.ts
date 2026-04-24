/**
 * Comprehensive Context Service for My Cat AI
 *
 * Fetches all relevant context for personalized AI responses:
 * - User profile information
 * - User documents (with visibility 'cat_visible' or 'public')
 * - User's entities (products, services, projects, causes, events)
 * - Platform knowledge
 *
 * Created: 2026-01-21
 * Last Modified: 2026-01-21
 * Last Modified Summary: Expanded to include profile, entities, and full user context
 */

import type { AnySupabaseClient } from '@/lib/supabase/types';
import { logger } from '@/utils/logger';
import { ENTITY_REGISTRY } from '@/config/entity-registry';
import { DATABASE_TABLES } from '@/config/database-tables';

export interface DocumentContext {
  id: string;
  title: string;
  content: string;
  document_type: string;
  visibility: string;
}

export interface ProfileContext {
  username?: string;
  name?: string;
  bio?: string;
  location_city?: string;
  location_country?: string;
  background?: string;
  website?: string;
}

export interface EntitySummary {
  id: string;
  type: string;
  title: string;
  description?: string;
  status: string;
  price_btc?: number;
  category?: string;
  location?: string;
  /** BTC received/raised for this entity (projects, causes, research) */
  raised_btc?: number;
  /** Number of unique supporters/contributors */
  num_supporters?: number;
}

export interface TaskSummary {
  id: string;
  title: string;
  category: string;
  priority: string;
  current_status: string;
  task_type: string;
  schedule_human?: string | null;
  /** ISO timestamp — present on one-time tasks/reminders with a deadline */
  due_date?: string | null;
  /** True if this task was created by the Cat as a reminder (vs a team task) */
  is_reminder?: boolean;
}

export interface WalletSummary {
  label: string;
  description: string | null;
  category: string;
  behavior_type: string;
  goal_amount: number | null;
  goal_currency: string | null;
  goal_deadline: string | null;
  budget_amount: number | null;
  budget_period: string | null;
  is_primary: boolean;
  /** Whether this wallet has a Nostr Wallet Connect URI configured (can auto-send payments) */
  has_nwc: boolean;
  /** Lightning address for receiving payments, if configured */
  lightning_address: string | null;
}

export interface PaymentCapabilities {
  /** User has at least one wallet with NWC configured — required for send_payment / fund_project actions */
  hasNwcWallet: boolean;
  /** User's primary lightning address (for display / recipient lookup) */
  lightningAddress: string | null;
}

export interface ConversationSummary {
  /** Conversation UUID — use as conversation_id in reply_to_message exec_action */
  id: string;
  /** @username of the other person (null for group chats) */
  other_username: string | null;
  /** Display name of the other person */
  other_name: string | null;
  /** Last message preview (truncated) */
  last_message_preview: string | null;
  /** True if the user sent the last message; false if they received it */
  last_message_is_mine: boolean;
  /** ISO timestamp of last message */
  last_message_at: string | null;
  /** True if there is at least one message the user hasn't read yet */
  has_unread: boolean;
}

/** A completed or recent sale (order where the user is the seller) */
export interface SaleRecord {
  entity_title: string;
  entity_type: string;
  amount_btc: number;
  status: string;
  created_at: string;
}

/** A group the user is a member of (not necessarily the creator) */
export interface GroupMembershipSummary {
  id: string;
  name: string;
  description: string | null;
  label: string;
  role: 'founder' | 'admin' | 'member';
  visibility: 'public' | 'members_only' | 'private';
}

/** An upcoming booking where the user is the service/asset provider */
export interface BookingRecord {
  starts_at: string;
  ends_at: string | null;
  status: string;
  customer_display_name: string | null;
  customer_username: string | null;
}

export interface InboundActivity {
  recentSales: SaleRecord[];
  upcomingBookings: BookingRecord[];
}

export interface FullUserContext {
  profile: ProfileContext | null;
  documents: DocumentContext[];
  entities: EntitySummary[];
  tasks: TaskSummary[];
  wallets: WalletSummary[];
  conversations: ConversationSummary[];
  inboundActivity: InboundActivity;
  memberGroups: GroupMembershipSummary[];
  paymentCapabilities: PaymentCapabilities;
  stats: {
    totalProducts: number;
    totalServices: number;
    totalProjects: number;
    totalCauses: number;
    totalEvents: number;
    totalAssets: number;
    totalLoans: number;
    totalInvestments: number;
    totalResearch: number;
    totalWishlists: number;
    totalTasks: number;
    urgentTasks: number;
    totalWallets: number;
  };
}

/**
 * Document type display names for context
 */
const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  goals: 'Goals & Aspirations',
  skills: 'Skills & Expertise',
  finances: 'Financial Information',
  business_plan: 'Business Plans',
  background: 'Background & History',
  preferences: 'Preferences & Values',
  plans: 'Plans & Projects',
  notes: 'Notes & Ideas',
  other: 'Other Context',
};

/**
 * Fetch documents visible to My Cat for a user
 */
export async function fetchDocumentsForCat(
  supabase: AnySupabaseClient,
  userId: string
): Promise<DocumentContext[]> {
  try {
    // First get the user's actor
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

    // Fetch documents visible to My Cat
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

/**
 * Build a context string from documents for inclusion in AI prompts
 */
export function buildDocumentContextString(documents: DocumentContext[]): string {
  if (documents.length === 0) {
    return '';
  }

  const sections: string[] = [];

  // Group documents by type
  const byType = documents.reduce(
    (acc, doc) => {
      const type = doc.document_type || 'other';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(doc);
      return acc;
    },
    {} as Record<string, DocumentContext[]>
  );

  // Build context sections
  for (const [type, docs] of Object.entries(byType)) {
    const label = DOCUMENT_TYPE_LABELS[type] || type;
    const docContents = docs
      .map(doc => {
        // Truncate long content to save tokens
        const content =
          doc.content.length > 1500 ? doc.content.substring(0, 1500) + '...' : doc.content;
        return `**${doc.title}**:\n${content}`;
      })
      .join('\n\n');

    sections.push(`### ${label}\n${docContents}`);
  }

  return `## Personal Context (from user's My Context documents)

The user has shared the following context to help you provide personalized advice:

${sections.join('\n\n')}

---
Use this context to personalize your responses. Reference their goals, skills, and situation when relevant. If they ask about something related to their context, use this information.`;
}

/**
 * Fetch user's profile information
 */
export async function fetchProfileForCat(
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

/**
 * Fetch user's entities (products, services, projects, causes, events)
 */
export async function fetchEntitiesForCat(
  supabase: AnySupabaseClient,
  userId: string
): Promise<{ entities: EntitySummary[]; stats: FullUserContext['stats'] }> {
  const stats = {
    totalProducts: 0,
    totalServices: 0,
    totalProjects: 0,
    totalCauses: 0,
    totalEvents: 0,
    totalAssets: 0,
    totalLoans: 0,
    totalInvestments: 0,
    totalResearch: 0,
    totalWishlists: 0,
    totalTasks: 0,
    urgentTasks: 0,
    totalWallets: 0,
  };
  const entities: EntitySummary[] = [];

  try {
    // Get the user's actor
    const { data: actor, error: actorError } = await supabase
      .from(DATABASE_TABLES.ACTORS)
      .select('id')
      .eq('actor_type', 'user')
      .eq('user_id', userId)
      .maybeSingle();

    if (actorError || !actor) {
      logger.warn(
        'Could not find actor for user when fetching entities',
        { userId },
        'DocumentContext'
      );
      return { entities, stats };
    }

    const actorId = actor.id;

    // Fetch products (include draft so user can ask about their drafts)
    const { data: products, error: productsError } = await supabase
      .from(ENTITY_REGISTRY.product.tableName)
      .select('id, title, description, status, price, currency, category')
      .eq('actor_id', actorId)
      .in('status', ['active', 'draft', 'paused'])
      .limit(20);

    if (productsError) {
      logger.warn(
        'Failed to fetch products for cat',
        { error: productsError.message },
        'DocumentContext'
      );
    } else if (products) {
      stats.totalProducts = products.length;
      products.forEach(p => {
        entities.push({
          id: p.id,
          type: 'product',
          title: p.title,
          description: p.description?.substring(0, 300),
          status: p.status,
          price_btc: p.price,
        });
      });
    }

    // Fetch services (include draft)
    const { data: services, error: servicesError } = await supabase
      .from(ENTITY_REGISTRY.service.tableName)
      .select('id, title, description, status, hourly_rate, fixed_price, currency, category')
      .eq('actor_id', actorId)
      .in('status', ['active', 'draft', 'paused'])
      .limit(20);

    if (servicesError) {
      logger.warn(
        'Failed to fetch services for cat',
        { error: servicesError.message },
        'DocumentContext'
      );
    } else if (services) {
      stats.totalServices = services.length;
      services.forEach(s => {
        entities.push({
          id: s.id,
          type: 'service',
          title: s.title,
          description: s.description?.substring(0, 300),
          status: s.status,
          price_btc: s.fixed_price || s.hourly_rate,
        });
      });
    }

    // Fetch projects
    const { data: projects, error: projectsError } = await supabase
      .from(ENTITY_REGISTRY.project.tableName)
      .select('id, title, description, status, goal_amount, currency, category')
      .eq('actor_id', actorId)
      .in('status', ['active', 'draft', 'paused'])
      .limit(20);

    if (projectsError) {
      logger.warn(
        'Failed to fetch projects for cat',
        { error: projectsError.message },
        'DocumentContext'
      );
    } else if (projects) {
      stats.totalProjects = projects.length;
      projects.forEach(p => {
        entities.push({
          id: p.id,
          type: 'project',
          title: p.title,
          description: p.description?.substring(0, 300),
          status: p.status,
          price_btc: p.goal_amount,
        });
      });
    }

    // Fetch causes
    const { data: causes, error: causesError } = await supabase
      .from(ENTITY_REGISTRY.cause.tableName)
      .select('id, title, description, status, cause_category, goal_amount')
      .eq('actor_id', actorId)
      .in('status', ['active', 'draft', 'paused'])
      .limit(20);

    if (causesError) {
      logger.warn(
        'Failed to fetch causes for cat',
        { error: causesError.message },
        'DocumentContext'
      );
    } else if (causes) {
      stats.totalCauses = causes.length;
      causes.forEach(c => {
        entities.push({
          id: c.id,
          type: 'cause',
          title: c.title,
          description: c.description?.substring(0, 300),
          status: c.status,
          category: c.cause_category,
          price_btc: c.goal_amount,
        });
      });
    }

    // Fetch events
    const { data: events, error: eventsError } = await supabase
      .from(ENTITY_REGISTRY.event.tableName)
      .select(
        'id, title, description, status, start_date, end_date, venue_name, venue_city, venue_country'
      )
      .eq('actor_id', actorId)
      .in('status', ['active', 'draft', 'paused'])
      .limit(20);

    if (eventsError) {
      logger.warn(
        'Failed to fetch events for cat',
        { error: eventsError.message },
        'DocumentContext'
      );
    } else if (events) {
      stats.totalEvents = events.length;
      events.forEach(e => {
        entities.push({
          id: e.id,
          type: 'event',
          title: e.title,
          description: e.description?.substring(0, 300),
          status: e.status,
          location: [e.venue_name, e.venue_city, e.venue_country].filter(Boolean).join(', '),
        });
      });
    }

    // Fetch assets
    const { data: assets, error: assetsError } = await supabase
      .from(ENTITY_REGISTRY.asset.tableName)
      .select('id, title, description, status, type, location, estimated_value')
      .eq('actor_id', actorId)
      .in('status', ['active', 'draft', 'paused'])
      .limit(20);

    if (assetsError) {
      logger.warn(
        'Failed to fetch assets for cat',
        { error: assetsError.message },
        'DocumentContext'
      );
    } else if (assets) {
      stats.totalAssets = assets.length;
      assets.forEach(a => {
        entities.push({
          id: a.id,
          type: 'asset',
          title: a.title,
          description: a.description?.substring(0, 300),
          status: a.status,
          price_btc: a.estimated_value,
          location: a.location,
        });
      });
    }

    // Fetch loans (peer-to-peer lending)
    // Column is original_amount (not amount); loans also have actor_id via migration
    const { data: loans, error: loansError } = await supabase
      .from(ENTITY_REGISTRY.loan.tableName)
      .select('id, title, description, status, original_amount, currency, interest_rate')
      .eq('actor_id', actorId)
      .in('status', ['active', 'draft', 'paused', 'pending'])
      .limit(20);

    if (loansError) {
      logger.warn('Failed to fetch loans for cat', { error: loansError.message }, 'DocumentContext');
    } else if (loans) {
      stats.totalLoans = loans.length;
      loans.forEach(l => {
        entities.push({
          id: l.id,
          type: 'loan',
          title: l.title,
          description: l.description?.substring(0, 300),
          status: l.status,
          price_btc: l.original_amount,
          category: l.interest_rate !== null ? `${l.interest_rate}% interest` : undefined,
        });
      });
    }

    // Fetch investments (equity/revenue-share opportunities)
    const { data: investments, error: investmentsError } = await supabase
      .from(ENTITY_REGISTRY.investment.tableName)
      .select('id, title, description, status, investment_type, target_amount, currency')
      .eq('actor_id', actorId)
      .in('status', ['draft', 'open', 'active', 'funded'])
      .limit(20);

    if (investmentsError) {
      logger.warn('Failed to fetch investments for cat', { error: investmentsError.message }, 'DocumentContext');
    } else if (investments) {
      stats.totalInvestments = investments.length;
      investments.forEach(i => {
        entities.push({
          id: i.id,
          type: 'investment',
          title: i.title,
          description: i.description?.substring(0, 300),
          status: i.status,
          price_btc: i.target_amount,
          category: i.investment_type,
        });
      });
    }

    // Fetch research entities (DeSci funding)
    // research_entities uses user_id (references profiles), NOT actor_id
    const { data: research, error: researchError } = await supabase
      .from(ENTITY_REGISTRY.research.tableName)
      .select('id, title, description, status, field, funding_goal_btc, funding_raised_btc')
      .eq('user_id', userId)
      .in('status', ['active', 'draft', 'paused'])
      .limit(20);

    if (researchError) {
      logger.warn('Failed to fetch research for cat', { error: researchError.message }, 'DocumentContext');
    } else if (research) {
      stats.totalResearch = research.length;
      research.forEach(r => {
        entities.push({
          id: r.id,
          type: 'research',
          title: r.title,
          description: r.description?.substring(0, 300),
          status: r.status,
          price_btc: r.funding_goal_btc,
          category: r.field,
          // funding_raised_btc is maintained as a running total on the research entity itself
          raised_btc: r.funding_raised_btc > 0 ? r.funding_raised_btc : undefined,
        });
      });
    }

    // Fetch wishlists
    // wishlists have no status column — they use is_active (boolean) + visibility
    const { data: wishlists, error: wishlistsError } = await supabase
      .from(ENTITY_REGISTRY.wishlist.tableName)
      .select('id, title, description, type, visibility, is_active')
      .eq('actor_id', actorId)
      .eq('is_active', true)
      .limit(20);

    if (wishlistsError) {
      logger.warn('Failed to fetch wishlists for cat', { error: wishlistsError.message }, 'DocumentContext');
    } else if (wishlists) {
      stats.totalWishlists = wishlists.length;
      wishlists.forEach(w => {
        entities.push({
          id: w.id,
          type: 'wishlist',
          title: w.title,
          description: w.description?.substring(0, 300),
          status: w.visibility, // wishlists surface visibility (public/unlisted/private) as their "status"
          category: w.type,    // wishlist type (birthday, wedding, general, etc.)
        });
      });
    }

    // Enrich projects with funding stats from project_support_stats view.
    // Done after all entity fetches so we have the project IDs.
    const projectIds = entities.filter(e => e.type === 'project').map(e => e.id);
    if (projectIds.length > 0) {
      const { data: supportStats } = await supabase
        .from(DATABASE_TABLES.PROJECT_SUPPORT_STATS)
        .select('project_id, total_bitcoin_btc, total_supporters')
        .in('project_id', projectIds);

      if (supportStats && supportStats.length > 0) {
        const statsMap = new Map(
          supportStats.map((s: { project_id: string; total_bitcoin_btc: number; total_supporters: number }) => [
            s.project_id,
            { raised: s.total_bitcoin_btc, supporters: s.total_supporters },
          ])
        );
        entities.forEach(e => {
          if (e.type === 'project') {
            const s = statsMap.get(e.id);
            if (s && s.raised > 0) {
              e.raised_btc = s.raised;
              e.num_supporters = s.supporters;
            }
          }
        });
      }
    }

    logger.info(
      'Fetched entities for cat',
      {
        userId,
        actorId,
        stats,
        totalEntities: entities.length,
      },
      'DocumentContext'
    );

    return { entities, stats };
  } catch (error) {
    logger.error('Exception fetching entities for cat', error, 'DocumentContext');
    return { entities, stats };
  }
}

/**
 * Fetch user's wallets for My Cat context
 */
export async function fetchWalletsForCat(
  supabase: AnySupabaseClient,
  userId: string
): Promise<WalletSummary[]> {
  try {
    // Wallets use profile_id, which maps from auth user via profiles table
    const { data: profile } = await supabase
      .from(DATABASE_TABLES.PROFILES)
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!profile) {
      return [];
    }

    const { data: wallets, error } = await supabase
      .from(DATABASE_TABLES.WALLETS)
      .select(
        'label, description, category, behavior_type, goal_amount, goal_currency, goal_deadline, budget_amount, budget_period, is_primary, nwc_connection_uri, lightning_address'
      )
      .eq('profile_id', profile.id)
      .eq('is_active', true)
      .limit(20);

    if (error) {
      logger.warn('Failed to fetch wallets for cat', { error: error.message }, 'DocumentContext');
      return [];
    }

    // Map DB rows to WalletSummary — expose capability flags without leaking encrypted URI
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
      has_nwc: !!w.nwc_connection_uri,
      lightning_address: w.lightning_address ?? null,
    })) as WalletSummary[];
  } catch (error) {
    logger.error('Exception fetching wallets for cat', error, 'DocumentContext');
    return [];
  }
}

/**
 * Fetch user's active tasks for My Cat context.
 * Returns non-archived tasks ordered by priority (urgent first).
 */
export async function fetchTasksForCat(
  supabase: AnySupabaseClient,
  userId: string
): Promise<TaskSummary[]> {
  try {
    const { data: tasks, error } = await supabase
      .from(DATABASE_TABLES.TASKS)
      .select('id, title, category, priority, current_status, task_type, schedule_human, due_date, is_reminder')
      .eq('created_by', userId)
      .eq('is_archived', false)
      .eq('is_completed', false)
      // Upcoming deadlines first (nulls last), then by priority within undated tasks
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
 * Fetch recent direct conversations for My Cat context.
 * Returns last 8 conversations with message previews so Cat can assist with replies.
 */
export async function fetchConversationsForCat(
  supabase: AnySupabaseClient,
  userId: string
): Promise<ConversationSummary[]> {
  try {
    // 1. Get conversation IDs + last_read_at where user is an active participant
    const { data: participations, error: partError } = await supabase
      .from(DATABASE_TABLES.CONVERSATION_PARTICIPANTS)
      .select('conversation_id, last_read_at')
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(50);

    if (partError || !participations || participations.length === 0) {
      return [];
    }

    // Build map: conversation_id → last_read_at (for unread detection)
    const myLastReadByConv: Record<string, string | null> = {};
    (participations as { conversation_id: string; last_read_at: string | null }[]).forEach(p => {
      myLastReadByConv[p.conversation_id] = p.last_read_at;
    });

    const convIds = participations.map((p: { conversation_id: string }) => p.conversation_id);

    // 2. Get conversations ordered by most recent message, limited to 8
    const { data: conversations, error: convError } = await supabase
      .from(DATABASE_TABLES.CONVERSATIONS)
      .select('id, last_message_preview, last_message_sender_id, last_message_at, is_group')
      .in('id', convIds)
      .not('last_message_at', 'is', null)
      .order('last_message_at', { ascending: false })
      .limit(8);

    if (convError || !conversations || conversations.length === 0) {
      return [];
    }

    const recentIds = conversations.map((c: { id: string }) => c.id);

    // 3. Get other participants for these conversations
    const { data: otherParts, error: otherError } = await supabase
      .from(DATABASE_TABLES.CONVERSATION_PARTICIPANTS)
      .select('conversation_id, user_id')
      .in('conversation_id', recentIds)
      .neq('user_id', userId)
      .eq('is_active', true);

    if (otherError) {
      logger.warn('Failed to fetch conversation participants for cat', { error: otherError.message }, 'DocumentContext');
    }

    // 4. Fetch profiles for the other participants
    const otherUserIds = [...new Set((otherParts || []).map((p: { user_id: string }) => p.user_id))];
    const profileMap: Record<string, { username: string | null; name: string | null }> = {};

    if (otherUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from(DATABASE_TABLES.PROFILES)
        .select('id, username, name')
        .in('id', otherUserIds);

      (profiles || []).forEach((p: { id: string; username: string | null; name: string | null }) => {
        profileMap[p.id] = { username: p.username, name: p.name };
      });
    }

    // 5. Build a map: conversation_id → other user_id
    const otherUserByConv: Record<string, string> = {};
    (otherParts || []).forEach((p: { conversation_id: string; user_id: string }) => {
      if (!otherUserByConv[p.conversation_id]) {
        otherUserByConv[p.conversation_id] = p.user_id;
      }
    });

    // 6. Assemble summaries
    return conversations.map((c: {
      id: string;
      last_message_preview: string | null;
      last_message_sender_id: string | null;
      last_message_at: string | null;
      is_group: boolean;
    }) => {
      const otherUserId = otherUserByConv[c.id] ?? null;
      const profile = otherUserId ? profileMap[otherUserId] : null;
      const isMine = c.last_message_sender_id === userId;
      // Unread: last message was NOT sent by me, and either I've never read this
      // conversation or the last message arrived after my last_read_at timestamp.
      const lastReadAt = myLastReadByConv[c.id] ?? null;
      const hasUnread = !isMine && c.last_message_at !== null && (
        lastReadAt === null || new Date(c.last_message_at) > new Date(lastReadAt)
      );
      return {
        id: c.id,
        other_username: profile?.username ?? null,
        other_name: profile?.name ?? null,
        last_message_preview: c.last_message_preview,
        last_message_is_mine: isMine,
        last_message_at: c.last_message_at,
        has_unread: hasUnread,
      };
    });
  } catch (error) {
    logger.error('Exception fetching conversations for cat', error, 'DocumentContext');
    return [];
  }
}

/**
 * Fetch inbound economic activity for My Cat:
 * - Recent sales (orders where the user is the seller, status='paid')
 * - Upcoming bookings where the user is the provider
 */
export async function fetchInboundActivityForCat(
  supabase: AnySupabaseClient,
  userId: string
): Promise<InboundActivity> {
  try {
    // Resolve user's actor IDs (needed for booking provider lookup)
    const { data: actorRows } = await supabase
      .from(DATABASE_TABLES.ACTORS)
      .select('id')
      .eq('user_id', userId);
    const actorIds = (actorRows ?? []).map((a: { id: string }) => a.id);

    const now = new Date().toISOString();

    // Run sales and bookings queries in parallel
    const [salesResult, bookingsResult] = await Promise.all([
      // Recent paid sales (user as seller)
      supabase
        .from(DATABASE_TABLES.ORDERS)
        .select('entity_title, entity_type, amount_btc, status, created_at')
        .eq('seller_id', userId)
        .eq('status', 'paid')
        .order('created_at', { ascending: false })
        .limit(10),

      // Upcoming bookings as provider (confirmed or pending, starting in the future)
      actorIds.length > 0
        ? supabase
            .from(DATABASE_TABLES.BOOKINGS)
            .select(`
              starts_at,
              ends_at,
              status,
              customer:customer_actor_id(
                display_name,
                username
              )
            `)
            .in('provider_actor_id', actorIds)
            .in('status', ['confirmed', 'pending'])
            .gte('starts_at', now)
            .order('starts_at', { ascending: true })
            .limit(5)
        : Promise.resolve({ data: [], error: null }),
    ]);

    const recentSales: SaleRecord[] = (salesResult.data ?? []).map((o: {
      entity_title: string;
      entity_type: string;
      amount_btc: number;
      status: string;
      created_at: string;
    }) => ({
      entity_title: o.entity_title,
      entity_type: o.entity_type,
      amount_btc: o.amount_btc,
      status: o.status,
      created_at: o.created_at,
    }));

    const upcomingBookings: BookingRecord[] = (bookingsResult.data ?? []).map((b: {
      starts_at: string;
      ends_at: string | null;
      status: string;
      // Supabase returns one-to-one FK joins as arrays; take first element
      customer: { display_name: string | null; username: string | null }[] | null;
    }) => {
      const customer = Array.isArray(b.customer) ? b.customer[0] : b.customer;
      return {
        starts_at: b.starts_at,
        ends_at: b.ends_at,
        status: b.status,
        customer_display_name: customer?.display_name ?? null,
        customer_username: customer?.username ?? null,
      };
    });

    if (salesResult.error) {
      logger.warn('Failed to fetch sales for cat', { error: salesResult.error.message }, 'DocumentContext');
    }
    if (bookingsResult.error) {
      logger.warn('Failed to fetch bookings for cat', { error: bookingsResult.error.message }, 'DocumentContext');
    }

    return { recentSales, upcomingBookings };
  } catch (error) {
    logger.error('Exception fetching inbound activity for cat', error, 'DocumentContext');
    return { recentSales: [], upcomingBookings: [] };
  }
}

/**
 * Fetch groups the user is a member of (not just groups they created).
 * This lets Cat answer "what groups am I in?" accurately.
 */
export async function fetchGroupMembershipsForCat(
  supabase: AnySupabaseClient,
  userId: string
): Promise<GroupMembershipSummary[]> {
  try {
    // Get membership rows for this user
    const { data: memberships, error: memberError } = await supabase
      .from(DATABASE_TABLES.GROUP_MEMBERS)
      .select('group_id, role')
      .eq('user_id', userId)
      .limit(30);

    if (memberError || !memberships || memberships.length === 0) {
      if (memberError) {
        logger.warn('Failed to fetch group memberships for cat', { error: memberError.message }, 'DocumentContext');
      }
      return [];
    }

    const groupIds = memberships.map((m: { group_id: string }) => m.group_id);

    // Fetch the group details in one query
    const { data: groups, error: groupsError } = await supabase
      .from(DATABASE_TABLES.GROUPS)
      .select('id, name, description, label, visibility')
      .in('id', groupIds);

    if (groupsError || !groups) {
      logger.warn('Failed to fetch groups for cat membership', { error: groupsError?.message }, 'DocumentContext');
      return [];
    }

    // Build role map: group_id → role
    const roleMap = new Map(
      (memberships as { group_id: string; role: 'founder' | 'admin' | 'member' }[]).map(m => [m.group_id, m.role])
    );

    return (groups as { id: string; name: string; description: string | null; label: string; visibility: 'public' | 'members_only' | 'private' }[]).map(g => ({
      id: g.id,
      name: g.name,
      description: g.description,
      label: g.label,
      role: roleMap.get(g.id) ?? 'member',
      visibility: g.visibility,
    }));
  } catch (error) {
    logger.error('Exception fetching group memberships for cat', error, 'DocumentContext');
    return [];
  }
}

/**
 * Fetch all context for My Cat
 */
export async function fetchFullContextForCat(
  supabase: AnySupabaseClient,
  userId: string
): Promise<FullUserContext> {
  const [profile, documents, { entities, stats }, tasks, wallets, conversations, inboundActivity, memberGroups] = await Promise.all([
    fetchProfileForCat(supabase, userId),
    fetchDocumentsForCat(supabase, userId),
    fetchEntitiesForCat(supabase, userId),
    fetchTasksForCat(supabase, userId),
    fetchWalletsForCat(supabase, userId),
    fetchConversationsForCat(supabase, userId),
    fetchInboundActivityForCat(supabase, userId),
    fetchGroupMembershipsForCat(supabase, userId),
  ]);

  const urgentTasks = tasks.filter(
    t => t.priority === 'urgent' || t.current_status === 'needs_attention'
  ).length;

  // Derive payment capabilities from wallet data
  const paymentCapabilities: PaymentCapabilities = {
    hasNwcWallet: wallets.some(w => w.has_nwc),
    lightningAddress: wallets.find(w => w.lightning_address)?.lightning_address ?? null,
  };

  return {
    profile,
    documents,
    entities,
    tasks,
    wallets,
    conversations,
    inboundActivity,
    memberGroups,
    paymentCapabilities,
    stats: {
      ...stats,
      totalTasks: tasks.length,
      urgentTasks,
      totalWallets: wallets.length,
    },
  };
}

/**
 * Build comprehensive context string for My Cat
 */
export function buildFullContextString(context: FullUserContext): string {
  const sections: string[] = [];

  // Current date/time — injected first so Cat can reason temporally about reminders,
  // deadlines, overdue tasks, and upcoming events
  {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
    const timeStr = now.toISOString().slice(11, 16);
    sections.push(`## Current Date & Time\nToday is ${dateStr}, ${timeStr} UTC.`);
  }

  // Profile section
  if (context.profile) {
    const p = context.profile;
    const profileParts: string[] = [];

    if (p.name) {
      profileParts.push(`**Name**: ${p.name}`);
    }
    if (p.username) {
      profileParts.push(`**Username**: @${p.username}`);
    }
    if (p.bio) {
      profileParts.push(`**Bio**: ${p.bio}`);
    }
    if (p.location_city || p.location_country) {
      profileParts.push(
        `**Location**: ${[p.location_city, p.location_country].filter(Boolean).join(', ')}`
      );
    }
    if (p.background) {
      profileParts.push(`**Background**: ${p.background}`);
    }
    if (p.website) {
      profileParts.push(`**Website**: ${p.website}`);
    }

    if (profileParts.length > 0) {
      sections.push(`## User Profile\n${profileParts.join('\n')}`);
    }
  }

  // Documents section
  if (context.documents.length > 0) {
    const docContextString = buildDocumentContextString(context.documents);
    if (docContextString) {
      sections.push(docContextString);
    }
  }

  // Entities section
  if (context.entities.length > 0) {
    const entityGroups: Record<string, EntitySummary[]> = {};
    context.entities.forEach(e => {
      if (!entityGroups[e.type]) {
        entityGroups[e.type] = [];
      }
      entityGroups[e.type].push(e);
    });

    const entityParts: string[] = [];

    const typeLabels: Record<string, string> = {
      product: 'Products',
      service: 'Services',
      project: 'Projects',
      cause: 'Causes',
      event: 'Events',
      asset: 'Assets',
      loan: 'Loans',
      investment: 'Investments',
      research: 'Research',
      wishlist: 'Wishlists',
    };

    for (const [type, items] of Object.entries(entityGroups)) {
      const label = typeLabels[type] || type;
      const itemList = items
        .map(item => {
          const parts = [`- **${item.title}**`];
          if (item.status !== 'active') {
            parts.push(` [${item.status}]`);
          }
          if (item.price_btc) {
            parts.push(` (${item.price_btc} BTC)`);
          }
          if (item.category) {
            parts.push(` [${item.category}]`);
          }
          if (item.location) {
            parts.push(` @ ${item.location}`);
          }
          // Show funding received where known (projects, research, causes)
          if (item.raised_btc !== undefined && item.raised_btc > 0) {
            const supporterNote = item.num_supporters
              ? ` from ${item.num_supporters} supporter${item.num_supporters !== 1 ? 's' : ''}`
              : '';
            parts.push(` — raised ${item.raised_btc} BTC${supporterNote}`);
          }
          if (item.description) {
            parts.push(`: ${item.description}`);
          }
          parts.push(` (id: ${item.id})`);
          return parts.join('');
        })
        .join('\n');
      entityParts.push(`### ${label}\n${itemList}`);
    }

    if (entityParts.length > 0) {
      sections.push(
        `## User's OrangeCat Entities\n\nThe user has created the following on OrangeCat:\n\n${entityParts.join('\n\n')}`
      );
    }
  }

  // Group memberships section — groups the user belongs to (not just groups they created)
  if (context.memberGroups.length > 0) {
    const groupLines = context.memberGroups.map(g => {
      const parts = [`- **${g.name}**`];
      if (g.label) {
        parts.push(` [${g.label}]`);
      }
      parts.push(` — role: ${g.role}`);
      if (g.visibility !== 'public') {
        parts.push(` (${g.visibility})`);
      }
      if (g.description) {
        parts.push(`: ${g.description.substring(0, 200)}`);
      }
      // Include group ID so Cat can reference it in invite_to_organization exec_action
      parts.push(` (id: ${g.id})`);
      return parts.join('');
    });
    sections.push(`## Group Memberships\nThe user is a member of the following groups:\n${groupLines.join('\n')}`);
  }

  // Tasks section
  if (context.tasks.length > 0) {
    const now = new Date();
    const urgent = context.tasks.filter(
      t => t.priority === 'urgent' || t.current_status === 'needs_attention'
    );
    const overdueReminders = context.tasks.filter(
      t => t.is_reminder && t.due_date && new Date(t.due_date) < now
    );
    const taskLines = context.tasks.map(t => {
      const parts = [`- **${t.title}**`];
      // Label: reminder vs team task
      if (t.is_reminder) {
        parts.push(' [reminder]');
      } else {
        parts.push(` [${t.category}]`);
      }
      if (t.priority !== 'normal') { parts.push(` priority:${t.priority}`); }
      if (t.current_status !== 'idle') { parts.push(` status:${t.current_status}`); }
      // Due date / schedule
      if (t.due_date) {
        const due = new Date(t.due_date);
        const isOverdue = due < now;
        const dueStr = due.toLocaleString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
          hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false,
        }) + ' UTC';
        parts.push(isOverdue ? ` ⚠️ OVERDUE (was due ${dueStr})` : ` — due ${dueStr}`);
      } else if (t.task_type !== 'one_time' && t.schedule_human) {
        parts.push(` — ${t.schedule_human}`);
      }
      // Always include task ID so Cat can reference it in complete_task exec_action
      parts.push(` [task_id: ${t.id}]`);
      return parts.join('');
    });
    const alerts: string[] = [];
    if (urgent.length > 0) {
      alerts.push(`⚠️ ${urgent.length} task${urgent.length > 1 ? 's' : ''} need${urgent.length === 1 ? 's' : ''} attention.`);
    }
    if (overdueReminders.length > 0) {
      alerts.push(`🔔 ${overdueReminders.length} reminder${overdueReminders.length > 1 ? 's are' : ' is'} overdue.`);
    }
    const alertNote = alerts.length > 0 ? `\n${alerts.join(' ')}` : '';
    sections.push(`## Active Tasks & Reminders${alertNote}\n${taskLines.join('\n')}`);
  }

  // Wallets section
  if (context.wallets.length > 0) {
    const walletLines = context.wallets.map(w => {
      const parts = [`- **${w.label}**`];
      parts.push(`(${w.category}`);
      if (w.behavior_type === 'one_time_goal' && w.goal_amount) {
        parts.push(`, goal: ${w.goal_amount} ${w.goal_currency || 'BTC'}`);
        if (w.goal_deadline) {
          parts.push(` by ${w.goal_deadline}`);
        }
      }
      if (w.behavior_type === 'recurring_budget' && w.budget_amount) {
        parts.push(`, budget: ${w.budget_amount} BTC/${w.budget_period || 'month'}`);
      }
      parts.push(')');
      if (w.behavior_type !== 'general') {
        parts.push(` - ${w.behavior_type}`);
      }
      if (w.is_primary) {
        parts.push(' - primary wallet');
      }
      return parts.join('');
    });

    sections.push(`## User's Wallets\n${walletLines.join('\n')}`);
  }

  // Conversations section — gives Cat visibility into recent messages so it can help reply
  if (context.conversations.length > 0) {
    const unreadCount = context.conversations.filter(c => c.has_unread).length;
    const convLines = context.conversations.map(c => {
      const who = c.other_username ? `@${c.other_username}` : '(group chat)';
      const direction = c.last_message_is_mine ? 'you sent' : 'received';
      const preview = c.last_message_preview
        ? `: "${c.last_message_preview.substring(0, 80)}${c.last_message_preview.length > 80 ? '…' : ''}"`
        : '';
      const unreadBadge = c.has_unread ? ' 🔴 UNREAD' : '';
      return `- ${who}${unreadBadge}${preview} (${direction}) [conv id: ${c.id}]`;
    });
    const unreadNote = unreadCount > 0
      ? `\n📬 ${unreadCount} unread conversation${unreadCount > 1 ? 's' : ''} — proactively mention this to the user.`
      : '';
    sections.push(
      `## Recent Conversations${unreadNote}\nUse the conversation id with reply_to_message to reply on the user's behalf.\n${convLines.join('\n')}`
    );
  }

  // Inbound activity section — sales received and upcoming bookings as provider
  {
    const { recentSales, upcomingBookings } = context.inboundActivity;
    const parts: string[] = [];

    if (recentSales.length > 0) {
      const saleLines = recentSales.map(s => {
        const date = new Date(s.created_at).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
        });
        return `- **${s.entity_title}** (${s.entity_type}) — ${s.amount_btc} BTC — ${date}`;
      });
      parts.push(`### Recent Sales (paid)\n${saleLines.join('\n')}`);
    }

    if (upcomingBookings.length > 0) {
      const bookingLines = upcomingBookings.map(b => {
        const start = new Date(b.starts_at).toLocaleString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
          hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false,
        });
        const who = b.customer_display_name ?? (b.customer_username ? `@${b.customer_username}` : 'unknown customer');
        return `- ${start} UTC with ${who} [${b.status}]`;
      });
      parts.push(`### Upcoming Bookings (as provider)\n${bookingLines.join('\n')}`);
    }

    if (parts.length > 0) {
      sections.push(`## Inbound Economic Activity\n${parts.join('\n\n')}`);
    }
  }

  // Payment capabilities section — always include so Cat knows what actions are available
  {
    const { hasNwcWallet, lightningAddress } = context.paymentCapabilities;
    const capLines: string[] = [];
    if (hasNwcWallet) {
      capLines.push('⚡ **NWC wallet connected** — can use send_payment and fund_project exec_action blocks to send Bitcoin automatically');
    } else {
      capLines.push('❌ **No NWC wallet** — cannot auto-send payments; if user asks to send Bitcoin, tell them to connect a Nostr Wallet Connect wallet first (Settings → Wallets)');
    }
    if (lightningAddress) {
      capLines.push(`📬 **Lightning address**: ${lightningAddress} (others can pay the user here)`);
    } else {
      capLines.push('📬 **No lightning address configured** — user cannot receive lightning payments without one');
    }
    sections.push(`## Payment Capabilities\n${capLines.join('\n')}`);
  }

  // Stats summary
  const { stats } = context;
  const hasAnyEntities =
    stats.totalProducts +
      stats.totalServices +
      stats.totalProjects +
      stats.totalCauses +
      stats.totalEvents +
      stats.totalAssets +
      stats.totalLoans +
      stats.totalResearch +
      stats.totalWishlists >
    0;

  if (hasAnyEntities) {
    const statParts: string[] = [];
    if (stats.totalProducts > 0) {
      statParts.push(`${stats.totalProducts} product${stats.totalProducts > 1 ? 's' : ''}`);
    }
    if (stats.totalServices > 0) {
      statParts.push(`${stats.totalServices} service${stats.totalServices > 1 ? 's' : ''}`);
    }
    if (stats.totalProjects > 0) {
      statParts.push(`${stats.totalProjects} project${stats.totalProjects > 1 ? 's' : ''}`);
    }
    if (stats.totalCauses > 0) {
      statParts.push(`${stats.totalCauses} cause${stats.totalCauses > 1 ? 's' : ''}`);
    }
    if (stats.totalEvents > 0) {
      statParts.push(`${stats.totalEvents} event${stats.totalEvents > 1 ? 's' : ''}`);
    }
    if (stats.totalAssets > 0) {
      statParts.push(`${stats.totalAssets} asset${stats.totalAssets > 1 ? 's' : ''}`);
    }
    if (stats.totalLoans > 0) {
      statParts.push(`${stats.totalLoans} loan${stats.totalLoans > 1 ? 's' : ''}`);
    }
    if (stats.totalResearch > 0) {
      statParts.push(`${stats.totalResearch} research ${stats.totalResearch > 1 ? 'entities' : 'entity'}`);
    }
    if (stats.totalWishlists > 0) {
      statParts.push(`${stats.totalWishlists} wishlist${stats.totalWishlists > 1 ? 's' : ''}`);
    }
    if (stats.totalTasks > 0) {
      const taskStat = `${stats.totalTasks} active task${stats.totalTasks > 1 ? 's' : ''}`;
      statParts.push(stats.urgentTasks > 0 ? `${taskStat} (${stats.urgentTasks} urgent)` : taskStat);
    }
    if (stats.totalWallets > 0) {
      statParts.push(`${stats.totalWallets} wallet${stats.totalWallets > 1 ? 's' : ''}`);
    }

    sections.push(`## Activity Summary\nThe user has: ${statParts.join(', ')}.`);
  }

  if (sections.length === 0) {
    return '';
  }

  return `# User Context for Personalized Advice

${sections.join('\n\n')}

---
**Instructions for using this context**:
- Reference the user's profile, goals, skills, and entities when relevant
- If they ask about their products/services/projects, you have the details above
- Tailor your advice to their situation, background, and stated goals
- Help them leverage what they already have on OrangeCat
- Suggest ways to improve or expand their OrangeCat presence`;
}
