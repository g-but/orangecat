import type { Metadata } from 'next';
import SettingsShell from '@/components/settings/SettingsShell';

export const metadata: Metadata = {
  title: { default: 'Settings', template: '%s | OrangeCat' },
};

/**
 * Every /settings/* page renders inside the shared SettingsShell (header +
 * section tabs from the settings-nav SSOT). Pages contribute content only —
 * no per-page headers, back arrows, or hand-rolled nav.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <SettingsShell>{children}</SettingsShell>;
}
