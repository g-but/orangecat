/**
 * Cat Conversation History Service
 *
 * Manages persistent chat history for My Cat AI.
 * Each user has a default conversation that accumulates across sessions.
 *
 * Design:
 * - One default conversation per user
 * - Last N messages injected into LLM context for continuity
 * - Messages saved after each exchange (non-blocking on the response path)
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from '@supabase/supabase-js';

// Type alias that accepts any typed Supabase client (avoids schema mismatch errors)
type AnySupabaseClient = SupabaseClient<any, any, any>;

/** Max messages to inject into LLM context (10 turns = 20 messages) */
const HISTORY_INJECTION_LIMIT = 20;

/** Max messages to return for UI history display */
const HISTORY_DISPLAY_LIMIT = 50;

export interface StoredMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model_used?: string | null;
  provider?: string | null;
  token_count?: number | null;
  created_at: string;
}

/**
 * Gets or creates the user's default conversation.
 * Returns the conversation ID.
 */
export async function getOrCreateDefaultConversation(
  supabase: AnySupabaseClient,
  userId: string
): Promise<string> {
  // Try to get existing default conversation
  const { data: existing } = await supabase
    .from('cat_conversations')
    .select('id')
    .eq('user_id', userId)
    .eq('is_default', true)
    .single();

  if (existing) {
    return existing.id;
  }

  // Create new default conversation
  const { data: created, error } = await supabase
    .from('cat_conversations')
    .insert({ user_id: userId, is_default: true })
    .select('id')
    .single();

  if (error || !created) {
    throw new Error(`Failed to create conversation: ${error?.message}`);
  }

  return created.id;
}

/**
 * Saves a batch of messages to a conversation.
 * Used to save user + assistant message pair after each exchange.
 */
export async function saveMessages(
  supabase: AnySupabaseClient,
  conversationId: string,
  userId: string,
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    model_used?: string;
    provider?: string;
    token_count?: number;
  }>
): Promise<void> {
  const rows = messages.map(m => ({
    conversation_id: conversationId,
    user_id: userId,
    role: m.role,
    content: m.content,
    model_used: m.model_used ?? null,
    provider: m.provider ?? null,
    token_count: m.token_count ?? null,
  }));

  await supabase.from('cat_messages').insert(rows);
  // Ignore errors — history is best-effort, never blocks responses
}

/**
 * Fetches recent messages for LLM context injection.
 * Returns messages in chronological order (oldest first).
 */
export async function getMessagesForContext(
  supabase: AnySupabaseClient,
  userId: string,
  limit: number = HISTORY_INJECTION_LIMIT
): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  const conversationId = await getDefaultConversationId(supabase, userId);
  if (!conversationId) {
    return [];
  }

  const { data } = await supabase
    .from('cat_messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!data?.length) {
    return [];
  }

  // Reverse to get chronological order for LLM
  return (data as Array<{ role: 'user' | 'assistant'; content: string }>).reverse();
}

/**
 * Fetches recent messages for UI display.
 * Returns in chronological order with full metadata.
 */
export async function getMessagesForDisplay(
  supabase: AnySupabaseClient,
  userId: string,
  limit: number = HISTORY_DISPLAY_LIMIT
): Promise<StoredMessage[]> {
  const conversationId = await getDefaultConversationId(supabase, userId);
  if (!conversationId) {
    return [];
  }

  const { data } = await supabase
    .from('cat_messages')
    .select('id, role, content, model_used, provider, token_count, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!data?.length) {
    return [];
  }

  return (data as StoredMessage[]).reverse();
}

/**
 * Deletes all messages in the user's default conversation (clear chat).
 */
export async function clearDefaultConversation(
  supabase: AnySupabaseClient,
  userId: string
): Promise<void> {
  const conversationId = await getDefaultConversationId(supabase, userId);
  if (!conversationId) {
    return;
  }

  await supabase.from('cat_messages').delete().eq('conversation_id', conversationId);
}

// ─── Internal helpers ───────────────────────────────────────────────────────

async function getDefaultConversationId(
  supabase: AnySupabaseClient,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('cat_conversations')
    .select('id')
    .eq('user_id', userId)
    .eq('is_default', true)
    .single();

  return data?.id ?? null;
}
