/**
 * Sections that present the research itself: the jump index and the tables.
 *
 * These are the instrument. Codes, counts and statuses are set in mono so a
 * reader can scan a column; the status cell carries a dot because "Unverified
 * lead" and "Sourced" are the two words on this site a reader must never
 * skim past.
 */

import React from 'react';
import { Blurb, SectionBody, SectionHeading } from './Primitives';
import type { SiteSection } from '@/config/site-content';

/** Status keyword → dot colour. Anything unrecognised stays neutral. */
const STATUS_DOT: Record<string, string> = {
  sourced: 'bg-status-positive',
  'unverified lead': 'bg-status-warning',
  taken: 'bg-fg-muted',
  done: 'bg-status-positive',
  'in progress': 'bg-status-warning',
  'not started': 'bg-fg-muted',
};

export function IndexSection({
  section,
  index,
}: {
  section: Extract<SiteSection, { kind: 'index' }>;
  index?: number;
}) {
  return (
    <section>
      {section.heading && <SectionHeading index={index}>{section.heading}</SectionHeading>}
      {section.blurb && <div className="sm:pl-10">{<Blurb>{section.blurb}</Blurb>}</div>}
      <SectionBody>
        <ol className="divide-y divide-subtle border-y border-subtle">
          {section.entries.map((entry, i) => (
            <li key={entry.anchor}>
              <a
                href={`#${entry.anchor}`}
                className="group flex items-baseline gap-4 py-2.5 transition-colors hover:text-fg-primary"
              >
                <span className="font-mono text-xs tabular-nums text-fg-muted">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="flex-1 text-sm text-fg-secondary group-hover:text-fg-primary">
                  {entry.label}
                </span>
                {entry.meta && (
                  <span className="font-mono text-xs tabular-nums text-fg-muted">{entry.meta}</span>
                )}
              </a>
            </li>
          ))}
        </ol>
      </SectionBody>
    </section>
  );
}

export function TableSection({ section }: { section: Extract<SiteSection, { kind: 'table' }> }) {
  const mono = new Set(section.monoColumns ?? []);

  // Fixed layout with declared widths, because this page stacks fifteen tables
  // with the same four columns. Auto layout sizes each one to its own longest
  // cell, so "Malaysia Smelting Corporation" in one table shifts every column
  // out of line with the table above it. Aligned columns are what make the set
  // read as one instrument rather than fifteen separate exhibits. The first
  // column carries the names and takes a third; the rest divide the remainder.
  const restWidth = section.columns.length > 1 ? 66 / (section.columns.length - 1) : 100;

  return (
    <section id={section.anchor} className="scroll-mt-24">
      {section.heading && (
        <h3 className="font-heading text-lg font-semibold text-fg-primary">{section.heading}</h3>
      )}
      {section.blurb && (
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-fg-secondary">
          {section.blurb}
        </p>
      )}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[38rem] table-fixed border-collapse text-left text-sm">
          <colgroup>
            {section.columns.map((column, i) => (
              <col key={column} style={{ width: `${i === 0 ? 34 : restWidth}%` }} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-y border-subtle">
              {section.columns.map(column => (
                <th
                  key={column}
                  scope="col"
                  className="py-2 pr-6 font-mono text-xs font-medium uppercase tracking-caps text-fg-tertiary"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {section.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-subtle">
                {row.map((cell, cellIndex) => {
                  const isStatus = cellIndex === section.statusColumn;
                  const dot = isStatus ? STATUS_DOT[cell.toLowerCase()] : undefined;
                  return (
                    <td
                      key={cellIndex}
                      className={[
                        'py-2.5 pr-6 align-baseline',
                        cellIndex === 0 ? 'font-medium text-fg-primary' : 'text-fg-secondary',
                        mono.has(cellIndex) || isStatus ? 'font-mono text-xs' : '',
                      ].join(' ')}
                    >
                      {dot ? (
                        <span className="inline-flex items-center gap-2">
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
                          {cell}
                        </span>
                      ) : (
                        cell
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {section.note && <p className="mt-2 text-xs text-fg-muted">{section.note}</p>}
    </section>
  );
}
