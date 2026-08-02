'use client';

/**
 * "From your Cat" — proactive, grounded suggestions the Cat generates in the
 * background (activation, connection, completion). Fetched from /api/cat/nudges;
 * dismissible. Renders nothing when there are no nudges.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, X, ArrowRight } from 'lucide-react';
import { API_ROUTES } from '@/config/api-routes';

interface Nudge {
  id: string;
  nudge_type: string;
  title: string;
  body: string;
  cta_label: string | null;
  cta_url: string | null;
}

// Show the Cat's top proactive suggestions (API returns them ordered by
// confidence score, highest first). This is the agent's main in-app "here's
// how to earn next" surface, so give it room beyond a token two.
const DASHBOARD_NUDGE_CAP = 4;

export function CatNudges() {
  const [nudges, setNudges] = useState<Nudge[] | null>(null);

  useEffect(() => {
    let on = true;
    fetch(API_ROUTES.CAT.NUDGES)
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (on && d?.success) {
          setNudges((d.data?.nudges || []).slice(0, DASHBOARD_NUDGE_CAP));
        }
      })
      .catch(() => {
        if (on) {
          setNudges([]);
        }
      });
    return () => {
      on = false;
    };
  }, []);

  const dismiss = (id: string) => {
    // Optimistically remove, but restore on failure so the nudge doesn't silently
    // reappear on next load (the dismissal wasn't persisted).
    const prev = nudges;
    setNudges(n => n?.filter(x => x.id !== id) ?? null);
    fetch(API_ROUTES.CAT.NUDGES, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'dismiss', id }),
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to dismiss (${res.status})`);
        }
      })
      .catch(() => {
        setNudges(prev);
      });
  };

  if (!nudges || nudges.length === 0) {
    return null;
  }

  return (
    <section className="rounded-lg border border-default bg-surface-base p-5">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent-warm" />
        <h2 className="text-sm font-semibold text-fg-primary">Your Cat suggests</h2>
        <span className="text-xs text-fg-tertiary">— ways to earn, grounded in what you have</span>
      </div>
      <div className="space-y-2">
        {nudges.map(n => (
          <div
            key={n.id}
            className="flex items-start gap-3 rounded-md border border-subtle bg-surface-raised/40 p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-fg-primary">{n.title}</p>
              <p className="mt-0.5 text-sm text-fg-secondary">{n.body}</p>
              {n.cta_url && n.cta_label && (
                <Link
                  href={n.cta_url}
                  className="mt-1.5 inline-flex items-center gap-1 text-sm font-medium text-accent-warm hover:underline"
                >
                  {n.cta_label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
            <button
              onClick={() => dismiss(n.id)}
              aria-label="Dismiss"
              className="rounded p-0.5 text-fg-tertiary hover:text-fg-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default CatNudges;
