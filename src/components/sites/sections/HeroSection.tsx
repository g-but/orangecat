/**
 * The opening of a page that has one.
 *
 * An eyebrow, one display statement, and the lead — the shape a serious
 * publication uses, and deliberately not a marketing hero: no gradient, no
 * illustration, no button. The claim is the design.
 */

import React from 'react';
import type { SiteSection } from '@/config/site-content';

export function HeroSection({ section }: { section: Extract<SiteSection, { kind: 'hero' }> }) {
  return (
    <section className="border-b border-subtle pb-12">
      {section.eyebrow && (
        <p className="font-mono text-xs uppercase tracking-caps text-fg-tertiary">
          {section.eyebrow}
        </p>
      )}
      <h1 className="mt-5 max-w-4xl font-heading text-4xl font-semibold leading-tight tracking-display text-fg-primary sm:text-5xl lg:text-6xl">
        {section.statement}
      </h1>
      <div className="mt-7 max-w-prose space-y-4">
        {section.lead.map((paragraph, index) => (
          <p key={index} className="text-lg leading-relaxed text-fg-secondary">
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  );
}
