/**
 * Premium Features Configuration — SSOT
 *
 * Defines feature tiers and feature flags for the premium/revenue system.
 * Config-only — no UI gating yet. Future "upgrade" prompts and feature gates
 * reference this file.
 *
 * All prices in satoshis.
 */

export const PREMIUM_TIERS = {
  free: {
    label: 'Free',
    price_sats: 0,
    period: null,
    features: ['basic_entities', 'community', 'my_cat_basic', 'basic_transparency', 'discover'],
  },
  pro: {
    label: 'Pro',
    price_sats: 50_000,
    period: 'month' as const,
    features: [
      'basic_entities',
      'unlimited_entities',
      'community',
      'my_cat_basic',
      'my_cat_pro',
      'analytics',
      'priority_support',
      'basic_transparency',
      'advanced_transparency',
      'discover',
      'custom_domain',
    ],
  },
} as const;

export const PREMIUM_FEATURES = {
  basic_entities: { label: 'Up to 5 active entities', tier: 'free' },
  unlimited_entities: { label: 'Unlimited active entities', tier: 'pro' },
  community: { label: 'Community access', tier: 'free' },
  my_cat_basic: { label: 'My Cat (basic AI chat)', tier: 'free' },
  my_cat_pro: { label: 'My Cat Pro (unlimited AI)', tier: 'pro' },
  analytics: { label: 'Advanced analytics', tier: 'pro' },
  priority_support: { label: 'Priority support', tier: 'pro' },
  basic_transparency: { label: 'Basic transparency score', tier: 'free' },
  advanced_transparency: { label: 'Detailed transparency reports', tier: 'pro' },
  discover: { label: 'Discover & search', tier: 'free' },
  custom_domain: { label: 'Custom domain for profile', tier: 'pro' },
} as const;

export type PremiumTier = keyof typeof PREMIUM_TIERS;
export type PremiumFeature = keyof typeof PREMIUM_FEATURES;
