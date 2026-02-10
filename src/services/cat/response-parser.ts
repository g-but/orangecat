/**
 * Cat Response Parser
 *
 * Parses AI responses to extract embedded action blocks.
 * Actions are encoded as ```action JSON blocks in the response text.
 *
 * Created: 2026-02-09
 * Last Modified: 2026-02-09
 * Last Modified Summary: Extracted from route.ts
 */

import { CAT_CREATABLE_ENTITY_TYPES, type SuggestedAction } from '@/types/cat';

export interface ParsedResponse {
  /** The response text with action blocks removed */
  message: string;
  /** Any valid action blocks found in the response */
  actions: SuggestedAction[];
}

/**
 * Parse action blocks from AI response.
 * Actions are embedded as ```action JSON blocks in the response content.
 * Invalid blocks (bad JSON, unknown entity types, missing title) are silently skipped.
 */
export function parseActionsFromResponse(content: string): ParsedResponse {
  const actions: SuggestedAction[] = [];

  // Match ```action ... ``` blocks
  const actionBlockRegex = /```action\s*([\s\S]*?)```/g;
  let match;
  let cleanedMessage = content;

  while ((match = actionBlockRegex.exec(content)) !== null) {
    try {
      const actionJson = match[1].trim();
      const action = JSON.parse(actionJson) as SuggestedAction;

      // Validate action structure using registry-derived entity types
      if (
        action.type === 'create_entity' &&
        (CAT_CREATABLE_ENTITY_TYPES as readonly string[]).includes(action.entityType) &&
        action.prefill?.title
      ) {
        actions.push(action);
      }
    } catch {
      // Invalid JSON, skip this block
    }

    // Remove the action block from the message
    cleanedMessage = cleanedMessage.replace(match[0], '').trim();
  }

  return { message: cleanedMessage, actions };
}
