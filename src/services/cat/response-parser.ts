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
  type SuggestedWalletAction,
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
 * Actions are embedded as ```action JSON blocks in the response content.
 * Supports both create_entity and suggest_wallet actions.
 * Invalid blocks (bad JSON, unknown types, missing required fields) are silently skipped.
 */
export function parseActionsFromResponse(content: string): ParsedResponse {
  const actions: CatAction[] = [];

  // Match ```action ... ``` blocks
  const actionBlockRegex = /```action\s*([\s\S]*?)```/g;
  let match;
  let cleanedMessage = content;

  while ((match = actionBlockRegex.exec(content)) !== null) {
    try {
      const actionJson = match[1].trim();
      const raw = JSON.parse(actionJson);

      if (
        raw.type === 'create_entity' &&
        (CAT_CREATABLE_ENTITY_TYPES as readonly string[]).includes(raw.entityType) &&
        raw.prefill?.title
      ) {
        actions.push(raw as SuggestedAction);
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
      }
    } catch {
      // Invalid JSON, skip this block
    }

    // Remove the action block from the message
    cleanedMessage = cleanedMessage.replace(match[0], '').trim();
  }

  return { message: cleanedMessage, actions };
}
