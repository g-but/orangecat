/**
 * Discover tabs — SSOT for tab IDs, entity mapping, and filter config.
 *
 * Import from here instead of duplicating TAB_TO_ENTITY / TAB_ENTITY_MAP
 * across DiscoverTabs, DiscoverEmptyState, and discoverConstants.
 */

import type { EntityType } from '@/config/entity-registry';

/** First-fold copy on /discover. The listings below are the action. */
export const DISCOVER_HERO = {
  title: 'Find something real',
  lede: 'Projects, products, and people. Bitcoin settles.',
  cta: 'List yours',
} as const;

export type DiscoverTabType =
  | 'all'
  | 'projects'
  | 'profiles'
  | 'loans'
  | 'investments'
  | 'assets'
  | 'causes'
  | 'events'
  | 'products'
  | 'services'
  | 'organizations'
  | 'circles'
  | 'wishlists'
  | 'research'
  | 'ai_assistants';

export const VALID_TAB_TYPES: DiscoverTabType[] = [
  'all',
  'projects',
  'profiles',
  'loans',
  'investments',
  'assets',
  'causes',
  'events',
  'products',
  'services',
  'organizations',
  'circles',
  'wishlists',
  'research',
  'ai_assistants',
];

/** Maps plural discover tab IDs to their singular EntityType in the registry. */
export const DISCOVER_TAB_TO_ENTITY: Partial<Record<DiscoverTabType, EntityType>> = {
  projects: 'project',
  causes: 'cause',
  investments: 'investment',
  loans: 'loan',
  assets: 'asset',
  products: 'product',
  services: 'service',
  events: 'event',
  organizations: 'organization',
  circles: 'circle',
  wishlists: 'wishlist',
  research: 'research',
  ai_assistants: 'ai_assistant',
};

/** Entity-backed tabs shown after "All" in the discover nav (order matters). */
export const DISCOVER_ENTITY_TAB_IDS = [
  'projects',
  'causes',
  'investments',
  'loans',
  'assets',
  'products',
  'services',
  'events',
  'organizations',
  'circles',
  'wishlists',
  'research',
  'ai_assistants',
] as const satisfies readonly DiscoverTabType[];

/** Legacy query ?type=groups → organizations */
export function normalizeDiscoverTabType(raw: string | null | undefined): DiscoverTabType {
  const value = raw === 'groups' ? 'organizations' : (raw ?? 'all');
  return VALID_TAB_TYPES.includes(value as DiscoverTabType) ? (value as DiscoverTabType) : 'all';
}

export interface DiscoverTabFilterConfig {
  projectStatus: boolean;
  projectCategories: boolean;
}

const PROJECT_SEARCH_TABS = new Set<DiscoverTabType>(['all', 'projects']);

/** Which sidebar filter blocks apply per tab. */
export const DISCOVER_TAB_FILTERS: Record<DiscoverTabType, DiscoverTabFilterConfig> =
  Object.fromEntries(
    VALID_TAB_TYPES.map(tab => [
      tab,
      {
        projectStatus: PROJECT_SEARCH_TABS.has(tab),
        projectCategories: PROJECT_SEARCH_TABS.has(tab),
      },
    ])
  ) as Record<DiscoverTabType, DiscoverTabFilterConfig>;
