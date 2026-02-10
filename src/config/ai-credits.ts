/**
 * AI Credits Configuration — SSOT
 *
 * Defines pricing tiers, operation costs, and limits for the AI credits system.
 * All amounts in satoshis.
 */

export const AI_CREDITS_CONFIG = {
  operations: {
    chat_message: { cost_sats: 10, label: 'Chat message' },
    document_analysis: { cost_sats: 50, label: 'Document analysis' },
    image_generation: { cost_sats: 100, label: 'Image generation' },
    code_generation: { cost_sats: 75, label: 'Code generation' },
    translation: { cost_sats: 25, label: 'Translation' },
    summarization: { cost_sats: 30, label: 'Summarization' },
  },
  tiers: {
    free: {
      label: 'Free',
      monthly_credits_sats: 1_000,
      price_sats: 0,
    },
    basic: {
      label: 'Basic',
      monthly_credits_sats: 10_000,
      price_sats: 5_000,
    },
    pro: {
      label: 'Pro',
      monthly_credits_sats: 100_000,
      price_sats: 25_000,
    },
  },
  deposit: {
    min_sats: 100,
    max_sats: 1_000_000_000,
  },
} as const;

export type AiOperation = keyof typeof AI_CREDITS_CONFIG.operations;
export type AiCreditTier = keyof typeof AI_CREDITS_CONFIG.tiers;
