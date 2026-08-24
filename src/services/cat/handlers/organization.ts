/**
 * Cat action handlers for organizations (standing collectives).
 *
 * EntityType is `organization`; Postgres table remains `groups`.
 * `actors.actor_type` stays `'group'` in the DB.
 * Cat params prefer `organization_id`; handlers also accept legacy `group_id`.
 *
 * Created: 2026-01-21 (as organization.ts)
 * Last Modified: 2026-08-20
 * Last Modified Summary: EntityType/actions renamed to organization; DB columns unchanged.
 */

import { ENTITY_REGISTRY } from '@/config/entity-registry';
import { DATABASE_TABLES } from '@/config/database-tables';
import { slugify } from '@/utils/string';
import type { ActionHandler } from './types';

/** Map Cat param organization_id (preferred) or legacy group_id → DB group_id. */
function resolveGroupId(params: Record<string, unknown>): string | undefined {
  const id = params.organization_id ?? params.group_id;
  return typeof id === 'string' ? id : undefined;
}

export const organizationHandlers: Record<string, ActionHandler> = {
  invite_to_organization: async (supabase, userId, _actorId, params) => {
    let inviteeId = params.user_id as string | undefined;

    if (!inviteeId && params.username) {
      const rawUsername = (params.username as string).replace(/^@/, '');
      const { data: profile, error: profileError } = await supabase
        .from(DATABASE_TABLES.PROFILES)
        .select('id')
        .eq('username', rawUsername)
        .maybeSingle();
      if (profileError || !profile) {
        return { success: false, error: `User @${rawUsername} not found on OrangeCat` };
      }
      inviteeId = profile.id as string;
    }

    if (!inviteeId) {
      return { success: false, error: 'Provide either username or user_id for the invitee' };
    }

    const groupId = resolveGroupId(params);
    if (!groupId) {
      return { success: false, error: 'Provide organization_id for the invite' };
    }

    const { data, error } = await supabase
      .from(DATABASE_TABLES.GROUP_INVITATIONS)
      .insert({
        group_id: groupId,
        user_id: inviteeId,
        role: (params.role as string) || 'member',
        invited_by: userId,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    const role = (params.role as string) || 'member';
    const recipientDisplay = params.username
      ? (params.username as string).startsWith('@')
        ? params.username
        : `@${params.username}`
      : `user ${inviteeId.slice(0, 8)}`;
    return {
      success: true,
      data: {
        ...data,
        displayMessage: `📨 Invitation sent to ${recipientDisplay} (role: ${role})`,
      },
    };
  },

  create_organization: async (supabase, userId, _actorId, params) => {
    const name = params.name as string;
    const slug = slugify(name, { maxLength: 60, randomSuffix: true });

    const { data: organization, error: orgError } = await supabase
      .from(ENTITY_REGISTRY['organization'].tableName)
      .insert({
        name,
        slug,
        description: params.description || null,
        label: (params.label as string | null) ?? (params.type as string | null) ?? 'circle',
        created_by: userId,
      })
      .select()
      .single();

    if (orgError) {
      return { success: false, error: orgError.message };
    }

    const { error: memberError } = await supabase.from(DATABASE_TABLES.GROUP_MEMBERS).insert({
      group_id: organization.id,
      user_id: userId,
      role: 'admin',
    });

    if (memberError) {
      return { success: false, error: memberError.message };
    }

    const orgLabel = (params.label as string | null) ?? (params.type as string | null) ?? 'circle';
    return {
      success: true,
      data: {
        ...organization,
        displayMessage: `👥 ${orgLabel.charAt(0).toUpperCase() + orgLabel.slice(1)} "${name}" created`,
      },
    };
  },
};
