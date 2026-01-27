/**
 * CAT CHAT PANEL TYPES
 * Shared types for the legacy chat panel components
 */

export type Role = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  created_at: string;
}

export interface UserStatus {
  hasByok: boolean;
  freeMessagesPerDay: number;
  freeMessagesRemaining: number;
}

export interface LocalProviderConfig {
  enabled: boolean;
  provider: 'ollama' | 'openai_compatible';
  baseUrl: string;
  model: string;
}

export interface EntitySuggestion {
  type: 'service' | 'product' | 'project';
  label: string;
  action: () => void;
}
