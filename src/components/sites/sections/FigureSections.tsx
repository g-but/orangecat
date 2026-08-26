/**
 * Sections that render a number.
 *
 * Both use tabular mono figures so digits line up column to column — the
 * difference between a page that looks measured and one that looks typed.
 */

import React from 'react';
import { SectionBody, SectionHeading } from './Primitives';
import type { SiteSection } from '@/config/site-content';

export function StatsSection({
  section,
  index,
}: {
  section: Extract<SiteSection, { kind: 'stats' }>;
  index?: number;
}) {
  return (
    <section>
      {section.heading && <SectionHeading index={index}>{section.heading}</SectionHeading>}
      <dl className="mt-6 grid grid-cols-1 divide-y divide-subtle border-y border-subtle sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {section.stats.map(stat => (
          <div key={stat.label} className="px-0 py-6 sm:px-6 sm:first:pl-0">
            <dt className="font-mono text-xs uppercase tracking-caps text-fg-tertiary">
              {stat.label}
            </dt>
            <dd className="mt-3 font-heading text-4xl font-medium tabular-nums text-fg-primary">
              {stat.value}
            </dd>
            {stat.note && <p className="mt-2 text-sm leading-relaxed text-fg-muted">{stat.note}</p>}
          </div>
        ))}
      </dl>
    </section>
  );
}

/**
 * One number, drawn.
 *
 * The bar is intentionally literal: when nothing is sourced it renders empty,
 * because an empty bar is the honest picture of an unfinished research phase.
 * Anything that dressed a 0% up as progress would be the page lying.
 */
export function MeterSection({
  section,
  index,
}: {
  section: Extract<SiteSection, { kind: 'meter' }>;
  index?: number;
}) {
  const percent = section.of > 0 ? Math.round((section.value / section.of) * 100) : 0;

  return (
    <section>
      {section.heading && <SectionHeading index={index}>{section.heading}</SectionHeading>}
      <SectionBody>
        <div className="flex items-baseline justify-between gap-6">
          <span className="font-mono text-xs uppercase tracking-caps text-fg-tertiary">
            {section.label}
          </span>
          <span className="font-mono text-sm tabular-nums text-fg-secondary">{percent}%</span>
        </div>
        <p className="mt-3 font-heading text-4xl font-medium tabular-nums text-fg-primary">
          {section.value}
          <span className="text-fg-muted"> / {section.of}</span>
        </p>
        <div
          className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-raised"
          role="progressbar"
          aria-valuenow={section.value}
          aria-valuemin={0}
          aria-valuemax={section.of}
          aria-label={section.label}
        >
          <div className="h-full rounded-full bg-accent-warm" style={{ width: `${percent}%` }} />
        </div>
        {section.caption && (
          <p className="mt-3 max-w-prose text-sm leading-relaxed text-fg-muted">
            {section.caption}
          </p>
        )}
      </SectionBody>
    </section>
  );
}
