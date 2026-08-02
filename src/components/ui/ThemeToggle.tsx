'use client';

import { HeaderIconButton } from '@/components/layout/HeaderIconButton';
import { useThemeMode } from '@/hooks/useThemeMode';
import { getThemeModeOption } from '@/config/theme';
import { cn } from '@/lib/utils';

/**
 * Theme switcher — ONE tap, no menu.
 *
 * It used to open a Light/System/Dark dropdown, which made changing a binary
 * preference a two-step interaction. Now the button shows the current mode and
 * advances to the next on click; the label says where the next tap lands, so
 * the cycle is announced rather than guessed. The explicit three-way choice
 * still lives on the Appearance settings page for anyone who wants to pick
 * directly.
 *
 * Hidden below `md` on purpose: the mobile header rail is the scarcest real
 * estate in the app, and a set-once preference does not earn a permanent slot
 * there. Small screens reach the same control from the account dropdown.
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { mode, next, cycle, mounted } = useThemeMode();
  const current = getThemeModeOption(mode);
  const upcoming = getThemeModeOption(next);

  return (
    <HeaderIconButton
      icon={current.icon}
      label={mounted ? `Theme: ${current.label}. Switch to ${upcoming.label}` : 'Theme'}
      title={mounted ? `Switch to ${upcoming.label.toLowerCase()}` : undefined}
      onClick={cycle}
      disabled={!mounted}
      className={cn('hidden md:inline-flex', className)}
    />
  );
}
