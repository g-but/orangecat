/**
 * MODERN CHAT PANEL TYPES
 * Shared types for the chat panel components
 */

// SSOT shared types from @/types/cat
import type { SuggestedAction, SuggestedWalletAction, CatAction } from '@/types/cat';
export type { SuggestedAction, SuggestedWalletAction, CatAction };

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  modelUsed?: string;
  actions?: CatAction[];
}

export interface UserStatus {
  hasByok: boolean;
  freeMessagesPerDay: number;
  freeMessagesRemaining: number;
}

export interface PendingAction {
  id: string;
  actionId: string;
  category: string;
  parameters: Record<string, unknown>;
  description: string;
  expiresAt: string;
}
