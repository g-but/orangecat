'use client';

import { fromTable } from '@/lib/supabase/untyped';
import { useEffect, useCallback, useRef } from 'react';
import { logger } from '@/utils/logger';
import { DATABASE_TABLES } from '@/config/database-tables';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/browser';

// Syncs dark/light preference to profiles.preferences.theme so it persists
// across devices. Applied once per login session; saved fire-and-forget on toggle.
export function useProfileTheme() {
  const { setTheme } = useTheme();
  const { user, profile, hydrated } = useAuth();

  const applied = useRef(false);
  const profileRef = useRef(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  // Reset when user logs out so next login applies the new user's preference
  useEffect(() => {
    if (!user) {
      applied.current = false;
    }
  }, [user]);

  // Apply profile preference once per login (cross-device restore)
  useEffect(() => {
    if (!hydrated || !profile || applied.current) {
      return;
    }
    applied.current = true;
    const prefs = profile.preferences as Record<string, unknown> | null;
    const saved = prefs?.theme;
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      setTheme(saved);
    }
  }, [hydrated, profile, setTheme]);

  // Call after setTheme — persists choice to profile (no await needed at call site)
  const saveThemePreference = useCallback(
    async (newTheme: string) => {
      if (!user?.id) {
        return;
      }
      const currentPrefs = (profileRef.current?.preferences as Record<string, unknown>) ?? {};

      const { error } = await fromTable(supabase, DATABASE_TABLES.PROFILES)
        .update({ preferences: { ...currentPrefs, theme: newTheme } })
        .eq('id', user.id);
      if (error) {
        logger.warn('failed to save theme preference', error.message, 'useProfileTheme');
      }
    },
    [user?.id]
  );

  return { saveThemePreference };
}
