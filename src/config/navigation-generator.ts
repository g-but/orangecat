/**
 * Navigation Generator — SSOT for entity-driven navigation.
 *
 * Every entity type in the registry reaches the sidebar through this file and
 * nowhere else. Hand-placing an entity into a hand-written section instead is
 * how the primary nav grows without anyone deciding it should (Documents sat
 * above Home that way) — so the rule is: one group per entity, no exceptions.
 *
 * Created: 2025-01-30
 * Last Modified: 2026-08-02
 * Last Modified Summary: deduped four identical section builders; folded
 *   Documents back into the generated Create group; deleted the dead
 *   _CATEGORY_TO_SECTION map that described a long-gone IA.
 */

import { ComponentType, SVGProps } from 'react';
import { ENTITY_REGISTRY, ENTITY_TYPES, type EntityType } from './entity-registry';
import type { NavSection, NavigationItem } from './navigation';

/**
 * Entity groupings for semantic navigation sections.
 *
 * CREATE: things you make or offer.
 * FUND: things that need funding or support.
 * COORDINATE: people and shared structures.
 * FINANCE: money and the things money is held in.
 *
 * Membership is exhaustive — see the coverage test in
 * __tests__/unit/config/navigation-generator.test.ts, which fails if a new
 * entity type is added to the registry without being placed in a group.
 */
const ENTITY_GROUPS: ReadonlyArray<{
  id: string;
  title: string;
  priority: number;
  types: readonly EntityType[];
}> = [
  {
    id: 'create',
    title: 'Create',
    priority: 2,
    types: ['product', 'service', 'ai_assistant', 'document'],
  },
  { id: 'fund', title: 'Fund', priority: 3, types: ['project', 'cause', 'research', 'wishlist'] },
  { id: 'coordinate', title: 'Coordinate', priority: 4, types: ['group', 'circle', 'event'] },
  { id: 'finance', title: 'Finance', priority: 5, types: ['wallet', 'asset', 'loan', 'investment'] },
] as const;

/** Every entity type that any group claims — the coverage test reads this. */
export const GROUPED_ENTITY_TYPES: readonly EntityType[] = ENTITY_GROUPS.flatMap(g => [...g.types]);

function toNavigationItem(type: EntityType): NavigationItem {
  const entity = ENTITY_REGISTRY[type];
  return {
    name: entity.namePlural,
    href: entity.basePath,
    icon: entity.icon as ComponentType<SVGProps<SVGSVGElement>>,
    description: entity.description,
    requiresAuth: true,
  };
}

/**
 * Generate navigation sections from the entity registry.
 *
 * All groups are collapsed by default (progressive disclosure): the sidebar
 * opens showing primary destinations, and the 15 entity types stay one click
 * away instead of filling the viewport.
 */
export function generateEntityNavigation(): NavSection[] {
  return ENTITY_GROUPS.map(({ id, title, priority, types }) => ({
    id,
    title,
    priority,
    defaultExpanded: false,
    collapsible: true,
    requiresAuth: true,
    items: types
      .filter(type => ENTITY_TYPES.includes(type))
      .map(toNavigationItem)
      .sort((a, b) => createPriorityOf(a) - createPriorityOf(b)),
  })).sort((a, b) => a.priority - b.priority);
}

function createPriorityOf(item: NavigationItem): number {
  const type = ENTITY_TYPES.find(t => ENTITY_REGISTRY[t].basePath === item.href);
  return type ? ENTITY_REGISTRY[type].createPriority : 999;
}
