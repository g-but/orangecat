'use client';

import { useThemeMode } from '@/hooks/useThemeMode';
import { getThemeModeOption } from '@/config/theme';

/**
 * Theme control for the account dropdown — one tap advances the mode, matching
 * the header button. This is how small screens reach the setting, since the
 * header toggle is desktop-only (the mobile rail has no slot to spare).
 *
 * It deliberately does not navigate: changing the theme from here should never
 * cost you the page you are on.
 */
export function ThemeModeRow({ showDescription = true }: { showDescription?: boolean }) {
  const { mode, next, cycle, mounted } = useThemeMode();
  const current = getThemeModeOption(mode);
  const upcoming = getThemeModeOption(next);
  const Icon = current.icon;

  return (
    <button
      type="button"
      onClick={cycle}
      disabled={!mounted}
      role="menuitem"
      aria-label={mounted ? `Theme: ${current.label}. Switch to ${upcoming.label}` : 'Theme'}
      className="group w-full flex items-center px-4 py-3 text-sm outline-none transition-all duration-200 hover:bg-muted focus:bg-muted/40 focus:ring-2 focus:ring-ring focus:ring-inset dark:focus:bg-muted disabled:opacity-50"
    >
      <div className="oc-icon-tile mr-4 h-10 w-10">
        <Icon className="h-5 w-5 text-fg-secondary transition-colors duration-200 group-hover:text-fg-primary" />
      </div>
      <div className="flex-1 text-left">
        <div className="font-semibold text-fg-primary">Appearance</div>
        {showDescription && (
          <div className="text-sm text-fg-secondary">
            {mounted ? `${current.label} — tap for ${upcoming.label.toLowerCase()}` : 'Theme'}
          </div>
        )}
      </div>
    </button>
  );
}
