/**
 * Shared type primitives for hosted-site sections.
 *
 * The whole visual system of a hosted site lives in these three components plus
 * the section files beside them. Typography does the work: Space Grotesk for
 * display, IBM Plex Mono for anything a reader might compare (codes, counts,
 * prices, statuses), Inter for prose at a reading measure. Colour is reserved —
 * monochrome surfaces, the warm accent only for the current position and one
 * meter fill, status colours only on actual status.
 */

import React from 'react';

/**
 * A numbered section heading. Research houses number their sections; it makes a
 * long page navigable and signals that the document has a structure rather than
 * being a stack of blocks.
 */
export function SectionHeading({ index, children }: { index?: number; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-4">
      {index !== undefined && (
        <span aria-hidden className="font-mono text-xs tabular-nums text-fg-muted">
          {String(index).padStart(2, '0')}
        </span>
      )}
      <h2 className="font-heading text-2xl font-semibold tracking-display text-fg-primary sm:text-3xl">
        {children}
      </h2>
    </div>
  );
}

/** Standfirst under a heading. Kept at measure — it is prose, not layout. */
export function Blurb({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 max-w-prose text-base leading-relaxed text-fg-secondary">{children}</p>;
}

/**
 * Indents a section's body to sit under the heading text rather than under its
 * number. Small thing; it is what makes the numbering read as a margin note
 * instead of a bullet.
 */
export function SectionBody({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 sm:pl-10">{children}</div>;
}
