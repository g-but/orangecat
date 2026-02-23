/**
 * USER STATS API
 *
 * Returns aggregated user statistics for the recommendations system.
 * Single endpoint to get all data needed for dynamic task generation.
 *
 * Created: 2026-01-07
 * Last Modified: 2026-01-28
 * Last Modified Summary: Refactored to use withAuth middleware
 */

import { apiSuccess, apiUnauthorized, handleApiError } from '@/lib/api/standardResponse';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import {
  ENTITY_REGISTRY,
  ENTITY_TYPES,
  getTableName,
  type EntityType,
} from '@/config/entity-registry';
import {
  buildUserContext,
  getRecommendedTasks,
  getSmartQuestions,
  getCelebrationMessage,
  getTaskCompletionPercentage,
} from '@/services/recommendations';
import { DATABASE_TABLES } from '@/config/database-tables';

// Local types for database query results (not in generated types)
interface ProfileRecord {
  id: string;
  username: string | null;
  name: string | null;
  bio: string | null;
  avatar_url: string | null;
  bitcoin_address: string | null;
  lightning_address: string | null;
  website: string | null;
  location: string | null;
  preferred_currency: string | null;
}

interface ActorRecord {
  id: string;
}

interface ProjectRecord {
  updated_at: string;
}

// Type-safe wrapper for untyped tables
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedTable = any;

/**
 * GET /api/users/me/stats
 *
 * Returns comprehensive user statistics for recommendations:
 * - Profile completion percentage
 * - Entity counts by type
 * - Wallet status
 * - Activity metrics
 * - Recommended tasks
 * - Smart questions (if profile complete)
 */
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { user, supabase } = request;

    // Step 1: Fetch profile and actor in parallel (both only need user.id)
    const [profileResult, actorResult] = await Promise.all([
      (supabase.from(DATABASE_TABLES.PROFILES) as UntypedTable)
        .select('*')
        .eq('id', user.id)
        .single(),
      (supabase.from(DATABASE_TABLES.ACTORS) as UntypedTable)
        .select('id')
        .eq('user_id', user.id)
        .eq('actor_type', 'user')
        .single(),
    ]);

    const profile = profileResult.data as ProfileRecord | null;
    if (profileResult.error || !profile) {
      return apiUnauthorized('Profile not found');
    }

    const actorId = (actorResult.data as ActorRecord | null)?.id;

    // Step 2: Run ALL remaining queries in parallel
    const entityCountPromises = ENTITY_TYPES.filter(type => type !== 'wallet').map(
      async entityType => {
        const meta = ENTITY_REGISTRY[entityType];
        const userIdField = meta.userIdField;

        try {
          let query = (supabase.from(meta.tableName) as UntypedTable).select('id', {
            count: 'exact',
            head: true,
          });

          if (userIdField === 'actor_id' && actorId) {
            query = query.eq('actor_id', actorId);
          } else if (userIdField === 'user_id') {
            query = query.eq('user_id', user.id);
          } else if (userIdField === 'owner_id') {
            query = query.eq('owner_id', user.id);
          } else if (userIdField === 'organizer_id') {
            query = query.eq('organizer_id', user.id);
          }

          const { count, error } = await query;
          if (error) {
            return { entityType, count: 0 };
          }
          return { entityType, count: count || 0 };
        } catch {
          return { entityType, count: 0 };
        }
      }
    );

    const walletCountPromise = (supabase.from('wallets') as UntypedTable)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Fetch wishlist items via join instead of two sequential queries
    const wishlistItemsPromise = actorId
      ? (supabase.from(DATABASE_TABLES.WISHLIST_ITEMS) as UntypedTable)
          .select('id, wishlists!inner(actor_id)', { count: 'exact', head: true })
          .eq('wishlists.actor_id', actorId)
      : Promise.resolve({ count: 0 });

    const recentProjectPromise = (supabase.from(getTableName('project')) as UntypedTable)
      .select('updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    const publishedCountPromise = (supabase.from(getTableName('project')) as UntypedTable)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'active');

    const [
      entityCountResults,
      walletResult,
      wishlistItemsResult,
      recentProjectResult,
      publishedResult,
    ] = await Promise.all([
      Promise.all(entityCountPromises),
      walletCountPromise,
      wishlistItemsPromise,
      recentProjectPromise,
      publishedCountPromise,
    ]);

    // Process entity counts
    const entityCounts: Partial<Record<EntityType, number>> = {};
    for (const { entityType, count } of entityCountResults) {
      entityCounts[entityType] = count;
    }

    // Process wallet status
    const hasWallet =
      (walletResult.count ?? 0) > 0 || !!profile.bitcoin_address || !!profile.lightning_address;

    // Process wishlist items
    const wishlistItemCount = wishlistItemsResult.count || 0;

    // Process recent activity
    let daysSinceLastActivity: number | null = null;
    const recentProject = recentProjectResult.data as ProjectRecord | null;
    if (recentProject?.updated_at) {
      const lastUpdate = new Date(recentProject.updated_at);
      const now = new Date();
      daysSinceLastActivity = Math.floor(
        (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    // Process published entities
    const hasPublishedEntities = (publishedResult.count ?? 0) > 0;

    // Build user context for recommendations
    const userContext = buildUserContext(
      {
        id: profile.id,
        username: profile.username,
        display_name: profile.name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        bitcoin_address: profile.bitcoin_address,
        lightning_address: profile.lightning_address,
        website: profile.website,
        location: profile.location,
        preferred_currency: profile.preferred_currency,
      },
      {
        entityCounts,
        hasWallet,
        daysSinceLastActivity,
        hasPublishedEntities,
        wishlistItemCount,
      }
    );

    // Get recommendations
    const recommendedTasks = getRecommendedTasks(userContext, { limit: 6 });
    const smartQuestions = getSmartQuestions(userContext, 3);
    const celebration = getCelebrationMessage(userContext);
    const taskCompletion = getTaskCompletionPercentage(userContext);

    return apiSuccess(
      {
        // Profile stats
        profileCompletion: userContext.profileCompletion,

        // Entity counts
        entityCounts,

        // Activity metrics
        hasWallet,
        hasPublishedEntities,
        daysSinceLastActivity,
        wishlistItemCount,

        // Task completion
        taskCompletion,

        // Recommendations (tasks, questions, celebration)
        recommendations: {
          tasks: recommendedTasks,
          questions: smartQuestions,
          celebration,
        },
      },
      {
        cache: 'SHORT', // 1 minute cache
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
});
