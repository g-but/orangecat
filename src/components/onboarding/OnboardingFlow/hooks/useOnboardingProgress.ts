/**
 * ONBOARDING PROGRESS HOOK
 * Manages localStorage persistence and state for onboarding flow
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ProfileService } from '@/services/profile';
import { onboardingEvents } from '@/lib/analytics';
import { logger } from '@/utils/logger';
import { ONBOARDING_STORAGE_KEY, PROGRESS_EXPIRATION_HOURS, ONBOARDING_METHOD } from '../constants';
import type {
  OnboardingProgress,
  OnboardingStep,
  OnboardingState,
  OnboardingActions,
} from '../types';

/**
 * Load onboarding progress from localStorage
 */
function loadProgress(): OnboardingProgress | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const saved = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (saved) {
      const progress = JSON.parse(saved) as OnboardingProgress;
      // Check if progress is less than expiration time
      const lastUpdated = new Date(progress.lastUpdated);
      const hoursSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);
      if (hoursSinceUpdate < PROGRESS_EXPIRATION_HOURS) {
        return progress;
      }
    }
  } catch (error) {
    logger.error('Failed to load onboarding progress', error, 'Onboarding');
  }
  return null;
}

/**
 * Save onboarding progress to localStorage
 */
function saveProgress(currentStep: number, completedSteps: Set<number>): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const progress: OnboardingProgress = {
      currentStep,
      completedSteps: Array.from(completedSteps),
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    logger.error('Failed to save onboarding progress', error, 'Onboarding');
  }
}

/**
 * Clear onboarding progress from localStorage
 */
function clearProgress(): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  } catch (error) {
    logger.error('Failed to clear onboarding progress', error, 'Onboarding');
  }
}

export function useOnboardingProgress(
  steps: OnboardingStep[],
  userId?: string
): OnboardingState & OnboardingActions {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [completingOnboarding, setCompletingOnboarding] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  // Load saved progress on mount
  useEffect(() => {
    const savedProgress = loadProgress();
    if (savedProgress) {
      setCurrentStep(savedProgress.currentStep);
      setCompletedSteps(new Set(savedProgress.completedSteps));
    }
    setIsInitialized(true);
    // Track onboarding start when component mounts
    onboardingEvents.started(userId);
  }, [userId]);

  // Save progress whenever it changes
  useEffect(() => {
    if (isInitialized) {
      saveProgress(currentStep, completedSteps);
    }
  }, [currentStep, completedSteps, isInitialized]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      // Track step completion
      onboardingEvents.stepCompleted(currentStep, steps[currentStep].id, userId);
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(currentStep + 1);
      // Track viewing next step
      onboardingEvents.stepViewed(currentStep + 1, steps[currentStep + 1].id, userId);
    }
  }, [currentStep, steps, userId]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(async () => {
    onboardingEvents.skipped(currentStep, userId);

    // Clear saved progress since user is skipping
    clearProgress();

    // Mark onboarding as completed (skipped) so user doesn't see it again
    if (userId) {
      try {
        await ProfileService.fallbackProfileUpdate(userId, {
          onboarding_completed: true,
          onboarding_method: ONBOARDING_METHOD.SKIPPED,
        });
      } catch (error) {
        logger.error('Failed to mark onboarding as skipped', error, 'Onboarding');
        // Continue anyway - analytics event was sent
      }
    }

    router.push('/dashboard?welcome=true');
  }, [currentStep, userId, router]);

  const handleAction = useCallback(
    (href: string) => {
      onboardingEvents.stepCompleted(currentStep, steps[currentStep].id, userId);
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      router.push(href);
    },
    [currentStep, steps, userId, router]
  );

  const handleCompleteOnboarding = useCallback(async () => {
    // Clear saved progress since onboarding is complete
    clearProgress();

    if (!userId) {
      router.push('/dashboard?welcome=true');
      return;
    }

    setCompletingOnboarding(true);
    try {
      await ProfileService.fallbackProfileUpdate(userId, {
        onboarding_completed: true,
        onboarding_method: ONBOARDING_METHOD.STANDARD,
      });
      onboardingEvents.completed(userId);
      toast.success('Welcome to OrangeCat! Your journey begins now.');
      router.push('/dashboard?welcome=true');
    } catch (error) {
      logger.error('Failed to complete onboarding', error, 'Onboarding');
      // Still mark as completed in analytics - the user tried
      onboardingEvents.completed(userId);
      toast.error('Something went wrong, but you can continue to your dashboard.');
      router.push('/dashboard?welcome=true');
    } finally {
      setCompletingOnboarding(false);
    }
  }, [userId, router]);

  return {
    currentStep,
    completedSteps,
    completingOnboarding,
    isInitialized,
    handleNext,
    handlePrevious,
    handleSkip,
    handleAction,
    handleCompleteOnboarding,
    setCurrentStep,
  };
}
