/**
 * Groups Service Permissions
 *
 * Unified permission checking for groups.
 * Uses only the new groups tables and config-based resolver.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-12-29
 * Last Modified Summary: Simplified to use only new groups tables
 */

// Export the config-based resolver (primary permission system)
export {
  canPerformAction,
  canPerformActions,
  getMemberPermissions,
  resolvePermission,
  type PermissionResult,
} from './resolver';

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import { TABLES } from '../constants';
import { GOVERNANCE_PRESETS } from '@/config/governance-presets';

// Permission keys that map to governance preset actions
export type GroupPermissionKey =
  | 'canView'
  | 'canJoin'
  | 'canInvite'
  | 'canManageMembers'
  | 'canManageWallets'
  | 'canCreateProjects'
  | 'canManageSettings'
  | 'canDelete'
  | 'canCreateProposals'
  | 'canVote';

export interface GroupPermissions {
  canView: boolean;
  canJoin: boolean;
  canInvite: boolean;
  canManageMembers: boolean;
  canManageWallets: boolean;
  canCreateProjects: boolean;
  canManageSettings: boolean;
  canDelete: boolean;
  canCreateProposals: boolean;
  canVote: boolean;
}

// Map permission keys to governance preset action keys
const PERMISSION_TO_ACTION: Record<GroupPermissionKey, string> = {
  canView: 'view', // Always allowed for members
  canJoin: 'join', // Always allowed for public groups
  canInvite: 'invite_members',
  canManageMembers: 'manage_members',
  canManageWallets: 'spend_funds',
  canCreateProjects: 'create_project',
  canManageSettings: 'manage_settings',
  canDelete: 'delete_group',
  canCreateProposals: 'create_proposal',
  canVote: 'vote',
};

/**
 * Check if user has specific permission in group
 */
export async function checkGroupPermission(
  groupId: string,
  userId: string,
  permission: GroupPermissionKey
): Promise<boolean> {
  if (!userId) {
    return false;
  }

  try {
    // Get group and membership
    const { data: group } = await supabase
      .from(TABLES.groups)
      .select('is_public, governance_preset')
      .eq('id', groupId)
      .single();

    if (!group) {
      return false;
    }

    // Get membership
    const { data: membership } = await supabase
      .from(TABLES.group_members)
      .select('role, permission_overrides')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle();

    // Non-members can only view public groups
    if (!membership) {
      if (group.is_public && permission === 'canView') {
        return true;
      }
      if (group.is_public && permission === 'canJoin') {
        return true;
      }
      return false;
    }

    // Members can always view
    if (permission === 'canView') {
      return true;
    }

    // Check permission override first
    if (membership.permission_overrides) {
      const actionKey = PERMISSION_TO_ACTION[permission];
      const override = membership.permission_overrides[actionKey];
      if (override === 'allow') {return true;}
      if (override === 'deny') {return false;}
    }

    // Fall back to governance preset role defaults
    const preset = GOVERNANCE_PRESETS[group.governance_preset as keyof typeof GOVERNANCE_PRESETS];
    if (!preset) {
      logger.warn('Unknown governance preset', { preset: group.governance_preset }, 'Groups');
      return false;
    }

    const role = membership.role as 'founder' | 'admin' | 'member';
    const rolePermissions = preset.roles[role];
    if (!rolePermissions) {
      return false;
    }

    const actionKey = PERMISSION_TO_ACTION[permission];
    const actionPermission = rolePermissions[actionKey as keyof typeof rolePermissions];

    return actionPermission === 'allow';
  } catch (error) {
    logger.error('Error checking group permission', error, 'Groups');
    return false;
  }
}

/**
 * Get all permissions for a user in a group
 */
export async function getGroupPermissions(
  groupId: string,
  userId: string
): Promise<GroupPermissions | null> {
  if (!userId) {
    return null;
  }

  try {
    // Get group and membership
    const { data: group } = await supabase
      .from(TABLES.groups)
      .select('is_public, governance_preset')
      .eq('id', groupId)
      .single();

    if (!group) {
      return null;
    }

    // Get membership
    const { data: membership } = await supabase
      .from(TABLES.group_members)
      .select('role, permission_overrides')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle();

    // Non-members get view-only permissions for public groups
    if (!membership) {
      if (group.is_public) {
        return {
          canView: true,
          canJoin: true,
          canInvite: false,
          canManageMembers: false,
          canManageWallets: false,
          canCreateProjects: false,
          canManageSettings: false,
          canDelete: false,
          canCreateProposals: false,
          canVote: false,
        };
      }
      return null;
    }

    // Get role permissions from governance preset
    const preset = GOVERNANCE_PRESETS[group.governance_preset as keyof typeof GOVERNANCE_PRESETS];
    if (!preset) {
      return null;
    }

    const role = membership.role as 'founder' | 'admin' | 'member';
    const rolePermissions = preset.roles[role];
    if (!rolePermissions) {
      return null;
    }

    // Build permissions object
    const permissions: GroupPermissions = {
      canView: true, // Members can always view
      canJoin: false, // Already a member
      canInvite: rolePermissions.invite_members === 'allow',
      canManageMembers: rolePermissions.manage_members === 'allow',
      canManageWallets: rolePermissions.spend_funds === 'allow',
      canCreateProjects: rolePermissions.create_project === 'allow',
      canManageSettings: rolePermissions.manage_settings === 'allow',
      canDelete: rolePermissions.delete_group === 'allow',
      canCreateProposals: rolePermissions.create_proposal === 'allow',
      canVote: rolePermissions.vote === 'allow',
    };

    // Apply permission overrides
    if (membership.permission_overrides) {
      for (const [key, value] of Object.entries(membership.permission_overrides)) {
        // Find the permission key for this action
        const permKey = Object.entries(PERMISSION_TO_ACTION).find(([_, v]) => v === key)?.[0] as GroupPermissionKey | undefined;
        if (permKey && permKey in permissions) {
          permissions[permKey] = value === 'allow';
        }
      }
    }

    return permissions;
  } catch (error) {
    logger.error('Error getting group permissions', error, 'Groups');
    return null;
  }
}

