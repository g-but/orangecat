/**
 * Project Support Constants
 *
 * Constants for the project support system.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Created project support constants
 */

// Default pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Support type labels
export const SUPPORT_TYPE_LABELS: Record<string, string> = {
  bitcoin_donation: 'Bitcoin Donation',
  signature: 'Signature',
  message: 'Message',
  reaction: 'Reaction',
};

// Reaction emoji options
export const REACTION_EMOJIS = ['❤️', '👍', '🔥', '🚀', '💪', '🎉', '⭐', '🙌'] as const;

// Reaction emoji labels
export const REACTION_LABELS: Record<string, string> = {
  '❤️': 'Love',
  '👍': 'Thumbs Up',
  '🔥': 'Fire',
  '🚀': 'Rocket',
  '💪': 'Strong',
  '🎉': 'Celebrate',
  '⭐': 'Star',
  '🙌': 'Praise',
};

// Support type descriptions
export const SUPPORT_TYPE_DESCRIPTIONS: Record<string, string> = {
  bitcoin_donation: 'Contribute Bitcoin to support this project',
  signature: 'Sign your name to show you support this project',
  message: 'Leave a message of encouragement or congratulations',
  reaction: 'Quick reaction to show your support',
};


