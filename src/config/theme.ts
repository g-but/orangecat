import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';

/**
 * SSOT for appearance modes.
 *
 * Every surface that lets someone change the theme — the header button, the
 * account dropdown row, the Appearance settings page — reads this list. Adding
 * a mode (or renaming one) is a one-line change here, never a hand-edited
 * option list in three components.
 */
export interface ThemeModeOption {
  value: ThemeMode;
  label: string;
  /** Shown where there is room to explain the choice (settings). */
  description: string;
  icon: LucideIcon;
}

export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Order is the tap-cycle order, not just display order: the two explicit modes
 * sit next to each other because light↔dark is the switch people actually make,
 * and "System" follows as the hand-back-to-the-OS option.
 */
export const THEME_MODES: readonly ThemeModeOption[] = [
  { value: 'light', label: 'Light', description: 'Always the light theme.', icon: Sun },
  { value: 'dark', label: 'Dark', description: 'Always the dark theme.', icon: Moon },
  {
    value: 'system',
    label: 'System',
    description: 'Follow your device setting, including its day/night schedule.',
    icon: Monitor,
  },
] as const;

export const DEFAULT_THEME_MODE: ThemeMode = 'system';

export function isThemeMode(value: unknown): value is ThemeMode {
  return THEME_MODES.some(m => m.value === value);
}

export function getThemeModeOption(value: ThemeMode): ThemeModeOption {
  return THEME_MODES.find(m => m.value === value) ?? THEME_MODES[THEME_MODES.length - 1];
}

/** The mode one tap away — lets a single button cycle instead of opening a menu. */
export function nextThemeMode(current: ThemeMode): ThemeMode {
  const index = THEME_MODES.findIndex(m => m.value === current);
  return THEME_MODES[(index + 1) % THEME_MODES.length].value;
}
