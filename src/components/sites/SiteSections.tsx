/**
 * Renders the closed set of section shapes a hosted site is built from.
 *
 * One renderer for every hosted site is deliberate: it is what stops fifty
 * customer websites from becoming fifty stylesheets, and it is why a site
 * inherits dark mode, spacing and readable measure without its owner thinking
 * about any of them. Section shapes live in `src/config/site-content.ts`.
 */

import React from 'react';
import type { SiteSection } from '@/config/site-content';

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-heading tracking-display text-2xl font-semibold text-fg-primary sm:text-3xl">
      {children}
    </h2>
  );
}

function Blurb({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 max-w-3xl text-base leading-relaxed text-fg-secondary">{children}</p>;
}

function ProseSection({ section }: { section: Extract<SiteSection, { kind: 'prose' }> }) {
  return (
    <section className="space-y-4">
      {section.heading && <Heading>{section.heading}</Heading>}
      {section.paragraphs.map((paragraph, index) => (
        <p key={index} className="max-w-3xl text-base leading-relaxed text-fg-secondary">
          {paragraph}
        </p>
      ))}
    </section>
  );
}

function StatsSection({ section }: { section: Extract<SiteSection, { kind: 'stats' }> }) {
  return (
    <section>
      {section.heading && <Heading>{section.heading}</Heading>}
      <dl className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-subtle bg-subtle sm:grid-cols-3">
        {section.stats.map(stat => (
          <div key={stat.label} className="bg-surface-base p-6">
            <dt className="text-sm font-medium uppercase tracking-caps text-fg-tertiary">
              {stat.label}
            </dt>
            <dd className="mt-2 font-heading text-3xl font-semibold tabular-nums text-fg-primary">
              {stat.value}
            </dd>
            {stat.note && <p className="mt-2 text-sm leading-relaxed text-fg-muted">{stat.note}</p>}
          </div>
        ))}
      </dl>
    </section>
  );
}

function CardsSection({ section }: { section: Extract<SiteSection, { kind: 'cards' }> }) {
  const columns = section.columns === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2';
  return (
    <section>
      {section.heading && <Heading>{section.heading}</Heading>}
      {section.blurb && <Blurb>{section.blurb}</Blurb>}
      <div className={`mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 ${columns}`}>
        {section.cards.map(card => (
          <article
            key={card.title}
            className="flex h-full flex-col rounded-lg border border-subtle bg-surface-base p-5"
          >
            <h3 className="text-base font-semibold text-fg-primary">{card.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-fg-secondary">{card.body}</p>
            {card.meta && (
              <p className="mt-4 border-t border-subtle pt-3 text-xs leading-relaxed text-fg-muted">
                {card.meta}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function DefinitionsSection({
  section,
}: {
  section: Extract<SiteSection, { kind: 'definitions' }>;
}) {
  return (
    <section>
      {section.heading && <Heading>{section.heading}</Heading>}
      {section.blurb && <Blurb>{section.blurb}</Blurb>}
      <dl className="mt-6 space-y-5 border-l-2 border-subtle pl-5">
        {section.items.map(item => (
          <div key={item.term}>
            <dt className="text-sm font-semibold text-fg-primary">{item.term}</dt>
            <dd className="mt-1 max-w-3xl text-sm leading-relaxed text-fg-secondary">
              {item.detail}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function TableSection({ section }: { section: Extract<SiteSection, { kind: 'table' }> }) {
  return (
    <section>
      {section.heading && (
        <h3 className="font-heading text-lg font-semibold text-fg-primary">{section.heading}</h3>
      )}
      {section.blurb && (
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-fg-secondary">{section.blurb}</p>
      )}
      <div className="mt-4 overflow-x-auto rounded-lg border border-subtle">
        <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
          <thead className="bg-surface-raised">
            <tr>
              {section.columns.map(column => (
                <th
                  key={column}
                  scope="col"
                  className="px-4 py-2.5 text-xs font-semibold uppercase tracking-caps text-fg-tertiary"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-surface-base">
            {section.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-t border-subtle">
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={
                      cellIndex === 0
                        ? 'px-4 py-2.5 font-medium text-fg-primary'
                        : 'px-4 py-2.5 text-fg-secondary'
                    }
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {section.note && <p className="mt-2 text-xs text-fg-muted">{section.note}</p>}
    </section>
  );
}

export function SiteSections({ sections }: { sections: SiteSection[] }) {
  return (
    <div className="space-y-12">
      {sections.map((section, index) => {
        switch (section.kind) {
          case 'prose':
            return <ProseSection key={index} section={section} />;
          case 'stats':
            return <StatsSection key={index} section={section} />;
          case 'cards':
            return <CardsSection key={index} section={section} />;
          case 'definitions':
            return <DefinitionsSection key={index} section={section} />;
          case 'table':
            return <TableSection key={index} section={section} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
