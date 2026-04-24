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
  | 'product'
  | 'service'
  | 'project'
  | 'cause'
  | 'event'
  | 'asset'
  | 'loan'
  | 'investment'
  | 'research'
  | 'wishlist'
  | 'group'
>;

/** All entity types Cat can create, as a runtime array for validation */
export const CAT_CREATABLE_ENTITY_TYPES: CatCreatableEntityType[] = [
  'product',
  'service',
  'project',
  'cause',
  'event',
  'asset',
  'loan',
  'investment',
  'research',
  'wishlist',
  'group',
];

/**
 * An action suggesting entity creation, embedded as ```action JSON blocks in AI responses.
 * title is required for most entity types; groups use `name` instead.
 * The response parser normalises name→title so the UI always has a label to display.
 */
export interface SuggestedAction {
  type: 'create_entity';
  entityType: CatCreatableEntityType;
  prefill: {
    title?: string;
    name?: string;
    description?: string;
    category?: string;
    [key: string]: unknown;
  };
}

/**
 * An action to update an existing entity.
 */
export interface UpdateEntityAction {
  type: 'update_entity';
  entityType: CatCreatableEntityType;
  entityId: string;
  updates: Record<string, unknown>;
}

/**
 * An action to publish (set status to active) a draft entity.
 */
export interface PublishEntityAction {
  type: 'publish_entity';
  entityType: CatCreatableEntityType;
  entityId: string;
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

/**
 * An action triggering a Cat executor action (send_payment, set_reminder, etc.)
 * Embedded as ```exec_action JSON blocks in AI responses.
 * Confirmation-required actions create a pending action record; the user approves via PendingActionsCard.
 * Auto-execute actions run immediately server-side.
 */
export interface ExecAction {
  type: 'exec_action';
  actionId: string;
  parameters: Record<string, unknown>;
}

/**
 * Result of a server-side exec_action execution, returned in the chat API response.
 * Completed: action ran successfully.
 * Pending: action queued for user confirmation (visible in PendingActionsCard).
 * Failed: action could not be executed.
 */
export interface ExecActionResult {
  actionId: string;
  status: 'completed' | 'pending_confirmation' | 'failed';
  data?: unknown;
  error?: string;
  pendingActionId?: string;
}

/** Union of all action types Cat can suggest or execute */
export type CatAction =
  | SuggestedAction
  | UpdateEntityAction
  | PublishEntityAction
  | SuggestedWalletAction
  | ExecAction;
