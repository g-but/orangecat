/**
 * Project Support Types
 *
 * Type definitions for the project support system.
 * Supports multiple support types: Bitcoin donations, signatures, messages, reactions.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Created project support type definitions
 */

// Support type enum
export type SupportType = 'bitcoin_donation' | 'signature' | 'message' | 'reaction';

// Reaction emoji types
export type ReactionEmoji = '❤️' | '👍' | '🔥' | '🚀' | '💪' | '🎉' | '⭐' | '🙌';

// Base project support interface
export interface ProjectSupport {
  id: string;
  project_id: string;
  user_id: string | null;

  // Support type
  support_type: SupportType;

  // Bitcoin donation fields (if type = 'bitcoin_donation')
  amount_sats?: number | null;
  transaction_hash?: string | null;
  lightning_invoice?: string | null;

  // Signature/Message fields (if type = 'signature' or 'message')
  display_name?: string | null;
  message?: string | null;
  is_anonymous?: boolean;

  // Reaction field (if type = 'reaction')
  reaction_emoji?: ReactionEmoji | null;

  // Metadata
  created_at: string;
  updated_at: string;
}

// Project support with user profile (for display)
export interface ProjectSupportWithUser extends ProjectSupport {
  user?: {
    id: string;
    username: string | null;
    name: string | null;
    avatar_url: string | null;
  } | null;
}

// Project support stats
export interface ProjectSupportStats {
  project_id: string;
  total_bitcoin_sats: number;
  total_signatures: number;
  total_messages: number;
  total_reactions: number;
  total_supporters: number; // Unique users who supported
  last_support_at: string | null;
  updated_at: string;
}

// Request interfaces
export interface SupportProjectRequest {
  support_type: SupportType;

  // Bitcoin donation
  amount?: number;
  currency?: string;
  lightning_invoice?: string;
  transaction_hash?: string;

  // Signature/Message
  display_name?: string;
  message?: string;
  is_anonymous?: boolean;

  // Reaction
  reaction_emoji?: ReactionEmoji;
}

// Response interfaces
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

// Support filters
export interface SupportFilters {
  support_type?: SupportType;
  is_anonymous?: boolean;
  user_id?: string;
}

// Support pagination
export interface SupportPagination {
  page?: number;
  limit?: number;
  offset?: number;
}
