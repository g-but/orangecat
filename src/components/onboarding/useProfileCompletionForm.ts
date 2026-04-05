'use client';

/**
 * Custom hook encapsulating all form state and logic for the profile completion modal.
 * Manages field values, validation, step navigation, and persistence.
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import type { Profile } from '@/types/database';

// --- Types ---

export interface StepConfig {
  id: string;
  title: string;
  subtitle: string;
  required: boolean;
}

export const STEPS: StepConfig[] = [
  {
    id: 'identity',
    title: "Let's get to know you",
    subtitle: 'Your Cat needs a name to call you by.',
    required: true,
  },
  {
    id: 'about',
    title: 'Tell the world a bit more',
    subtitle: 'Optional, but it helps your Cat represent you better.',
    required: false,
  },
  {
    id: 'getstarted',
    title: 'Nice! Your Cat now knows who you are.',
    subtitle: "Here's what you can do next.",
    required: false,
  },
];

export const TOTAL_STEPS = STEPS.length;

// --- Hook ---

export function useProfileCompletionForm(profile: Profile, onComplete: () => void) {
  const router = useRouter();
  const updateProfile = useAuthStore(state => state.updateProfile);

  // Navigation state
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Field state
  const [username, setUsername] = useState(profile.username || '');
  const [displayName, setDisplayName] = useState(
    profile.name && profile.name !== 'User' ? profile.name : ''
  );
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [locationCity, setLocationCity] = useState(profile.location_city || '');
  const [website, setWebsite] = useState(profile.website || '');

  // Derived
  const step = STEPS[currentStep];
  const isLastStep = currentStep === TOTAL_STEPS - 1;

  // Validate step 1 fields
  const validateIdentity = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!username || username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(username.trim())) {
      newErrors.username = 'Only letters, numbers, underscores, and hyphens';
    } else if (username.trim().length > 30) {
      newErrors.username = 'Username must be 30 characters or fewer';
    }

    if (!displayName || displayName.trim().length === 0) {
      newErrors.displayName = 'Your Cat needs something to call you';
    } else if (displayName.trim().length > 100) {
      newErrors.displayName = 'Display name must be 100 characters or fewer';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [username, displayName]);

  // Save current step data to profile
  const saveStepData = useCallback(async (): Promise<boolean> => {
    setSaving(true);
    setErrors({});

    try {
      const data: Partial<Profile> = {};

      if (currentStep === 0) {
        data.username = username.trim();
        data.name = displayName.trim();
        if (avatarUrl) {
          data.avatar_url = avatarUrl;
        }
      } else if (currentStep === 1) {
        // Always include username — the API schema requires it
        data.username = username.trim();
        data.name = displayName.trim();
        if (bio.trim()) {
          data.bio = bio.trim();
        }
        if (locationCity.trim()) {
          data.location_city = locationCity.trim();
        }
        if (website.trim()) {
          data.website = website.trim();
        }
      }

      if (Object.keys(data).length > 0) {
        const result = await updateProfile(data);
        if (result.error) {
          if (result.error.toLowerCase().includes('username')) {
            setErrors({ username: 'That username is already taken. Try another one.' });
          } else {
            setErrors({ general: result.error });
          }
          return false;
        }
      }

      return true;
    } catch {
      setErrors({ general: 'Something went wrong. Please try again.' });
      return false;
    } finally {
      setSaving(false);
    }
  }, [currentStep, username, displayName, avatarUrl, bio, locationCity, website, updateProfile]);

  // Navigation handlers
  const handleNext = useCallback(async () => {
    if (currentStep === 0 && !validateIdentity()) {
      return;
    }

    const saved = await saveStepData();
    if (saved) {
      setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS - 1));
    }
  }, [currentStep, validateIdentity, saveStepData]);

  const handlePrevious = useCallback(() => {
    setErrors({});
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const handleSkipStep = useCallback(() => {
    setErrors({});
    setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS - 1));
  }, []);

  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const handleQuickAction = useCallback(
    (href: string) => {
      onComplete();
      router.push(href);
    },
    [onComplete, router]
  );

  // Field change helpers that clear corresponding errors
  const setUsernameField = useCallback(
    (value: string) => {
      setUsername(value);
      if (errors.username) {
        setErrors(prev => ({ ...prev, username: '' }));
      }
    },
    [errors.username]
  );

  const setDisplayNameField = useCallback(
    (value: string) => {
      setDisplayName(value);
      if (errors.displayName) {
        setErrors(prev => ({ ...prev, displayName: '' }));
      }
    },
    [errors.displayName]
  );

  return {
    // State
    currentStep,
    step,
    isLastStep,
    saving,
    errors,

    // Field values
    username,
    displayName,
    avatarUrl,
    bio,
    locationCity,
    website,

    // Field setters
    setUsername: setUsernameField,
    setDisplayName: setDisplayNameField,
    setAvatarUrl,
    setBio,
    setLocationCity,
    setWebsite,

    // Navigation
    handleNext,
    handlePrevious,
    handleSkipStep,
    handleComplete,
    handleQuickAction,
  };
}
