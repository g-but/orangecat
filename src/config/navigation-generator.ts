/**
 * Navigation Generator - Single Source of Truth
 *
 * Generates navigation items automatically from entity registry.
 * Provides progressive disclosure with smart defaults.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Initial creation - generates navigation from entity registry
 */

import { ComponentType, SVGProps } from 'react';
import { ENTITY_REGISTRY, ENTITY_TYPES, type EntityType, type EntityCategory } from './entity-registry';
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

const CATEGORY_TO_SECTION: CategoryToSectionMap[] = [
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
    defaultExpanded: false, // Collapsed - can expand to see Groups, Events, People
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
 * Special handling for "Raise" section (Projects and Causes)
 * These are business entities but deserve their own section
 */
const RAISE_ENTITIES: EntityType[] = ['project', 'cause'];

/**
 * Generate navigation items from entity registry
 *
 * Groups entities by category and creates navigation sections.
 * Applies progressive disclosure with smart defaults.
 */
export function generateEntityNavigation(): NavSection[] {
  const sections: NavSection[] = [];

  // Group 1: Sell (Products, Services, AI Assistants)
  const sellEntities = ENTITY_TYPES.filter(
    type => ENTITY_REGISTRY[type].category === 'business' && !RAISE_ENTITIES.includes(type)
  );
  if (sellEntities.length > 0) {
    sections.push({
      id: 'sell',
      title: 'Sell',
      priority: 2,
      defaultExpanded: true, // Core business - expanded by default
      collapsible: true,
      requiresAuth: true,
      items: sellEntities
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
        .sort((a, b) => {
          // Sort by entity priority within section
          const aType = ENTITY_TYPES.find(t => ENTITY_REGISTRY[t].basePath === a.href);
          const bType = ENTITY_TYPES.find(t => ENTITY_REGISTRY[t].basePath === b.href);
          const aPriority = aType ? ENTITY_REGISTRY[aType].createPriority : 999;
          const bPriority = bType ? ENTITY_REGISTRY[bType].createPriority : 999;
          return aPriority - bPriority;
        }),
    });
  }

  // Group 2: Raise (Projects, Causes)
  if (RAISE_ENTITIES.length > 0) {
    sections.push({
      id: 'raise',
      title: 'Raise',
      priority: 3,
      defaultExpanded: true, // Core business - expanded by default
      collapsible: true,
      requiresAuth: true,
      items: RAISE_ENTITIES.map(type => {
        const entity = ENTITY_REGISTRY[type];
        return {
          name: entity.namePlural,
          href: entity.basePath,
          icon: entity.icon as ComponentType<SVGProps<SVGSVGElement>>,
          description: entity.description,
          requiresAuth: true,
        } as NavigationItem;
      }).sort((a, b) => {
        const aType = ENTITY_TYPES.find(t => ENTITY_REGISTRY[t].basePath === a.href);
        const bType = ENTITY_TYPES.find(t => ENTITY_REGISTRY[t].basePath === b.href);
        const aPriority = aType ? ENTITY_REGISTRY[aType].createPriority : 999;
        const bPriority = bType ? ENTITY_REGISTRY[bType].createPriority : 999;
        return aPriority - bPriority;
      }),
    });
  }

  // Group 3: Network (Groups, Events, People)
  const networkEntities = ENTITY_TYPES.filter(
    type => ENTITY_REGISTRY[type].category === 'community'
  );
  if (networkEntities.length > 0) {
    sections.push({
      id: 'network',
      title: 'Network',
      priority: 4,
      defaultExpanded: false, // Collapsed - progressive disclosure
      collapsible: true,
      requiresAuth: true,
      items: networkEntities
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
        .sort((a, b) => {
          const aType = ENTITY_TYPES.find(t => ENTITY_REGISTRY[t].basePath === a.href);
          const bType = ENTITY_TYPES.find(t => ENTITY_REGISTRY[t].basePath === b.href);
          const aPriority = aType ? ENTITY_REGISTRY[aType].createPriority : 999;
          const bPriority = bType ? ENTITY_REGISTRY[bType].createPriority : 999;
          return aPriority - bPriority;
        }),
    });
  }

  // Group 4: Manage (Wallets, Assets, Loans)
  const manageEntities = ENTITY_TYPES.filter(
    type => ENTITY_REGISTRY[type].category === 'finance' || ENTITY_REGISTRY[type].category === 'gateway'
  );
  if (manageEntities.length > 0) {
    sections.push({
      id: 'manage',
      title: 'Manage',
      priority: 5,
      defaultExpanded: false, // Collapsed - progressive disclosure
      collapsible: true,
      requiresAuth: true,
      items: manageEntities
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
        .sort((a, b) => {
          const aType = ENTITY_TYPES.find(t => ENTITY_REGISTRY[t].basePath === a.href);
          const bType = ENTITY_TYPES.find(t => ENTITY_REGISTRY[t].basePath === b.href);
          const aPriority = aType ? ENTITY_REGISTRY[aType].createPriority : 999;
          const bPriority = bType ? ENTITY_REGISTRY[bType].createPriority : 999;
          return aPriority - bPriority;
        }),
    });
  }

  return sections.sort((a, b) => a.priority - b.priority);
}

/**
 * Get navigation item for a specific entity type
 */
export function getEntityNavigationItem(type: EntityType): NavigationItem | null {
  const entity = ENTITY_REGISTRY[type];
  if (!entity) {
    return null;
  }

  return {
    name: entity.namePlural,
    href: entity.basePath,
    icon: entity.icon as ComponentType<SVGProps<SVGSVGElement>>,
    description: entity.description,
    requiresAuth: true,
  };
}
