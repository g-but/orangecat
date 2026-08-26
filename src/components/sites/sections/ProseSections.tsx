/**
 * Sections made of words: running prose, top-ruled cards, and definitions.
 *
 * Cards are ruled rather than boxed. A grid of bordered boxes reads as a
 * product page; a grid of hairline-topped columns reads as a document, which
 * is what a research firm is publishing.
 */

import React from 'react';
import { Blurb, SectionBody, SectionHeading } from './Primitives';
import type { SiteSection } from '@/config/site-content';

export function ProseSection({
  section,
  index,
}: {
  section: Extract<SiteSection, { kind: 'prose' }>;
  index?: number;
}) {
  return (
    <section>
      {section.heading && <SectionHeading index={index}>{section.heading}</SectionHeading>}
      <div className={section.heading ? 'mt-6 sm:pl-10' : ''}>
        <div className="max-w-prose space-y-4">
          {section.paragraphs.map((paragraph, i) => (
            <p key={i} className="text-base leading-relaxed text-fg-secondary">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CardsSection({
  section,
  index,
}: {
  section: Extract<SiteSection, { kind: 'cards' }>;
  index?: number;
}) {
  const columns = section.columns === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2';
  return (
    <section>
      {section.heading && <SectionHeading index={index}>{section.heading}</SectionHeading>}
      {section.blurb && <div className="sm:pl-10">{<Blurb>{section.blurb}</Blurb>}</div>}
      <SectionBody>
        <div className={`grid grid-cols-1 gap-x-8 gap-y-9 sm:grid-cols-2 ${columns}`}>
          {section.cards.map(card => (
            <article key={card.title} className="flex h-full flex-col border-t border-strong pt-4">
              <h3 className="font-heading text-base font-semibold text-fg-primary">{card.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-fg-secondary">{card.body}</p>
              {card.meta && (
                <p className="mt-4 font-mono text-xs leading-relaxed text-fg-muted">{card.meta}</p>
              )}
            </article>
          ))}
        </div>
      </SectionBody>
    </section>
  );
}

export function DefinitionsSection({
  section,
  index,
}: {
  section: Extract<SiteSection, { kind: 'definitions' }>;
  index?: number;
}) {
  return (
    <section>
      {section.heading && <SectionHeading index={index}>{section.heading}</SectionHeading>}
      {section.blurb && <div className="sm:pl-10">{<Blurb>{section.blurb}</Blurb>}</div>}
      <SectionBody>
        <dl className="divide-y divide-subtle border-y border-subtle">
          {section.items.map(item => (
            <div key={item.term} className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-3 sm:gap-6">
              <dt className="text-sm font-semibold text-fg-primary">{item.term}</dt>
              <dd className="text-sm leading-relaxed text-fg-secondary sm:col-span-2">
                {item.detail}
              </dd>
            </div>
          ))}
        </dl>
      </SectionBody>
    </section>
  );
}
