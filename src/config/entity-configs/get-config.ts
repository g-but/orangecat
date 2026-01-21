/**
 * Dynamic Entity Config Loader
 *
 * Provides a way to get entity configurations by type at runtime.
 * Used by AI form prefill and other dynamic features.
 *
 * Created: 2025-01-20
 */

import type { EntityType } from '@/config/entity-registry';
import type { EntityConfig } from '@/components/create/types';

import { productConfig } from './product-config';
import { serviceConfig } from './service-config';
import { causeConfig } from './cause-config';
import { loanConfig } from './loan-config';
import { assetConfig } from './asset-config';
import { projectConfig } from './project-config';
import { aiAssistantConfig } from './ai-assistant-config';
import { eventConfig } from './event-config';
import { groupConfig } from './group-config';
import { wishlistConfig } from './wishlist-config';

/**
 * Map of entity types to their configurations
 *
 * Note: Only includes entity types that are defined in ENTITY_TYPES
 * from entity-registry.ts. Some configs (circle, organization) exist
 * but their entity types are not in the registry.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ENTITY_CONFIGS: Partial<Record<EntityType, EntityConfig<any>>> = {
  product: productConfig,
  service: serviceConfig,
  cause: causeConfig,
  loan: loanConfig,
  asset: assetConfig,
  project: projectConfig,
  ai_assistant: aiAssistantConfig,
  event: eventConfig,
  group: groupConfig,
  wishlist: wishlistConfig,
  // Note: 'wallet' and 'research' don't have form configs as they use different flows
};

/**
 * Get entity configuration by type
 *
 * @param entityType - The entity type to get config for
 * @returns The entity configuration or null if not found
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getEntityConfig(entityType: EntityType): EntityConfig<any> | null {
  return ENTITY_CONFIGS[entityType] || null;
}

/**
 * Get all available entity types that have configurations
 */
export function getConfiguredEntityTypes(): EntityType[] {
  return Object.keys(ENTITY_CONFIGS) as EntityType[];
}
