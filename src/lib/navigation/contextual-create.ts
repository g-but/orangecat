/**
 * Contextual Create Action Mapper
 *
 * Maps current pathname to appropriate entity creation action.
 * Uses ENTITY_REGISTRY as single source of truth.
 *
 * Used by MobileBottomNav to determine what the "+" button should create
 * based on the user's current location in the app.
 */

import { ENTITY_REGISTRY, EntityType, EntityMetadata } from '@/config/entity-registry';

export type CreateActionType = 'post' | 'entity' | 'menu';

export interface ContextualCreateAction {
  /** Type of create action */
  type: CreateActionType;
  /** Entity type if type is 'entity' */
  entityType?: EntityType;
  /** URL to navigate to */
  href: string;
  /** Label for the action */
  label: string;
  /** Whether to open post composer (for 'post' type) */
  openComposer?: boolean;
}

/**
 * Route prefix to entity type mapping
 * Maps dashboard routes to their corresponding entity types
 * Built dynamically from ENTITY_REGISTRY for maintainability
 */
function buildRouteToEntityMap(): Map<string, EntityType> {
  const routeMap = new Map<string, EntityType>();

  // Build from entity registry (SSOT)
  for (const [entityType, metadata] of Object.entries(ENTITY_REGISTRY)) {
    routeMap.set(metadata.basePath, entityType as EntityType);
  }

  return routeMap;
}

const ROUTE_TO_ENTITY = buildRouteToEntityMap();

/**
 * Get contextual create action based on current pathname
 *
 * @param pathname - Current route pathname
 * @returns ContextualCreateAction with type, href, and label
 */
export function getContextualCreateAction(pathname: string): ContextualCreateAction {
  // Timeline/Dashboard home - create a post
  if (pathname === '/timeline' || pathname === '/dashboard') {
    return {
      type: 'post',
      href: '/timeline?compose=true',
      label: 'Post',
      openComposer: true,
    };
  }

  // Check if we're on an entity management page
  // Sort by path length (descending) to match most specific routes first
  const sortedRoutes = Array.from(ROUTE_TO_ENTITY.entries()).sort(
    (a, b) => b[0].length - a[0].length
  );

  for (const [route, entityType] of sortedRoutes) {
    if (pathname.startsWith(route)) {
      const metadata = ENTITY_REGISTRY[entityType];
      return {
        type: 'entity',
        entityType,
        href: metadata.createPath,
        label: metadata.name,
      };
    }
  }

  // Messages page - create a post (natural continuation of communication)
  if (pathname.startsWith('/messages')) {
    return {
      type: 'post',
      href: '/timeline?compose=true',
      label: 'Post',
      openComposer: true,
    };
  }

  // Profile pages - show menu (user might want to create various things)
  if (pathname.startsWith('/profiles/') || pathname === '/dashboard/info') {
    return {
      type: 'menu',
      href: '/timeline?compose=true',
      label: 'Create',
    };
  }

  // Public routes (Discover, Community, Home) - show menu with all options
  if (
    pathname === '/discover' ||
    pathname === '/community' ||
    pathname === '/' ||
    pathname.startsWith('/browse')
  ) {
    return {
      type: 'menu',
      href: '/timeline?compose=true',
      label: 'Create',
    };
  }

  // Default: show menu (safest option for unknown routes)
  return {
    type: 'menu',
    href: '/timeline?compose=true',
    label: 'Create',
  };
}

/**
 * Check if the + button should show a dropdown menu
 *
 * @param pathname - Current route pathname
 * @returns true if menu should be shown, false for direct action
 */
export function shouldShowCreateMenu(pathname: string): boolean {
  const action = getContextualCreateAction(pathname);
  return action.type === 'menu';
}

/**
 * Get the entity type for the current route (if applicable)
 *
 * @param pathname - Current route pathname
 * @returns EntityType if on an entity page, undefined otherwise
 */
export function getRouteEntityType(pathname: string): EntityType | undefined {
  const action = getContextualCreateAction(pathname);
  return action.entityType;
}

/**
 * Get tooltip text for the + button based on context
 *
 * @param pathname - Current route pathname
 * @returns Tooltip text describing what the + button will do
 */
export function getCreateButtonTooltip(pathname: string): string {
  const action = getContextualCreateAction(pathname);

  switch (action.type) {
    case 'post':
      return 'Create a new post';
    case 'entity':
      return `Create a new ${action.label.toLowerCase()}`;
    case 'menu':
      return 'Create something new';
  }
}
