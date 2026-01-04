/**
 * Governance Presets Configuration (SSOT)
 *
 * Defines permission templates for different governance models.
 * Groups select a preset but can override individual member permissions.
 *
 * Adding a new governance model = adding an entry here. No code changes needed.
 */

export type ActionPermission = 'allow' | 'deny' | 'vote_required';

export interface RolePermissions {
  manage_settings: ActionPermission;
  manage_members: ActionPermission;
  invite_members: ActionPermission;
  remove_members: ActionPermission;
  spend_funds: ActionPermission;
  create_project: ActionPermission;
  create_proposal: ActionPermission;
  vote: ActionPermission;
  delete_group: ActionPermission;
}

export interface GovernancePresetConfig {
  id: string;
  name: string;
  description: string;
  votingThreshold: number | null; // null = no voting, direct authority
  roles: {
    founder: RolePermissions;
    admin: RolePermissions;
    member: RolePermissions;
  };
}

export const GOVERNANCE_PRESETS = {
  consensus: {
    id: 'consensus',
    name: 'Consensus',
    description: 'All members are equal. Major decisions require agreement.',
    votingThreshold: 100, // Unanimous
    roles: {
      founder: {
        manage_settings: 'allow',
        manage_members: 'allow',
        invite_members: 'allow',
        remove_members: 'vote_required',
        spend_funds: 'vote_required',
        create_project: 'allow',
        create_proposal: 'allow',
        vote: 'allow',
        delete_group: 'vote_required',
      },
      admin: {
        manage_settings: 'vote_required',
        manage_members: 'vote_required',
        invite_members: 'allow',
        remove_members: 'vote_required',
        spend_funds: 'vote_required',
        create_project: 'allow',
        create_proposal: 'allow',
        vote: 'allow',
        delete_group: 'deny',
      },
      member: {
        manage_settings: 'vote_required',
        manage_members: 'deny',
        invite_members: 'allow',
        remove_members: 'deny',
        spend_funds: 'vote_required',
        create_project: 'allow',
        create_proposal: 'allow',
        vote: 'allow',
        delete_group: 'deny',
      },
    },
  },

  democratic: {
    id: 'democratic',
    name: 'Democratic',
    description: 'Majority voting on important decisions.',
    votingThreshold: 51, // Simple majority
    roles: {
      founder: {
        manage_settings: 'allow',
        manage_members: 'allow',
        invite_members: 'allow',
        remove_members: 'allow',
        spend_funds: 'allow',
        create_project: 'allow',
        create_proposal: 'allow',
        vote: 'allow',
        delete_group: 'vote_required',
      },
      admin: {
        manage_settings: 'vote_required',
        manage_members: 'allow',
        invite_members: 'allow',
        remove_members: 'vote_required',
        spend_funds: 'vote_required',
        create_project: 'allow',
        create_proposal: 'allow',
        vote: 'allow',
        delete_group: 'deny',
      },
      member: {
        manage_settings: 'deny',
        manage_members: 'deny',
        invite_members: 'vote_required',
        remove_members: 'deny',
        spend_funds: 'deny',
        create_project: 'vote_required',
        create_proposal: 'allow',
        vote: 'allow',
        delete_group: 'deny',
      },
    },
  },

  hierarchical: {
    id: 'hierarchical',
    name: 'Hierarchical',
    description: 'Founders and admins make decisions.',
    votingThreshold: null, // No voting, direct authority
    roles: {
      founder: {
        manage_settings: 'allow',
        manage_members: 'allow',
        invite_members: 'allow',
        remove_members: 'allow',
        spend_funds: 'allow',
        create_project: 'allow',
        create_proposal: 'allow',
        vote: 'allow',
        delete_group: 'allow',
      },
      admin: {
        manage_settings: 'allow',
        manage_members: 'allow',
        invite_members: 'allow',
        remove_members: 'allow',
        spend_funds: 'allow',
        create_project: 'allow',
        create_proposal: 'allow',
        vote: 'allow',
        delete_group: 'deny',
      },
      member: {
        manage_settings: 'deny',
        manage_members: 'deny',
        invite_members: 'deny',
        remove_members: 'deny',
        spend_funds: 'deny',
        create_project: 'deny',
        create_proposal: 'allow',
        vote: 'allow',
        delete_group: 'deny',
      },
    },
  },
} as const satisfies Record<string, GovernancePresetConfig>;

export type GovernancePreset = keyof typeof GOVERNANCE_PRESETS;
export type GroupRole = 'founder' | 'admin' | 'member';

/**
 * Get role permissions from a governance preset
 */
export function getRolePermissions(
  preset: GovernancePreset,
  role: GroupRole
): RolePermissions {
  return GOVERNANCE_PRESETS[preset].roles[role];
}

/**
 * Get all governance presets as array for UI rendering
 */
export function getGovernancePresetsArray() {
  return Object.entries(GOVERNANCE_PRESETS).map(([key, config]) => ({
    key: key as GovernancePreset,
    ...config,
  }));
}

/**
 * Check if an action requires a vote for a given preset and role
 */
export function actionRequiresVote(
  preset: GovernancePreset,
  role: GroupRole,
  action: keyof RolePermissions
): boolean {
  return GOVERNANCE_PRESETS[preset].roles[role][action] === 'vote_required';
}
