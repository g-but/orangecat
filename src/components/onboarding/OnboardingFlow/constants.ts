/**
 * ONBOARDING FLOW CONSTANTS
 * Single Source of Truth for onboarding-related constants
 */

export const ONBOARDING_STORAGE_KEY = 'orangecat_onboarding_progress';

// Progress expiration time in hours
export const PROGRESS_EXPIRATION_HOURS = 24;

/**
 * Onboarding completion methods
 * Used for tracking how users complete onboarding
 */
export const ONBOARDING_METHOD = {
  STANDARD: 'standard',
  INTELLIGENT: 'intelligent',
  SKIPPED: 'skipped',
} as const;

export type OnboardingMethod = (typeof ONBOARDING_METHOD)[keyof typeof ONBOARDING_METHOD];
