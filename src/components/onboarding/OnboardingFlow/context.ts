/**
 * ONBOARDING CONTEXT
 *
 * Provides `onNavigateAway` so step components can leave onboarding
 * while ensuring `onboarding_completed` is persisted first.
 */

import { createContext, useContext } from 'react';

export interface OnboardingContextValue {
  /** Mark onboarding complete and navigate to the given href */
  onNavigateAway: (href: string) => void;
}

export const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboardingContext(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboardingContext must be used within OnboardingFlow');
  }
  return ctx;
}
