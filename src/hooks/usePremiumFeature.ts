import {
  PREMIUM_FEATURES,
  PREMIUM_TIERS,
  type PremiumFeature,
  type PremiumTier,
} from '@/config/premium';

interface PremiumFeatureResult {
  /** Whether the user has access to this feature */
  hasAccess: boolean;
  /** The minimum tier required for this feature */
  requiredTier: PremiumTier;
  /** Human-readable label for the feature */
  featureLabel: string;
  /** The user's current tier */
  currentTier: PremiumTier;
}

/**
 * Check whether the current user has access to a premium feature.
 *
 * Currently all users are on the free tier (no billing yet).
 * When billing is implemented, this hook will read the user's tier from
 * profile/subscription data and check against PREMIUM_CONFIG.
 */
export function usePremiumFeature(feature: PremiumFeature): PremiumFeatureResult {
  // TODO: Read actual user tier from auth/profile when billing is implemented
  const currentTier: PremiumTier = 'free';

  const featureDef = PREMIUM_FEATURES[feature];
  const requiredTier = featureDef.tier as PremiumTier;

  const tierOrder: PremiumTier[] = ['free', 'pro'];
  const currentIndex = tierOrder.indexOf(currentTier);
  const requiredIndex = tierOrder.indexOf(requiredTier);

  return {
    hasAccess: currentIndex >= requiredIndex,
    requiredTier,
    featureLabel: featureDef.label,
    currentTier,
  };
}

/**
 * Get the full tier details for upgrade prompt display.
 */
export function getPremiumTierDetails(tier: PremiumTier) {
  return PREMIUM_TIERS[tier];
}
