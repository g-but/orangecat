/**
 * Cat Response Parser
 *
 * Parses AI responses to extract embedded action blocks.
 * Actions are encoded as ```action JSON blocks in the response text.
 *
 * Created: 2026-02-09
 * Last Modified: 2026-02-19
 * Last Modified Summary: Added suggest_wallet action parsing
 */

import {
  CAT_CREATABLE_ENTITY_TYPES,
  type SuggestedAction,
  type UpdateEntityAction,
  type PublishEntityAction,
  type SuggestedWalletAction,
  type ExecAction,
  type CatAction,
} from '@/types/cat';
import { WALLET_CATEGORIES } from '@/types/wallet';

const VALID_WALLET_CATEGORIES = Object.keys(WALLET_CATEGORIES);
const VALID_BEHAVIOR_TYPES = ['general', 'recurring_budget', 'one_time_goal'];

export interface ParsedResponse {
  /** The response text with action blocks removed */
  message: string;
  /** Any valid action blocks found in the response */
  actions: CatAction[];
}

/**
 * Parse action blocks from AI response.
 * Actions are embedded as ```action or ```exec_action JSON blocks in the response content.
 * Supports: create_entity, update_entity, publish_entity, suggest_wallet, exec_action.
 * Invalid blocks (bad JSON, unknown types, missing required fields) are silently skipped.
 */
export function parseActionsFromResponse(content: string): ParsedResponse {
  const actions: CatAction[] = [];

  // Match ```action ... ``` and ```exec_action ... ``` blocks
  const actionBlockRegex = /```(?:action|exec_action)\s*([\s\S]*?)```/g;
  let match;
  let cleanedMessage = content;

  while ((match = actionBlockRegex.exec(content)) !== null) {
    try {
      const actionJson = match[1].trim();
      const raw = JSON.parse(actionJson);
      const entityTypes = CAT_CREATABLE_ENTITY_TYPES as readonly string[];

      if (
        raw.type === 'create_entity' &&
        entityTypes.includes(raw.entityType) &&
        raw.prefill?.title
      ) {
        actions.push(raw as SuggestedAction);
      } else if (
        raw.type === 'update_entity' &&
        entityTypes.includes(raw.entityType) &&
        raw.entityId &&
        raw.updates &&
        typeof raw.updates === 'object'
      ) {
        actions.push(raw as UpdateEntityAction);
      } else if (
        raw.type === 'publish_entity' &&
        entityTypes.includes(raw.entityType) &&
        raw.entityId
      ) {
        actions.push(raw as PublishEntityAction);
      } else if (raw.type === 'suggest_wallet' && raw.prefill?.label) {
        // Validate wallet-specific fields
        const wallet = raw as SuggestedWalletAction;
        if (wallet.prefill.category && !VALID_WALLET_CATEGORIES.includes(wallet.prefill.category)) {
          wallet.prefill.category = 'general';
        }
        if (
          wallet.prefill.behavior_type &&
          !VALID_BEHAVIOR_TYPES.includes(wallet.prefill.behavior_type)
        ) {
          wallet.prefill.behavior_type = 'general';
        }
        actions.push(wallet);
      } else if (
        raw.type === 'exec_action' &&
        typeof raw.actionId === 'string' &&
        raw.actionId.length > 0 &&
        raw.parameters &&
        typeof raw.parameters === 'object'
      ) {
        actions.push(raw as ExecAction);
      }
    } catch {
      // Invalid JSON, skip this block
    }

    // Remove the action block from the message
    cleanedMessage = cleanedMessage.replace(match[0], '').trim();
  }

  return { message: cleanedMessage, actions };
}
