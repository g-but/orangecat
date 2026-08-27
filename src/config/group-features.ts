/**
 * Group Features Configuration (SSOT)
 *
 * Features are optional capabilities that can be enabled/disabled per group.
 * Labels suggest features but don't force them.
 *
 * Adding a new feature = adding an entry here. No code changes needed.
 */

interface GroupFeatureConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  requiresFields?: string[];
  dependencies?: string[];
}

export const GROUP_FEATURES = {
  treasury: {
    id: 'treasury',
    name: 'Treasury',
    description: 'Shared Bitcoin wallet for group funds',
    icon: 'wallet',
    requiresFields: ['bitcoin_address'],
    dependencies: [],
  },

  proposals: {
    id: 'proposals',
    name: 'Proposals',
    description: 'Members can submit proposals for group decisions',
    icon: 'file-text',
    dependencies: [],
  },

  voting: {
    id: 'voting',
    name: 'Voting',
    description: 'Formal voting system for proposals',
    icon: 'vote',
    dependencies: ['proposals'], // Requires proposals
  },

  events: {
    id: 'events',
    name: 'Events',
    description: 'Group can create and manage events',
    icon: 'calendar',
    dependencies: [],
  },

  marketplace: {
    id: 'marketplace',
    name: 'Marketplace',
    description: 'Group can list products and services',
    icon: 'store',
    dependencies: [],
  },

  shared_wallet: {
    id: 'shared_wallet',
    name: 'Shared Wallet',
    description: 'Simple shared savings without formal treasury',
    icon: 'piggy-bank',
    dependencies: [],
  },
} as const satisfies Record<string, GroupFeatureConfig>;

export type GroupFeature = keyof typeof GROUP_FEATURES;
