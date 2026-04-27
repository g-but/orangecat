'use client';

import { useCallback } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { DATABASE_TABLES } from '@/config/database-tables';
import { API_ROUTES } from '@/config/api-routes';
import type { AISettingsState, UserAIPreferences } from './useAISettings';
import type { Dispatch, SetStateAction } from 'react';

interface MutationsProps {
  supabase: SupabaseClient;
  preferences: UserAIPreferences | null;
  setState: Dispatch<SetStateAction<AISettingsState>>;
  fetchData: () => Promise<void>;
}

export interface UseAISettingsMutationsReturn {
  updatePreferences: (updates: Partial<UserAIPreferences>) => Promise<UserAIPreferences>;
  addKey: (params: { provider: string; apiKey: string; keyName: string }) => Promise<void>;
  deleteKey: (keyId: string) => Promise<void>;
  setPrimaryKey: (keyId: string) => Promise<void>;
  completeOnboarding: () => Promise<UserAIPreferences>;
  updateOnboardingStep: (step: number) => Promise<UserAIPreferences>;
}

export function useAISettingsMutations({
  supabase,
  preferences,
  setState,
  fetchData,
}: MutationsProps): UseAISettingsMutationsReturn {
  const updatePreferences = useCallback(
    async (updates: Partial<UserAIPreferences>): Promise<UserAIPreferences> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      if (!preferences) {
        const { data, error } = await supabase
          .from(DATABASE_TABLES.USER_AI_PREFERENCES)
          .insert({ user_id: user.id, ...updates })
          .select()
          .single();

        if (error) {
          throw error;
        }

        setState(prev => ({ ...prev, preferences: data }));
        return data;
      }

      const { data, error } = await supabase
        .from(DATABASE_TABLES.USER_AI_PREFERENCES)
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
    [supabase, preferences, setState]
  );

  const addKey = useCallback(
    async (params: { provider: string; apiKey: string; keyName: string }) => {
      const response = await fetch(API_ROUTES.USER.API_KEYS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add key');
      }

      await fetchData();
    },
    [fetchData]
  );

  const deleteKey = useCallback(
    async (keyId: string) => {
      const response = await fetch(`${API_ROUTES.USER.API_KEYS}/${keyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete key');
      }

      await fetchData();
    },
    [fetchData]
  );

  const setPrimaryKey = useCallback(
    async (keyId: string) => {
      const response = await fetch(`${API_ROUTES.USER.API_KEYS}/${keyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPrimary: true }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to set primary key');
      }

      await fetchData();
    },
    [fetchData]
  );

  const completeOnboarding = useCallback(
    () =>
      updatePreferences({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      }),
    [updatePreferences]
  );

  const updateOnboardingStep = useCallback(
    (step: number) => updatePreferences({ onboarding_step: step }),
    [updatePreferences]
  );

  return {
    updatePreferences,
    addKey,
    deleteKey,
    setPrimaryKey,
    completeOnboarding,
    updateOnboardingStep,
  };
}
