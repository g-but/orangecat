'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/browser';
import { DATABASE_TABLES } from '@/config/database-tables';
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
  /** The free platform default's position in the Cat fallback chain (0 = first). */
  platform_chain_position: number;
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

// ==================== HOOK ====================

export function useAISettings() {
  const [state, setState] = useState<AISettingsState>({
    preferences: null,
    keys: [],
    isLoading: true,
    error: null,
    hasByok: false,
    primaryKey: null,
  });

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

      // Fetch preferences. `maybeSingle()` returns `null` (not 406) when a
      // user has no preferences row yet — the row is created lazily on first
      // mutation by useAISettingsMutations.
      const { data: prefsData } = await supabase
        .from(DATABASE_TABLES.USER_AI_PREFERENCES)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // Fetch API keys
      const { data: keysData } = await supabase
        .from(DATABASE_TABLES.USER_API_KEYS)
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

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
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const {
    updatePreferences,
    addKey,
    deleteKey,
    setPrimaryKey,
    completeOnboarding,
    updateOnboardingStep,
  } = useAISettingsMutations({
    preferences: state.preferences,
    setState,
    fetchData,
  });

  // Reorder the fallback chain. Optimistically reflects the new order, then
  // persists via PATCH; reverts to server truth if it fails.
  const reorderKeys = useCallback(
    async (orderedIds: string[]) => {
      setState(prev => {
        // Optimistically stamp each item's new chain index (shared by keys via
        // sort_order and the platform default via platform_chain_position) so
        // the merged-chain UI reflects the move before the server round-trip.
        const byId = new Map(prev.keys.map(k => [k.id, k]));
        const reordered: UserApiKey[] = [];
        orderedIds.forEach((id, idx) => {
          if (id === 'platform') {
            return;
          }
          const k = byId.get(id);
          if (k) {
            reordered.push({ ...k, sort_order: idx });
          }
        });
        const platformIdx = orderedIds.indexOf('platform');
        const preferences =
          prev.preferences && platformIdx >= 0
            ? { ...prev.preferences, platform_chain_position: platformIdx }
            : prev.preferences;
        return { ...prev, keys: reordered, preferences };
      });
      const res = await fetch(API_ROUTES.USER.API_KEYS, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: orderedIds }),
      });
      if (!res.ok) {
        await fetchData();
        throw new Error('Failed to reorder keys');
      }
      await fetchData();
    },
    [fetchData]
  );

  return {
    // State
    ...state,

    // Actions
    fetchData,
    updatePreferences,
    addKey,
    deleteKey,
    setPrimaryKey,
    reorderKeys,
    completeOnboarding,
    updateOnboardingStep,
  };
}

export default useAISettings;
