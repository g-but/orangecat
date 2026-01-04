/**
 * Group Labels Configuration (SSOT)
 *
 * Labels are IDENTITY + TEMPLATE, not capability locks.
 * A "Family" can enable voting. A "DAO" can disable treasury.
 * Labels influence defaults but don't restrict capabilities.
 *
 * Adding a new label = adding an entry here. No code changes needed.
 */

import {
  Users,
  Building2,
  Heart,
  Briefcase,
  Globe,
  Home,
  Handshake,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { GovernancePreset } from './governance-presets';
import type { GroupFeature } from './group-features';

export type GroupVisibility = 'public' | 'members_only' | 'private';

export interface GroupLabelConfig {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  defaults: {
    is_public: boolean;
    visibility: GroupVisibility;
  };
  suggestedFeatures: GroupFeature[];
  defaultGovernance: GovernancePreset;
}

export const GROUP_LABELS = {
  circle: {
    id: 'circle',
    name: 'Circle',
    description: 'Informal group of trusted people',
    icon: Users,
    color: 'purple',
    defaults: {
      is_public: false,
      visibility: 'members_only',
    },
    suggestedFeatures: [],
    defaultGovernance: 'consensus',
  },

  family: {
    id: 'family',
    name: 'Family',
    description: 'Private family group for savings and planning',
    icon: Home,
    color: 'amber',
    defaults: {
      is_public: false,
      visibility: 'private',
    },
    suggestedFeatures: ['shared_wallet'],
    defaultGovernance: 'consensus',
  },

  dao: {
    id: 'dao',
    name: 'DAO',
    description: 'Decentralized organization with voting',
    icon: Globe,
    color: 'blue',
    defaults: {
      is_public: true,
      visibility: 'public',
    },
    suggestedFeatures: ['treasury', 'proposals', 'voting'],
    defaultGovernance: 'democratic',
  },

  company: {
    id: 'company',
    name: 'Company',
    description: 'Business organization',
    icon: Building2,
    color: 'slate',
    defaults: {
      is_public: false,
      visibility: 'members_only',
    },
    suggestedFeatures: ['treasury'],
    defaultGovernance: 'hierarchical',
  },

  nonprofit: {
    id: 'nonprofit',
    name: 'Nonprofit',
    description: 'Mission-driven organization',
    icon: Heart,
    color: 'rose',
    defaults: {
      is_public: true,
      visibility: 'public',
    },
    suggestedFeatures: ['treasury', 'proposals'],
    defaultGovernance: 'democratic',
  },

  cooperative: {
    id: 'cooperative',
    name: 'Cooperative',
    description: 'Member-owned organization',
    icon: Handshake,
    color: 'green',
    defaults: {
      is_public: true,
      visibility: 'public',
    },
    suggestedFeatures: ['treasury', 'proposals', 'voting'],
    defaultGovernance: 'democratic',
  },

  guild: {
    id: 'guild',
    name: 'Guild',
    description: 'Professional association',
    icon: Briefcase,
    color: 'indigo',
    defaults: {
      is_public: true,
      visibility: 'public',
    },
    suggestedFeatures: ['events', 'marketplace'],
    defaultGovernance: 'hierarchical',
  },

  network_state: {
    id: 'network_state',
    name: 'Network State',
    description: 'Digital-first nation or community with shared values',
    icon: Globe,
    color: 'cyan',
    defaults: {
      is_public: true,
      visibility: 'public',
    },
    suggestedFeatures: ['treasury', 'proposals', 'voting', 'events'],
    defaultGovernance: 'democratic',
  },
} as const satisfies Record<string, GroupLabelConfig>;

export type GroupLabel = keyof typeof GROUP_LABELS;

/**
 * Get defaults for a group label
 */
export function getGroupLabelDefaults(label: GroupLabel) {
  const config = GROUP_LABELS[label];
  return {
    ...config.defaults,
    label,
    governance_preset: config.defaultGovernance,
    suggestedFeatures: config.suggestedFeatures,
  };
}

/**
 * Get all group labels as array for UI rendering
 */
export function getGroupLabelsArray() {
  return Object.entries(GROUP_LABELS).map(([key, config]) => ({
    key: key as GroupLabel,
    ...config,
  }));
}
