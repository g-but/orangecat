/**
 * Timeline Service Internal Types
 *
 * Typed interfaces for Supabase RPC responses and internal data structures
 * used across timeline service modules. Keeps `as any` out of business logic.
 *
 * Created: 2026-03-31
 * Last Modified: 2026-03-31
 * Last Modified Summary: Initial creation to eliminate as-any casts in timeline service
 */

// ==================== RPC Response Types ====================

/** Response from like_timeline_event / unlike_timeline_event RPCs */
export interface LikeRpcResponse {
  like_count: number;
}

/** Response from dislike_timeline_event / undislike_timeline_event RPCs */
export interface DislikeRpcResponse {
  dislike_count: number;
}

/** Response from add_timeline_comment RPC */
export interface AddCommentRpcResponse {
  comment_id: string;
  comment_count: number;
}

/** Response from create_post_with_visibility RPC */
export interface CreatePostWithVisibilityRpcResponse {
  success?: boolean;
  post_id?: string;
  id?: string;
  error?: string;
  visibility_count?: number;
  data?: {
    post_id?: string;
  };
}

// ==================== Fallback Query Row Types ====================

/** Row shape from timeline_comments table (select subset) */
export interface TimelineCommentRow {
  id: string;
  event_id: string;
  user_id: string;
  content: string;
  created_at: string;
  parent_comment_id: string | null;
}

/** Row shape from profiles table (select subset for comment enrichment) */
export interface ProfileRow {
  id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
}

/** Enriched comment returned from getEventComments / getCommentReplies */
export interface EnrichedComment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user_name: string;
  user_username: string | null;
  user_avatar: string | null;
  reply_count: number;
}

// ==================== Database Row Types for Mutations ====================

/** Row shape from user_projects table (select subset for project events) */
export interface ProjectRow {
  title: string;
  description: string | null;
  goal_amount?: number;
  currency?: string;
}

/** Row shape from transactions table */
export interface TransactionRow {
  id: string;
  [key: string]: unknown;
}

/** Row shape from profiles table (select subset for transaction events) */
export interface DonorProfileRow {
  username: string | null;
  display_name: string | null;
}

// ==================== Update Payload Types ====================

/** Shape of event update payload sent to Supabase */
export interface TimelineEventUpdatePayload {
  title?: string;
  description?: string;
  visibility?: string;
  metadata?: Record<string, unknown>;
  updated_at: string;
}

// ==================== Typed RPC Helper ====================

/**
 * Helper to call a Supabase RPC that isn't in the generated types.
 * Casts supabase.rpc once, returning a typed result.
 *
 * Usage:
 *   const { data, error } = await callRpc<LikeRpcResponse>(supabase, 'like_timeline_event', params);
 */
export async function callRpc<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: { rpc: any },
  fnName: string,
  params: Record<string, unknown>
): Promise<{ data: T | null; error: { message: string } | null }> {
  return client.rpc(fnName, params) as Promise<{
    data: T | null;
    error: { message: string } | null;
  }>;
}

/**
 * Helper to query a Supabase table that isn't in the generated types.
 * Returns a typed query builder. Caller chains .select(), .eq(), etc.
 *
 * Usage:
 *   const { data, error } = await queryTable(supabase, tableName).select('*').eq('id', id).single();
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function queryTable(client: { from: any }, tableName: string): any {
  return client.from(tableName);
}
