/**
 * Cat (AI Chat) Types
 *
 * Shared types for the My Cat AI assistant feature.
 * SuggestedAction and SuggestedWalletAction are used by both the API route
 * and the chat UI components.
 *
 * Created: 2026-02-09
 * Last Modified: 2026-02-19
 * Last Modified Summary: Added SuggestedWalletAction and CatAction union type
 */

import type { EntityType } from '@/config/entity-registry';
import type { WalletBehaviorType, WalletCategory, BudgetPeriod } from '@/types/wallet';

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
 * An action suggesting entity creation, embedded as ```action JSON blocks in AI responses.
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

/**
 * An action suggesting wallet creation, embedded as ```action JSON blocks in AI responses.
 */
export interface SuggestedWalletAction {
  type: 'suggest_wallet';
  prefill: {
    label: string;
    description?: string;
    category?: WalletCategory;
    behavior_type?: WalletBehaviorType;
    goal_amount?: number;
    goal_currency?: string;
    goal_deadline?: string;
    budget_amount?: number;
    budget_period?: BudgetPeriod;
  };
}

/** Union of all action types Cat can suggest */
export type CatAction = SuggestedAction | SuggestedWalletAction;
