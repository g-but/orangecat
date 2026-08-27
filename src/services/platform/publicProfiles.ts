/**
 * Turning an actor reference into somebody you can name.
 *
 * FleetCrown reads the typed stakeholder graph, entity ownership and settled
 * payments out of OrangeCat, and every one of those is keyed by `actor_id`.
 * Without this resolver the customer edge that IS the FleetCrown relationship
 * renders as a UUID. `/oauth/userinfo` does not help: it describes the token's
 * own subject and nobody else.
 *
 * Users and groups resolve through the same door on purpose. A stakeholder edge
 * may point at either, so a resolver that handled only people would leave every
 * team-owned edge exactly as dead as before.
 *
 * All lookups go through the admin client and filter visibility here, in the
 * app layer — the same non-session pattern as `/api/v1/search`, which is also
 * unauthenticated and also serves only already-public rows.
 */

import { DATABASE_TABLES } from '@/config/database-tables';
import { applyProfilePrivacy } from '@/config/profile-privacy';
import { publicProfilePath } from '@/config/public-profile-path';
import { ROUTES } from '@/config/routes';
import { SITE_URL } from '@/config/brand';
import type { PublicProfile } from '@/config/public-profile';
import type { AnySupabaseClient } from '@/lib/supabase/types';

const PROFILE_COLUMNS =
  'id, username, name, bio, avatar_url, banner_url, website, social_links, privacy_settings, created_at, updated_at';
const GROUP_COLUMNS =
  'id, name, slug, description, avatar_url, banner_url, visibility, is_public, created_at, updated_at';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

interface ActorRow {
  id: string;
  actor_type: string;
  user_id: string | null;
  group_id: string | null;
}

interface ProfileRow {
  id: string;
  username: string | null;
  name: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  website: string | null;
  social_links: unknown;
  privacy_settings: unknown;
  created_at: string | null;
  updated_at: string | null;
}

interface GroupRow {
  id: string;
  name: string | null;
  slug: string | null;
  description: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  visibility: string | null;
  is_public: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Two columns encode the same idea, for historical reasons: `visibility`
 * ('public' | 'members_only' | 'private') and the older boolean `is_public`.
 * A group counts as public only if the column that is actually set says so;
 * anything else resolves to nothing at all, so a private team's existence
 * never leaks through the difference between 404 and "found but empty".
 */
function isPublicGroup(group: GroupRow): boolean {
  if (group.visibility) {
    return group.visibility === 'public';
  }
  return group.is_public !== false;
}

function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

/** jsonb can hold anything; the contract promises an object or null. */
function asJsonObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function projectUser(profile: ProfileRow, actorId: string): PublicProfile {
  // The owner's per-field hide list applies: this is the visitor view, and a
  // hidden field must read as unset rather than as "hidden but present".
  const visible = applyProfilePrivacy({ ...profile }, { isOwner: false }) as ProfileRow;
  return {
    actor_id: actorId,
    kind: 'user',
    id: profile.id,
    handle: profile.username ?? null,
    display_name: profile.name ?? null,
    bio: profile.bio ?? null,
    avatar_url: profile.avatar_url ?? null,
    banner_url: profile.banner_url ?? null,
    website: visible.website ?? null,
    social_links: asJsonObject(visible.social_links),
    url: profile.username ? absoluteUrl(publicProfilePath(profile.username)) : null,
    created_at: profile.created_at ?? null,
    updated_at: profile.updated_at ?? null,
  };
}

function projectGroup(group: GroupRow, actorId: string): PublicProfile {
  return {
    actor_id: actorId,
    kind: 'group',
    id: group.id,
    handle: group.slug ?? null,
    display_name: group.name ?? null,
    bio: group.description ?? null,
    avatar_url: group.avatar_url ?? null,
    banner_url: group.banner_url ?? null,
    // `groups` has no website / social_links columns. Null, not absent: the
    // shape is one contract for both kinds, so a client never branches on it.
    website: null,
    social_links: null,
    url: group.slug ? absoluteUrl(ROUTES.GROUPS.VIEW(group.slug)) : null,
    created_at: group.created_at ?? null,
    updated_at: group.updated_at ?? null,
  };
}

async function fetchActorsByIds(client: AnySupabaseClient, ids: string[]): Promise<ActorRow[]> {
  if (ids.length === 0) {
    return [];
  }
  const { data } = await client
    .from(DATABASE_TABLES.ACTORS)
    .select('id, actor_type, user_id, group_id')
    .in('id', ids);
  return (data ?? []) as ActorRow[];
}

/** Actor rows for a set of user ids and group ids, so every result carries its join key. */
async function fetchActorsBySubject(
  client: AnySupabaseClient,
  userIds: string[],
  groupIds: string[]
): Promise<ActorRow[]> {
  const [byUser, byGroup] = await Promise.all([
    userIds.length
      ? client
          .from(DATABASE_TABLES.ACTORS)
          .select('id, actor_type, user_id, group_id')
          .in('user_id', userIds)
      : Promise.resolve({ data: [] }),
    groupIds.length
      ? client
          .from(DATABASE_TABLES.ACTORS)
          .select('id, actor_type, user_id, group_id')
          .in('group_id', groupIds)
      : Promise.resolve({ data: [] }),
  ]);
  return [...((byUser.data ?? []) as ActorRow[]), ...((byGroup.data ?? []) as ActorRow[])];
}

async function fetchProfiles(client: AnySupabaseClient, ids: string[]): Promise<ProfileRow[]> {
  if (ids.length === 0) {
    return [];
  }
  const { data } = await client
    .from(DATABASE_TABLES.PROFILES)
    .select(PROFILE_COLUMNS)
    .in('id', ids);
  return (data ?? []) as ProfileRow[];
}

async function fetchGroups(client: AnySupabaseClient, ids: string[]): Promise<GroupRow[]> {
  if (ids.length === 0) {
    return [];
  }
  const { data } = await client.from(DATABASE_TABLES.GROUPS).select(GROUP_COLUMNS).in('id', ids);
  return ((data ?? []) as GroupRow[]).filter(isPublicGroup);
}

/**
 * Handles a profile used to have still resolve.
 *
 * A username here is also a Lightning address, so #773 made renames
 * non-breaking by keeping the old handle pointed at the account forever. A
 * resolver that only knew current handles would reintroduce exactly the
 * breakage that table exists to prevent — a client that cached `@alice` before
 * the rename would start getting nothing back.
 */
async function resolveRetiredHandles(
  client: AnySupabaseClient,
  handles: string[]
): Promise<string[]> {
  if (handles.length === 0) {
    return [];
  }
  const { data } = await client
    .from(DATABASE_TABLES.PROFILE_USERNAME_HISTORY)
    .select('profile_id')
    .in('old_username', handles);
  return ((data ?? []) as Array<{ profile_id: string }>).map(r => r.profile_id);
}

async function resolveHandlesToSubjects(
  client: AnySupabaseClient,
  handles: string[]
): Promise<{ userIds: string[]; groupIds: string[] }> {
  // `username_lower` is a stored generated column (migration
  // 20260826120000_profiles_username_lower_column), so this is an exact
  // case-insensitive match. `ilike` is not an option: `_` is a legal
  // username character and also LIKE's single-character wildcard, which would
  // make `user_823e4d9d` match `userX823e4d9d`.
  const lowered = handles.map(h => h.toLowerCase());
  const [profileRes, groupRes] = await Promise.all([
    client
      .from(DATABASE_TABLES.PROFILES)
      .select('id, username_lower')
      .in('username_lower', lowered),
    client.from(DATABASE_TABLES.GROUPS).select('id, slug').in('slug', lowered),
  ]);

  const profiles = (profileRes.data ?? []) as Array<{ id: string; username_lower: string | null }>;
  const groups = (groupRes.data ?? []) as Array<{ id: string; slug: string | null }>;

  const matched = new Set<string>([
    ...profiles.map(p => (p.username_lower ?? '').toLowerCase()),
    ...groups.map(g => (g.slug ?? '').toLowerCase()),
  ]);
  const unmatched = lowered.filter(h => !matched.has(h));
  const retired = await resolveRetiredHandles(client, unmatched);

  return {
    userIds: [...new Set([...profiles.map(p => p.id), ...retired])],
    groupIds: groups.map(g => g.id),
  };
}

/**
 * Resolve identities by actor id and/or handle, in one round of queries.
 *
 * Unknown references are simply absent from the result — a resolver that threw
 * on the first stale id would make one deleted account break the rendering of
 * a whole stakeholder graph. Callers match on `actor_id` / `handle`.
 */
export async function resolvePublicProfiles(
  client: AnySupabaseClient,
  query: { actorIds?: string[]; handles?: string[] }
): Promise<PublicProfile[]> {
  const actorIds = (query.actorIds ?? []).filter(isUuid);
  const handles = (query.handles ?? []).filter(h => h.length > 0);

  if (actorIds.length === 0 && handles.length === 0) {
    return [];
  }

  const [actorsById, fromHandles] = await Promise.all([
    fetchActorsByIds(client, actorIds),
    handles.length
      ? resolveHandlesToSubjects(client, handles)
      : Promise.resolve({ userIds: [] as string[], groupIds: [] as string[] }),
  ]);

  const userIds = new Set<string>(fromHandles.userIds);
  const groupIds = new Set<string>(fromHandles.groupIds);
  for (const actor of actorsById) {
    if (actor.user_id) {
      userIds.add(actor.user_id);
    }
    if (actor.group_id) {
      groupIds.add(actor.group_id);
    }
  }

  // The handle path found subjects but not their actors; the actor path found
  // actors but the two sets overlap. One lookup over the union covers both.
  const [profiles, groups, actorsBySubject] = await Promise.all([
    fetchProfiles(client, [...userIds]),
    fetchGroups(client, [...groupIds]),
    fetchActorsBySubject(client, [...userIds], [...groupIds]),
  ]);

  const actorByUser = new Map<string, string>();
  const actorByGroup = new Map<string, string>();
  for (const actor of [...actorsById, ...actorsBySubject]) {
    if (actor.user_id && !actorByUser.has(actor.user_id)) {
      actorByUser.set(actor.user_id, actor.id);
    }
    if (actor.group_id && !actorByGroup.has(actor.group_id)) {
      actorByGroup.set(actor.group_id, actor.id);
    }
  }

  const results: PublicProfile[] = [];
  for (const profile of profiles) {
    const actorId = actorByUser.get(profile.id);
    // An account with no actor row yet has nothing to join on, and inventing
    // one here would mean a read endpoint writing rows. Omitted instead.
    if (actorId) {
      results.push(projectUser(profile, actorId));
    }
  }
  for (const group of groups) {
    const actorId = actorByGroup.get(group.id);
    if (actorId) {
      results.push(projectGroup(group, actorId));
    }
  }
  return results;
}

/**
 * Resolve a single identity from whatever a client happens to be holding.
 *
 * A UUID is tried as an actor id first — that is the id every cross-product
 * reference carries — then as a profile or group id, because a client that
 * pulled an id out of an entity row should not have to know which kind it is.
 * Anything else is treated as a handle.
 */
export async function resolvePublicProfile(
  client: AnySupabaseClient,
  idOrHandle: string
): Promise<PublicProfile | null> {
  const value = idOrHandle.trim();
  if (!value) {
    return null;
  }

  if (isUuid(value)) {
    const byActor = await resolvePublicProfiles(client, { actorIds: [value] });
    if (byActor.length > 0) {
      return byActor[0];
    }
    const [profiles, groups] = await Promise.all([
      fetchProfiles(client, [value]),
      fetchGroups(client, [value]),
    ]);
    const actors = await fetchActorsBySubject(
      client,
      profiles.map(p => p.id),
      groups.map(g => g.id)
    );
    const profile = profiles[0];
    if (profile) {
      const actorId = actors.find(a => a.user_id === profile.id)?.id;
      return actorId ? projectUser(profile, actorId) : null;
    }
    const group = groups[0];
    if (group) {
      const actorId = actors.find(a => a.group_id === group.id)?.id;
      return actorId ? projectGroup(group, actorId) : null;
    }
    return null;
  }

  const byHandle = await resolvePublicProfiles(client, { handles: [value] });
  return byHandle[0] ?? null;
}
