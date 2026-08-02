/**
 * Navigation Generator - Single Source of Truth
 *
 * Generates navigation items automatically from entity registry.
 * Provides progressive disclosure with smart defaults.
 *
 * Created: 2025-01-30
 * Last Modified: 2026-08-02
 * Last Modified Summary: Collapse four copy-pasted section builders into one helper (jscpd dedup)
 */

import { ComponentType, SVGProps } from 'react';
import {
  ENTITY_REGISTRY,
  ENTITY_TYPES,
  type EntityType,
  type EntityCategory,
} from './entity-registry';
import type { NavSection, NavigationItem } from './navigation';

/**
 * Map entity categories to navigation sections
 */
interface CategoryToSectionMap {
  category: EntityCategory;
  sectionId: string;
  sectionTitle: string;
  priority: number;
  defaultExpanded: boolean; // Progressive disclosure: only expand most-used sections
  collapsible: boolean;
}

const _CATEGORY_TO_SECTION: CategoryToSectionMap[] = [
  {
    category: 'gateway',
    sectionId: 'wallet',
    sectionTitle: 'Wallet',
    priority: 5,
    defaultExpanded: false, // Collapsed by default - can expand to see wallet details
    collapsible: true,
  },
  {
    category: 'business',
    sectionId: 'sell',
    sectionTitle: 'Sell',
    priority: 2,
    defaultExpanded: true, // Expanded - core business function
    collapsible: true,
  },
  {
    category: 'community',
    sectionId: 'network',
    sectionTitle: 'Network',
    priority: 4,
    defaultExpanded: false, // Collapsed - can expand to see Groups, Circles, Events, People
    collapsible: true,
  },
  {
    category: 'finance',
    sectionId: 'manage',
    sectionTitle: 'Manage',
    priority: 5,
    defaultExpanded: false, // Collapsed - can expand to see Assets, Loans, Wallets
    collapsible: true,
  },
];

/**
 * Entity groupings for semantic navigation sections
 *
 * CREATE: Things you make/offer (Products, Services, AI Assistants)
 * FUND: Things that need funding/support (Projects, Causes, Research, Wishlists)
 */
const CREATE_ENTITIES: EntityType[] = ['product', 'service', 'ai_assistant'];
const FUND_ENTITIES: EntityType[] = ['project', 'cause', 'research', 'wishlist'];
const COORDINATE_ENTITIES: EntityType[] = ['group', 'circle', 'event'];
const FINANCE_ENTITIES: EntityType[] = ['wallet', 'asset', 'loan', 'investment'];

/** Sort navigation items by their entity's createPriority within a section. */
function byCreatePriority(a: NavigationItem, b: NavigationItem): number {
  const aType = ENTITY_TYPES.find(t => ENTITY_REGISTRY[t].basePath === a.href);
  const bType = ENTITY_TYPES.find(t => ENTITY_REGISTRY[t].basePath === b.href);
  const aPriority = aType ? ENTITY_REGISTRY[aType].createPriority : 999;
  const bPriority = bType ? ENTITY_REGISTRY[bType].createPriority : 999;
  return aPriority - bPriority;
}

/**
 * Build one navigation section from a list of entity types.
 * Returns null when the list is empty so callers can skip the section.
 */
function buildEntitySection(
  id: string,
  title: string,
  priority: number,
  types: EntityType[]
): NavSection | null {
  if (types.length === 0) {
    return null;
  }
  return {
    id,
    title,
    priority,
    defaultExpanded: false, // Collapsed - progressive disclosure
    collapsible: true,
    requiresAuth: true,
    items: types
      .map(type => {
        const entity = ENTITY_REGISTRY[type];
        return {
          name: entity.namePlural,
          href: entity.basePath,
          icon: entity.icon as ComponentType<SVGProps<SVGSVGElement>>,
          description: entity.description,
          requiresAuth: true,
        } as NavigationItem;
      })
      .sort(byCreatePriority),
  };
}

/**
 * Generate navigation items from entity registry
 *
 * Groups entities by semantic meaning for better UX:
 * - Create: Things you make/offer
 * - Fund: Things that need funding
 * - Network: Community connections
 * - Manage: Financial assets
 *
 * Applies progressive disclosure with smart defaults.
 */
export function generateEntityNavigation(): NavSection[] {
  // Group 1 filters through ENTITY_TYPES to preserve registry ordering;
  // the other groups use their declared ordering (pre-createPriority sort).
  const candidates = [
    buildEntitySection(
      'create',
      'Create',
      2,
      ENTITY_TYPES.filter(type => CREATE_ENTITIES.includes(type))
    ),
    buildEntitySection('fund', 'Fund', 3, FUND_ENTITIES),
    buildEntitySection('coordinate', 'Coordinate', 4, COORDINATE_ENTITIES),
    buildEntitySection('finance', 'Finance', 5, FINANCE_ENTITIES),
  ];

  const sections = candidates.filter((section): section is NavSection => section !== null);

  return sections.sort((a, b) => a.priority - b.priority);
}
