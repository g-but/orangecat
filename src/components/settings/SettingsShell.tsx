'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import EntityListShell from '@/components/entity/EntityListShell';
import { SETTINGS_SECTIONS, isSettingsSectionActive } from '@/config/settings-nav';

/**
 * SettingsShell — the one header + tab rail every /settings/* page renders
 * inside (mounted by the settings layout, so pages can't drift back to
 * hand-rolled headers). Sections come from the SETTINGS_SECTIONS SSOT.
 *
 * Tabs are a horizontal, scrollable rail: identical on mobile and desktop,
 * 44px touch targets, active tab underlined with the warm accent.
 */
export default function SettingsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '';
  const active = SETTINGS_SECTIONS.find(s => isSettingsSectionActive(s.href, pathname));

  return (
    <EntityListShell title="Settings" description={active?.description}>
      <nav aria-label="Settings sections" className="border-b border-subtle">
        <ul className="-mb-px flex gap-1 overflow-x-auto">
          {SETTINGS_SECTIONS.map(section => {
            const Icon = section.icon;
            const isActive = section === active;
            return (
              <li key={section.href} className="shrink-0">
                <Link
                  href={section.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex min-h-11 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'border-accent-warm text-fg-primary'
                      : 'border-transparent text-fg-secondary hover:border-default hover:text-fg-primary'
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {section.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="pt-6">{children}</div>
    </EntityListShell>
  );
}
