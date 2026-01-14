/**
 * USER STATS API
 *
 * Returns aggregated user statistics for the recommendations system.
 * Single endpoint to get all data needed for dynamic task generation.
 *
 * Created: 2026-01-07
 * Last Modified: 2026-01-07
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { apiSuccess, apiUnauthorized, handleApiError } from '@/lib/api/standardResponse';
import { ENTITY_REGISTRY, ENTITY_TYPES, type EntityType } from '@/config/entity-registry';
import {
  buildUserContext,
  getRecommendedTasks,
  getSmartQuestions,
  getCelebrationMessage,
  getTaskCompletionPercentage,
} from '@/services/recommendations';
import { DATABASE_TABLES } from '@/config/database-tables';

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
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
    }

    // Get profile
    const { data: profileData, error: profileError } = await (
      supabase.from(DATABASE_TABLES.PROFILES) as any
    )
      .select('*')
      .eq('id', user.id)
      .single();
    const profile = profileData as any;

    if (profileError || !profile) {
      return apiUnauthorized('Profile not found');
    }

    // Get actor ID for entity queries
    const { data: actorData } = await (supabase.from('actors') as any)
      .select('id')
      .eq('user_id', user.id)
      .eq('actor_type', 'user')
      .single();
    const actor = actorData as any;

    const actorId = actor?.id;

    // Fetch entity counts in parallel
    const entityCountPromises = ENTITY_TYPES.filter(type => type !== 'wallet') // Wallet handled separately
      .map(async entityType => {
        const meta = ENTITY_REGISTRY[entityType];
        const userIdField = meta.userIdField;

        try {
          // Build query based on user ID field type
          let query = (supabase.from(meta.tableName) as any).select('id', {
            count: 'exact',
            head: true,
          });

          // Different entities use different ID fields
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
            // Table might not exist, return 0
            return { entityType, count: 0 };
          }

          return { entityType, count: count || 0 };
        } catch {
          return { entityType, count: 0 };
        }
      });

    const entityCountResults = await Promise.all(entityCountPromises);
    const entityCounts: Partial<Record<EntityType, number>> = {};

    for (const { entityType, count } of entityCountResults) {
      entityCounts[entityType] = count;
    }

    // Check wallet status
    const { count: walletCount } = await (supabase.from('wallets') as any)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const hasWallet =
      (walletCount ?? 0) > 0 || !!profile.bitcoin_address || !!profile.lightning_address;

    // Get wishlist item count (separate from wishlist count)
    let wishlistItemCount = 0;
    if (actorId && (entityCounts.wishlist ?? 0) > 0) {
      const { data: wishlistsData } = await (supabase.from('wishlists') as any)
        .select('id')
        .eq('actor_id', actorId);
      const wishlists = wishlistsData as any[];

      if (wishlists && wishlists.length > 0) {
        const wishlistIds = wishlists.map(w => w.id);
        const { count: itemCount } = await (supabase.from('wishlist_items') as any)
          .select('id', { count: 'exact', head: true })
          .in('wishlist_id', wishlistIds);

        wishlistItemCount = itemCount || 0;
      }
    }

    // Check for recent activity (posts, entity creation in last 7 days)
    let daysSinceLastActivity: number | null = null;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Check most recent project update
    const { data: recentProjectData } = await (supabase.from('projects') as any)
      .select('updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
    const recentProject = recentProjectData as any;

    if (recentProject?.updated_at) {
      const lastUpdate = new Date(recentProject.updated_at);
      const now = new Date();
      daysSinceLastActivity = Math.floor(
        (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    // Check for published entities
    let hasPublishedEntities = false;
    const { count: publishedCount } = await (supabase.from('projects') as any)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'active');

    hasPublishedEntities = (publishedCount ?? 0) > 0;

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
}
