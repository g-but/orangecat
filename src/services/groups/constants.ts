/**
 * Groups Service Constants
 *
 * References the SSOT config files.
 * No legacy constants - clean unified system.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-12-29
 * Last Modified Summary: Removed legacy constants, using config-based SSOT only
 */

import { GROUP_LABELS, getGroupLabelDefaults, type GroupLabel } from '@/config/group-labels';
import { GOVERNANCE_PRESETS, type GovernancePreset } from '@/config/governance-presets';
import { GROUP_FEATURES, type GroupFeature } from '@/config/group-features';

// Re-export config for convenience
export { GROUP_LABELS, GOVERNANCE_PRESETS, GROUP_FEATURES };
export type { GroupLabel, GovernancePreset, GroupFeature };

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Table names
export const TABLES = {
  groups: 'groups',
  group_members: 'group_members',
  group_features: 'group_features',
  group_proposals: 'group_proposals',
  group_votes: 'group_votes',
  group_wallets: 'group_wallets',
  group_events: 'group_events',
  group_event_rsvps: 'group_event_rsvps',
  group_invitations: 'group_invitations',
  group_activities: 'group_activities', // Activity logging table
} as const;

/**
 * Get defaults for a group label
 * Delegates to the SSOT config
 */
export function getDefaultsForLabel(label: GroupLabel) {
  return getGroupLabelDefaults(label);
}
