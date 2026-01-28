'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAISettings } from '@/hooks/useAISettings';
import Loading from '@/components/Loading';
import { AIOnboarding } from '@/components/ai/AIOnboarding';
import { logger } from '@/utils/logger';

export default function AIOnboardingPage() {
  const { user, hydrated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const {
    addKey,
    updatePreferences,
    completeOnboarding,
    isLoading: _settingsLoading,
  } = useAISettings();

  // Show loading state while hydrating
  if (!hydrated || authLoading) {
    return <Loading fullScreen />;
  }

  // Redirect if not authenticated
  if (!user) {
    router.push('/auth');
    return <Loading fullScreen />;
  }

  const handleComplete = async () => {
    try {
      await completeOnboarding();
    } catch (error) {
      logger.error('Failed to complete onboarding', error, 'AI');
    }
  };

  return (
    <AIOnboarding
      onComplete={handleComplete}
      onAddKey={addKey}
      onUpdatePreferences={updatePreferences}
    />
  );
}
