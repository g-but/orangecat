/**
 * Project Support Types
 *
 * Type definitions for the project support system.
 * Supports multiple support types: Bitcoin funding, signatures, messages, reactions.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Created project support type definitions
 */

import type { Database } from '@/types/database';

// Support type — the Postgres enum `support_type` is the SSOT
export type SupportType = Database['public']['Enums']['support_type'];

// Reaction emoji types (internal to support package)
type ReactionEmoji = '❤️' | '👍' | '🔥' | '🚀' | '💪' | '🎉' | '⭐' | '🙌';

// Base project support interface
export interface ProjectSupport {
  id: string;
  project_id: string;
  user_id: string | null;

  support_type: SupportType;

  amount_btc?: number | null;
  transaction_hash?: string | null;
  lightning_invoice?: string | null;

  display_name?: string | null;
  message?: string | null;
  is_anonymous?: boolean;

  reaction_emoji?: ReactionEmoji | null;

  created_at: string;
  updated_at: string;
}

export interface ProjectSupportWithUser extends ProjectSupport {
  user?: {
    id: string;
    username: string | null;
    name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface ProjectSupportStats {
  project_id: string;
  total_bitcoin_btc: number;
  total_signatures: number;
  total_messages: number;
  total_reactions: number;
  total_supporters: number;
  last_support_at: string | null;
  updated_at: string;
}

export interface SupportProjectRequest {
  support_type: SupportType;
  amount?: number;
  currency?: string;
  lightning_invoice?: string;
  transaction_hash?: string;
  display_name?: string;
  message?: string;
  is_anonymous?: boolean;
  reaction_emoji?: ReactionEmoji;
}

export interface ProjectSupportResponse {
  supports: ProjectSupportWithUser[];
  stats: ProjectSupportStats;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
}

export interface SupportProjectResponse {
  success: boolean;
  support?: ProjectSupport;
  error?: string;
}

export interface SupportFilters {
  support_type?: SupportType;
  is_anonymous?: boolean;
  user_id?: string;
}

export interface SupportPagination {
  page?: number;
  limit?: number;
  offset?: number;
}
