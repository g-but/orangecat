/**
 * Cat prompt preparation — the ONE place a chat exchange's message array is
 * assembled (context fetch + memory recall + custom instructions + system
 * prompt + history). Shared by:
 *   - the server chat pipeline (/api/cat/chat), which follows it with a
 *     provider call, and
 *   - /api/cat/prepare, which returns the prepared messages to the browser
 *     so a LOCAL model (Ollama / LM Studio on the user's machine) answers
 *     with exactly the same brain — same context, same memories, same page
 *     awareness — just different inference hardware.
 */

import { buildCatSystemPrompt } from '@/services/cat/system-prompt';
import { getCustomInstructions } from '@/services/cat/custom-instructions';
import { buildReplyLanguageDirective } from '@/services/cat/reply-language';
import { getCatFewShotExamplesText } from '@/services/cat/few-shot-examples';
import {
  resolveConversationIdOrDefault,
  getMessagesForContext,
} from '@/services/cat/conversation-history';
import { recallMemories } from '@/services/cat/memory';
import { fetchFullContextForCat, buildFullContextString } from '@/services/ai/document-context';
import type { AnySupabaseClient } from '@/lib/supabase/types';

export interface CatChatPrepareOpts {
  message: string;
  requestedConversationId?: string;
  preferredCurrency?: string;
  locale?: string;
  lastVisitedPath?: string;
  currentPath?: string;
  currentEntity?: { type: string; ref: string };
  pageExcerpt?: string;
}

export interface PreparedCatChat {
  systemPrompt: string;
  /** system + history + the user's message — ready for any chat-completions API. */
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  conversationId: string | null;
}

export async function prepareCatChat(
  supabase: AnySupabaseClient,
  userId: string,
  opts: CatChatPrepareOpts
): Promise<PreparedCatChat> {
  const { message, requestedConversationId, ...hints } = opts;

  // Memory recall (an embedding round-trip + pgvector query) is INDEPENDENT
  // of the context fetch, so run all three concurrently — recall just has to
  // beat the (already parallel) context fetchers. Recall is best-effort: []
  // if memory is unavailable.
  const [userContext, memories, customInstructions] = await Promise.all([
    fetchFullContextForCat(supabase, userId, hints),
    recallMemories(supabase, userId, message),
    getCustomInstructions(supabase, userId),
  ]);
  userContext.memories = memories;
  const contextString = buildFullContextString(userContext);

  // Examples are appended as labeled text (not injected as fake conversation
  // turns) so weaker models can't mistake the example people for the real
  // user. The per-turn reply-language directive goes DEAD LAST: weak models
  // weight the prompt tail most, and burying the language rule mid-prompt
  // let them default to the browser locale's language.
  const systemPrompt = `${buildCatSystemPrompt({ userContext: contextString || undefined, customInstructions })}\n\n${getCatFewShotExamplesText()}${buildReplyLanguageDirective(message)}`;

  let conversationId: string | null = null;
  let historyMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  try {
    conversationId = await resolveConversationIdOrDefault(
      supabase,
      userId,
      requestedConversationId
    );
    historyMessages = await getMessagesForContext(supabase, userId, conversationId);
  } catch {
    /* Non-fatal — continue without history */
  }

  return {
    systemPrompt,
    messages: [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
      { role: 'user', content: message },
    ],
    conversationId,
  };
}
