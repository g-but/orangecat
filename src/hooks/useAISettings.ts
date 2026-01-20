'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { ModelTier } from '@/config/ai-models';
import type { UserApiKey } from '@/components/ai/AIKeyManager';

// ==================== TYPES ====================

export interface UserAIPreferences {
  id: string;
  user_id: string;
  default_model_id: string | null;
  default_tier: ModelTier;
  auto_router_enabled: boolean;
  max_cost_sats: number;
  require_vision: boolean;
  require_function_calling: boolean;
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
  onboarding_step: number;
  cached_total_requests: number;
  cached_total_tokens: number;
  cached_total_cost_sats: number;
  created_at: string;
  updated_at: string;
}

export interface AISettingsState {
  preferences: UserAIPreferences | null;
  keys: UserApiKey[];
  isLoading: boolean;
  error: string | null;
  hasByok: boolean;
  primaryKey: UserApiKey | null;
}

export interface PlatformUsage {
  daily_requests: number;
  daily_limit: number;
  requests_remaining: number;
  can_use_platform: boolean;
}

// ==================== HOOK ====================

export function useAISettings() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [state, setState] = useState<AISettingsState>({
    preferences: null,
    keys: [],
    isLoading: true,
    error: null,
    hasByok: false,
    primaryKey: null,
  });
  const [platformUsage, setPlatformUsage] = useState<PlatformUsage | null>(null);

  // Fetch preferences and keys
  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Not authenticated',
        }));
        return;
      }

      // Fetch preferences
      const { data: prefsData } = await supabase
        .from('user_ai_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Fetch API keys
      const { data: keysData } = await supabase
        .from('user_api_keys')
        .select('*')
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      const keys: UserApiKey[] = keysData || [];
      const primaryKey = keys.find((k: UserApiKey) => k.is_primary) || keys[0] || null;

      setState({
        preferences: prefsData,
        keys,
        isLoading: false,
        error: null,
        hasByok: keys.some((k: UserApiKey) => k.is_valid),
        primaryKey,
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch settings',
      }));
    }
  }, [supabase]);

  // Fetch platform usage
  const fetchPlatformUsage = useCallback(async () => {
    try {
      const response = await fetch('/api/ai/platform-usage');
      if (response.ok) {
        const data = await response.json();
        setPlatformUsage(data);
      }
    } catch (err) {
      console.error('Failed to fetch platform usage:', err);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
    fetchPlatformUsage();
  }, [fetchData, fetchPlatformUsage]);

  // Update preferences
  const updatePreferences = useCallback(
    async (updates: Partial<UserAIPreferences>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // If no preferences exist, create them
      if (!state.preferences) {
        const { data, error } = await supabase
          .from('user_ai_preferences')
          .insert({
            user_id: user.id,
            ...updates,
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        setState(prev => ({ ...prev, preferences: data }));
        return data;
      }

      // Update existing preferences
      const { data, error } = await supabase
        .from('user_ai_preferences')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setState(prev => ({ ...prev, preferences: data }));
      return data;
    },
    [supabase, state.preferences]
  );

  // Add API key
  const addKey = useCallback(
    async (params: { provider: string; apiKey: string; keyName: string }) => {
      const response = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add key');
      }

      const data = await response.json();

      // Refresh keys
      await fetchData();

      return data;
    },
    [fetchData]
  );

  // Delete API key
  const deleteKey = useCallback(
    async (keyId: string) => {
      const response = await fetch(`/api/user/api-keys/${keyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete key');
      }

      // Refresh keys
      await fetchData();
    },
    [fetchData]
  );

  // Set primary key
  const setPrimaryKey = useCallback(
    async (keyId: string) => {
      const response = await fetch(`/api/user/api-keys/${keyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPrimary: true }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to set primary key');
      }

      // Refresh keys
      await fetchData();
    },
    [fetchData]
  );

  // Complete onboarding
  const completeOnboarding = useCallback(async () => {
    return updatePreferences({
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
    });
  }, [updatePreferences]);

  // Update onboarding step
  const updateOnboardingStep = useCallback(
    async (step: number) => {
      return updatePreferences({ onboarding_step: step });
    },
    [updatePreferences]
  );

  return {
    // State
    ...state,
    platformUsage,

    // Actions
    fetchData,
    fetchPlatformUsage,
    updatePreferences,
    addKey,
    deleteKey,
    setPrimaryKey,
    completeOnboarding,
    updateOnboardingStep,
  };
}

export default useAISettings;
