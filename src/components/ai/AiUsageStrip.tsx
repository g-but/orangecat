'use client';

/**
 * AiUsageStrip — one line of live numbers at the top of /settings/ai,
 * linking to /settings/usage. The Usage tab owns the full story (meter,
 * reset time, what counts); this strip only CONNECTS the config surface to
 * the consumption surface so neither tab is a dead end. Renders nothing
 * while loading or on fetch failure — a missing strip is honest, a stale
 * one is not.
 */

import Link from 'next/link';
import { Gauge, ChevronRight } from 'lucide-react';
import { useCatQuota } from '@/components/ai-chat/ModernChatPanel/hooks/useCatQuota';
import { ROUTES } from '@/config/routes';

export function AiUsageStrip() {
  const { quota } = useCatQuota();
  if (!quota) {
    return null;
  }

  const label =
    quota.tier === 'byok'
      ? `On your own key${quota.activeByokProviderName ? ` (${quota.activeByokProviderName})` : ''} — no daily cap`
      : `${quota.requestsRemaining} of ${quota.dailyLimit} messages left today`;

  return (
    <Link
      href={ROUTES.SETTINGS_USAGE}
      className="flex min-h-11 items-center justify-between rounded-md border border-subtle bg-surface-raised/50 px-4 py-2 transition-colors hover:bg-surface-raised"
    >
      <span className="flex items-center gap-2 text-sm text-fg-secondary">
        <Gauge className="h-4 w-4" aria-hidden="true" />
        {label}
      </span>
      <span className="flex items-center gap-1 text-sm text-fg-tertiary">
        Full usage
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </Link>
  );
}
