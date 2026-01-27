/**
 * MODERN CHAT PANEL TYPES
 * Shared types for the chat panel components
 */

export interface SuggestedAction {
  type: 'create_entity';
  entityType: 'product' | 'service' | 'project' | 'cause' | 'event';
  prefill: {
    title: string;
    description?: string;
    category?: string;
    [key: string]: unknown;
  };
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  modelUsed?: string;
  actions?: SuggestedAction[];
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
