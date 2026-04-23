/**
 * Group Resource Handler
 *
 * Shared utilities for group-scoped API routes to eliminate duplication.
 * Extracts common patterns: group lookup by slug, membership checks,
 * event fetching, and proposal state transitions.
 *
 * Created: 2026-03-23
 */

import { NextResponse } from 'next/server';
import { DATABASE_TABLES } from '@/config/database-tables';
import {
  apiNotFound,
  apiForbidden,
  apiSuccess,
  apiBadRequest,
  handleApiError,
} from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import type { AnySupabaseClient } from '@/lib/supabase/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedTable = any;

// =====================================================================
// TYPES
// =====================================================================

export interface GroupRecord {
  id: string;
}

export interface MembershipRecord {
  id?: string;
  role: string;
}

export interface EventRecord {
  id: string;
  group_id: string;
  creator_id: string;
  is_public: boolean;
  title?: string;
  [key: string]: unknown;
}

interface GroupAuthSuccess {
  ok: true;
  group: GroupRecord;
  membership: MembershipRecord | null;
}

interface GroupAuthFailure {
  ok: false;
  response: NextResponse;
}

export type GroupAuthResult = GroupAuthSuccess | GroupAuthFailure;

// =====================================================================
// GROUP LOOKUP & AUTH
// =====================================================================

/**
 * Resolve a group by slug and optionally verify membership.
 *
 * Returns the group record and membership (if the user is a member).
 * If requireMembership is true, returns a 403 response when the user
 * is not a member of the group.
 */
export async function withGroupContext(
  slug: string,
  supabase: AnySupabaseClient,
  userId: string,
  options?: { requireMembership?: boolean }
): Promise<GroupAuthResult> {
  // Look up group by slug
  const { data: groupData, error: groupError } = await (
    supabase.from(DATABASE_TABLES.GROUPS) as UntypedTable
  )
    .select('id')
    .eq('slug', slug)
    .single();

  const group = groupData as GroupRecord | null;

  if (groupError || !group) {
    return { ok: false, response: apiNotFound('Group not found') };
  }

  // Check membership
  const { data: membershipData } = await (
    supabase.from(DATABASE_TABLES.GROUP_MEMBERS) as UntypedTable
  )
    .select('id, role')
    .eq('group_id', group.id)
    .eq('user_id', userId)
    .maybeSingle();

  const membership = membershipData as MembershipRecord | null;

  if (options?.requireMembership && !membership) {
    return { ok: false, response: apiForbidden('You must be a group member') };
  }

  return { ok: true, group, membership };
}

/**
 * Check whether the user is the event creator or a group admin/founder.
 * Returns true if the user has edit/delete permissions on the event.
 */
export function hasEventPermission(
  event: EventRecord,
  userId: string,
  membership: MembershipRecord | null
): boolean {
  const isCreator = event.creator_id === userId;
  const isAdmin =
    membership !== null &&
    membership !== undefined &&
    ['founder', 'admin'].includes(membership.role);
  return isCreator || isAdmin;
}

// =====================================================================
// EVENT HELPERS
// =====================================================================

/**
 * Fetch a group event by ID, scoped to a group.
 *
 * Returns the event record or a 404 response.
 */
export async function fetchGroupEvent(
  supabase: AnySupabaseClient,
  groupId: string,
  eventId: string,
  selectColumns: string = 'id, group_id, creator_id, is_public, title'
): Promise<{ ok: true; event: EventRecord } | { ok: false; response: NextResponse }> {
  const { data: eventData, error: eventError } = await (
    supabase.from(DATABASE_TABLES.GROUP_EVENTS) as UntypedTable
  )
    .select(selectColumns)
    .eq('id', eventId)
    .eq('group_id', groupId)
    .single();

  const event = eventData as EventRecord | null;

  if (eventError || !event) {
    return { ok: false, response: apiNotFound('Event not found') };
  }

  return { ok: true, event };
}

// =====================================================================
// PROPOSAL STATE TRANSITION
// =====================================================================

/**
 * Generic handler for proposal state change routes (activate, cancel).
 *
 * All proposal state routes share the same structure:
 *   1. Auth check (already handled by caller or withAuth)
 *   2. Extract proposal ID from params
 *   3. Call the service mutation
 *   4. Return success or error
 *
 * @param proposalId - The proposal UUID
 * @param mutationFn - The service function to call (e.g. activateProposal, cancelProposal)
 * @param supabase - Authenticated Supabase client
 * @param logLabel - Label for error logging (e.g. "activate", "cancel")
 */
export async function handleProposalStateChange(
  proposalId: string,
  mutationFn: (
    id: string,
    client: AnySupabaseClient
  ) => Promise<{
    success: boolean;
    error?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    proposal?: any;
  }>,
  supabase: AnySupabaseClient,
  logLabel: string
): Promise<NextResponse> {
  try {
    const result = await mutationFn(proposalId, supabase);
    if (!result.success) {
      return apiBadRequest(result.error || `Failed to ${logLabel} proposal`);
    }
    return apiSuccess(result.proposal);
  } catch (error) {
    logger.error(`Error in POST /api/groups/[slug]/proposals/[id]/${logLabel}`, error, 'API');
    return handleApiError(error);
  }
}
