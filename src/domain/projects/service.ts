import { listEntityPage, createEntity } from '@/domain/base/entityService';
import { PROJECT_STATUS } from '@/config/project-statuses';
import { STATUS } from '@/config/database-constants';
import type { ProjectData } from '@/lib/validation';
import type { AnySupabaseClient } from '@/lib/supabase/types';
import { PLATFORM_DEFAULT_CURRENCY } from '@/config/currencies';

export async function listProjectsPage(
  limit: number,
  offset: number,
  userId?: string,
  /**
   * Whether to include the requester's drafts. Must be derived from
   * `shouldIncludeDrafts(requestedUserId, authenticatedUserId)` at the
   * API-route layer — never trust the raw `?user_id=` query param.
   * Default false so callers that forget the check don't leak drafts.
   */
  includeOwnDrafts = false
) {
  // Plain '*' — no profile join. The `projects` table has no FK on user_id
  // (only actor_id → actors), so the embedded `profiles:user_id(...)` syntax
  // produced a 500. Detail-view (GET /api/projects/[id]) fetches the profile
  // in a separate query; list-view cards don't read profile fields.
  const result = await listEntityPage('project', {
    limit,
    offset,
    userId,
    includeOwnDrafts,
    publicStatuses: [PROJECT_STATUS.ACTIVE],
  });

  // Ensure raised_amount defaults to 0
  const items = result.items.map((project: Record<string, unknown>) => ({
    ...project,
    raised_amount: project.raised_amount ?? 0,
  }));

  return { items, total: result.total };
}

export async function createProject(
  userId: string,
  payload: ProjectData,
  // Optional client override — the API layer passes the service-role client for
  // bearer-authenticated callers (no Supabase session → RLS would block the
  // insert). Omitted for session-auth callers, which fall back to the RLS-scoped
  // server client. Authorization is enforced at the API layer before this runs.
  client?: AnySupabaseClient
) {
  return createEntity(
    'project',
    userId,
    {
      user_id: userId,
      title: payload.title,
      description: payload.description,
      goal_amount: payload.goal_amount ?? null,
      currency: payload.currency ?? PLATFORM_DEFAULT_CURRENCY,
      funding_purpose: payload.funding_purpose ?? null,
      bitcoin_address: payload.bitcoin_address ?? null,
      lightning_address: payload.lightning_address ?? null,
      website_url: payload.website_url ?? null,
      category: payload.category ?? null,
      tags: payload.tags ?? [],
      status: payload.status ?? STATUS.PROJECTS.DRAFT,
      // Respect the form's profile-visibility toggle; DB default (true) would
      // otherwise always win and ignore an unchecked box.
      show_on_profile: payload.show_on_profile ?? true,
    },
    client ? { client } : undefined
  );
}
