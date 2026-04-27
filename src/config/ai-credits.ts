/**
 * AI Credits Configuration — SSOT
 *
 * Defines pricing tiers, operation costs, and limits for the AI credits system.
 * All amounts in BTC (NUMERIC(18,8) in DB).
 */

export const AI_CREDITS_CONFIG = {
  operations: {
    chat_message: { cost_btc: 0.0000001, label: 'Chat message' },
    document_analysis: { cost_btc: 0.0000005, label: 'Document analysis' },
    image_generation: { cost_btc: 0.000001, label: 'Image generation' },
    code_generation: { cost_btc: 0.00000075, label: 'Code generation' },
    translation: { cost_btc: 0.00000025, label: 'Translation' },
    summarization: { cost_btc: 0.0000003, label: 'Summarization' },
  },
  tiers: {
    free: {
      label: 'Free',
      monthly_credits_btc: 0.00001,
      price_btc: 0,
    },
    basic: {
      label: 'Basic',
      monthly_credits_btc: 0.0001,
      price_btc: 0.00005,
    },
    pro: {
      label: 'Pro',
      monthly_credits_btc: 0.001,
      price_btc: 0.00025,
    },
  },
  deposit: {
    min_btc: 0.000001,
    max_btc: 10,
  },
} as const;

/** Quick-pick preset amounts (in satoshis) shown in deposit/withdrawal dialogs */
export const QUICK_AMOUNT_PRESETS_SATS = [1000, 5000, 10000, 50000] as const;

export type AiOperation = keyof typeof AI_CREDITS_CONFIG.operations;
export type AiCreditTier = keyof typeof AI_CREDITS_CONFIG.tiers;
