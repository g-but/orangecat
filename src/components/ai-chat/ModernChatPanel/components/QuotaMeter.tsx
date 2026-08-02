/**
 * QuotaMeter
 *
 * Shows the user's daily Cat budget so they can see headroom before they
 * hit the cap, and a path forward when they're close to / past it.
 *
 * Tier-aware states:
 *   - byok    → "Your key" badge; cap doesn't apply
 *   - pro     → "Pro · N of limit … left" chip; same near-cap / capped CTA logic as free
 *   - free    → "N of limit free messages left today" chip, normal weight
 *   - warning → ≤2 remaining: chip + inline "Add your key →" link
 *   - capped  → 0 remaining: red chip + same link
 *
 * The chip must be self-explanatory (founder feedback): full sentence on ≥sm,
 * compact "N of M left" on mobile, complete explanation in the tooltip + sr text.
 *
 * The CTA points at /settings/ai (BYOK setup) because that's the only
 * real escape today — once /pricing has a real Pro checkout we swap it
 * over.
 */

import Link from 'next/link';
import { KeyRound, Sparkles } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { cn } from '@/lib/utils';
import type { CatQuota } from '../hooks/useCatQuota';

interface QuotaMeterProps {
  quota: CatQuota | null;
  className?: string;
}

const NEAR_CAP_THRESHOLD = 2;

export function QuotaMeter({ quota, className }: QuotaMeterProps) {
  if (!quota) {
    return null;
  }

  if (quota.tier === 'byok') {
    // Show the actual provider name when we know it — the freedom
    // architecture is most visible when the user sees "OpenAI" or
    // "Together" in their toolbar instead of a generic "Your key".
    const label = quota.activeByokProviderName ?? 'Your key';
    return (
      <Link
        href={ROUTES.SETTINGS_USAGE}
        className={cn(
          'inline-flex items-center gap-1 rounded-md border border-subtle bg-surface-raised px-2 py-1 text-xs text-fg-secondary hover:text-fg-primary',
          className
        )}
        title={`Cat is routing through your ${label} key — you pay them directly. Click for full usage.`}
      >
        <KeyRound className="h-3 w-3" aria-hidden="true" />
        {label}
      </Link>
    );
  }

  const { tier, dailyLimit, requestsRemaining } = quota;
  const isPro = tier === 'pro';
  const isCapped = requestsRemaining <= 0;
  const isNearCap = !isCapped && requestsRemaining <= NEAR_CAP_THRESHOLD;

  // Self-explanatory in full via tooltip + screen readers; the visible chip
  // stays compact on small screens and spells itself out on ≥sm.
  const noun = isPro ? 'Cat messages' : 'free messages';
  const explanation = isCapped
    ? `You've used all ${dailyLimit} ${noun} for today · Add your own API key for unlimited`
    : `${requestsRemaining} of ${dailyLimit} ${noun} left today · Add your own API key for unlimited`;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs',
        isCapped && 'border-status-negative/30 bg-status-negative-subtle text-status-negative',
        isNearCap && 'border-status-warning/30 bg-status-warning-subtle text-status-warning',
        !isCapped &&
          !isNearCap &&
          isPro &&
          'border-accent-warm/30 bg-accent-warm/10 text-fg-primary',
        !isCapped && !isNearCap && !isPro && 'border-subtle bg-surface-raised text-fg-secondary',
        className
      )}
      title={explanation}
    >
      {isPro && !isCapped && !isNearCap && (
        <Sparkles className="h-3 w-3 text-accent-warm" aria-hidden="true" />
      )}
      <Link
        href={ROUTES.SETTINGS_USAGE}
        className="whitespace-nowrap hover:underline"
        aria-live="polite"
        title="See your full usage — what counts, when it resets, and your plan"
      >
        {isCapped ? (
          'Daily limit reached'
        ) : (
          <>
            {isPro && 'Pro · '}
            {requestsRemaining} of {dailyLimit}
            <span className="hidden sm:inline"> {noun}</span> left
            <span className="hidden sm:inline"> today</span>
          </>
        )}
        <span className="sr-only"> {explanation}</span>
      </Link>
      {(isCapped || isNearCap) && (
        <Link
          href={ROUTES.SETTINGS_AI}
          className="whitespace-nowrap font-medium underline decoration-dotted underline-offset-2 hover:no-underline"
          title="Bring your own API key — unlimited messages, you pay your provider directly"
        >
          Add your key →
        </Link>
      )}
    </span>
  );
}
