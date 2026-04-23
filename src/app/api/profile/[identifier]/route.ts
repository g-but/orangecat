import { createClient } from '@supabase/supabase-js';
import { withOptionalAuth } from '@/lib/api/withAuth';
import { apiSuccess, apiNotFound, handleApiError } from '@/lib/api/standardResponse';
import { getTableName } from '@/config/entity-registry';
import { DATABASE_TABLES } from '@/config/database-tables';
import { getOrCreateUserActor } from '@/services/actors/getOrCreateUserActor';

/**
 * GET /api/profile/[identifier] - Get profile by username or email
 *
 * Supports both username and email lookups for viewing other users' profiles
 */

interface RouteContext {
  params: Promise<{ identifier: string }>;
}

export const GET = withOptionalAuth(async (request, context: RouteContext) => {
  try {
    const { identifier } = await context.params;

    if (!identifier?.trim()) {
      return apiNotFound('Profile identifier is required');
    }

    const { supabase } = request;
    const trimmedIdentifier = identifier.trim();
    const isEmail = trimmedIdentifier.includes('@');

    let profile = null;
    let error = null;
    let userId: string | null = null;

    if (isEmail) {
      // Try to find profile by email field first (if it exists in profiles table)
      const { data: profileByEmail, error: emailError } = await (supabase
        .from(DATABASE_TABLES.PROFILES))
        .select('*')
        .eq('email', trimmedIdentifier)
        .single();

      if (!emailError && profileByEmail) {
        profile = profileByEmail;
        userId = profileByEmail.id;
      } else {
        // If email field doesn't exist in profiles, try to find user by email in auth.users
        // Use service role client if available for admin access
        const serviceRoleKey =
          process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

        if (serviceRoleKey && supabaseUrl) {
          try {
            const adminClient = createClient(supabaseUrl, serviceRoleKey, {
              auth: {
                autoRefreshToken: false,
                persistSession: false,
              },
            });

            // List users and find by email (compatible across versions)
            const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers();
            if (!listError && usersData?.users) {
              const user = usersData.users.find(
                u => u.email?.toLowerCase() === trimmedIdentifier.toLowerCase()
              );
              if (user?.id) {
                userId = user.id;
              } else {
                return apiNotFound('Profile not found');
              }
            } else {
              return apiNotFound('Profile not found');
            }

            // Now fetch the profile by user ID
            if (userId) {
              const { data: profileById, error: profileError } = await (supabase
                .from(DATABASE_TABLES.PROFILES))
                .select('*')
                .eq('id', userId)
                .single();

              if (!profileError && profileById) {
                profile = profileById;
              } else {
                error = profileError;
              }
            } else {
              return apiNotFound('Profile not found');
            }
          } catch {
            // Fallback: return error suggesting username lookup
            return apiNotFound('Profile not found. Please use username instead of email.');
          }
        } else {
          // No service role key available, can't lookup by email
          return apiNotFound('Profile not found. Please use username instead of email.');
        }
      }
    } else {
      // Look up by username
      const { data: profileByUsername, error: usernameError } = await (supabase
        .from(DATABASE_TABLES.PROFILES))
        .select('*')
        .eq('username', trimmedIdentifier)
        .single();

      profile = profileByUsername;
      error = usernameError;
      if (profile) {
        userId = profile.id;
      }
    }

    if (error || !profile) {
      return apiNotFound('Profile not found');
    }

    // Calculate project count via actor_id (consistent with actor system)
    const resolvedUserId = userId || profile.id;
    let projectCount = 0;
    try {
      const actor = await getOrCreateUserActor(resolvedUserId);
      const { count } = await supabase
        .from(getTableName('project'))
        .select('*', { count: 'exact', head: true })
        .eq('actor_id', actor.id)
        .neq('status', 'draft'); // Exclude drafts from public view
      projectCount = count || 0;
    } catch {
      // Non-fatal: profile still returned without count
    }

    return apiSuccess({ ...profile, project_count: projectCount });
  } catch (error) {
    return handleApiError(error);
  }
});
