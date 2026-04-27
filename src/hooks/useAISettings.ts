'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';
import type { ModelTier } from '@/config/ai-models';
import type { UserApiKey } from '@/components/ai/AIKeyManager';
import { API_ROUTES } from '@/config/api-routes';
import { useAISettingsMutations } from './useAISettingsMutations';

// ==================== TYPES ====================

export interface UserAIPreferences {
  id: string;
  user_id: string;
  default_model_id: string | null;
  default_tier: ModelTier;
  auto_router_enabled: boolean;
  max_cost_btc: number;
  require_vision: boolean;
  require_function_calling: boolean;
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
  onboarding_step: number;
  cached_total_requests: number;
  cached_total_tokens: number;
  cached_total_cost_btc: number;
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
        .from(DATABASE_TABLES.USER_AI_PREFERENCES)
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Fetch API keys
      const { data: keysData } = await supabase
        .from(DATABASE_TABLES.USER_API_KEYS)
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
      const response = await fetch(API_ROUTES.AI.PLATFORM_USAGE);
      if (response.ok) {
        const data = await response.json();
        setPlatformUsage(data);
      }
    } catch (err) {
      logger.error('Failed to fetch platform usage', err, 'AI');
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
    fetchPlatformUsage();
  }, [fetchData, fetchPlatformUsage]);

  const {
    updatePreferences,
    addKey,
    deleteKey,
    setPrimaryKey,
    completeOnboarding,
    updateOnboardingStep,
  } = useAISettingsMutations({
    supabase,
    preferences: state.preferences,
    setState,
    fetchData,
  });

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
