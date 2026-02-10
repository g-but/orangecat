/**
 * Cat (AI Chat) Types
 *
 * Shared types for the My Cat AI assistant feature.
 * SuggestedAction is used by both the API route and the chat UI components.
 *
 * Created: 2026-02-09
 * Last Modified: 2026-02-09
 * Last Modified Summary: Extracted from route.ts and ModernChatPanel/types.ts to create SSOT
 */

import type { EntityType } from '@/config/entity-registry';

/**
 * Entity types that Cat can suggest creating.
 * Subset of the full EntityType from the entity registry.
 */
export type CatCreatableEntityType = Extract<
  EntityType,
  'product' | 'service' | 'project' | 'cause' | 'event' | 'asset'
>;

/** All entity types Cat can create, as a runtime array for validation */
export const CAT_CREATABLE_ENTITY_TYPES: CatCreatableEntityType[] = [
  'product',
  'service',
  'project',
  'cause',
  'event',
  'asset',
];

/**
 * An action suggested by Cat, embedded as ```action JSON blocks in AI responses.
 * Currently only supports entity creation.
 */
export interface SuggestedAction {
  type: 'create_entity';
  entityType: CatCreatableEntityType;
  prefill: {
    title: string;
    description?: string;
    category?: string;
    [key: string]: unknown;
  };
}
