/**
 * Groups Service Permission Defaults
 *
 * Default permissions by role for groups.
 * Uses only the new unified roles (founder, admin, member).
 *
 * Note: This file provides backward compatibility for code that still uses
 * the old permission checking system. New code should use the resolver.ts
 * which derives permissions from governance presets.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-12-29
 * Last Modified Summary: Simplified to use only new roles
 */

import type { GroupPermissions } from './index';
import type { GroupRole } from '@/config/governance-presets';

export type GroupRolePermissions = Record<GroupRole, GroupPermissions>;

/**
 * Default permissions by role
 * These are fallback defaults - actual permissions should come from governance presets
 */
export const DEFAULT_GROUP_PERMISSIONS: GroupRolePermissions = {
  // Founder (highest level)
  founder: {
    canView: true,
    canJoin: true,
    canInvite: true,
    canManageMembers: true,
    canManageWallets: true,
    canCreateProjects: true,
    canManageSettings: true,
    canDelete: true,
    canCreateProposals: true,
    canVote: true,
  },

  // Admin (high level, but can't delete)
  admin: {
    canView: true,
    canJoin: true,
    canInvite: true,
    canManageMembers: true,
    canManageWallets: true,
    canCreateProjects: true,
    canManageSettings: true,
    canDelete: false,
    canCreateProposals: true,
    canVote: true,
  },

  // Member (basic level)
  member: {
    canView: true,
    canJoin: true,
    canInvite: false,
    canManageMembers: false,
    canManageWallets: false,
    canCreateProjects: false,
    canManageSettings: false,
    canDelete: false,
    canCreateProposals: false,
    canVote: true,
  },
};

