/**
 * The split, as one bar.
 *
 * A directive is a set of percentages, and a table of percentages is read as
 * numbers rather than as a shape. The bar is read as a shape — "most of it
 * stays here" lands before any figure does, which is the claim the page is
 * making. The table below it carries the precision.
 *
 * Segments are ordered by the directive's own line order, not by size: the
 * order a person put their lines in is itself a statement, and re-sorting it
 * would edit their argument.
 *
 * Achromatic by design (per the design system: status colours for status only).
 * Tiers are distinguished by luminance, which survives greyscale, printing, and
 * every form of colour blindness — the encoding does not depend on hue at all.
 */

interface SplitSegment {
  id: string;
  label: string;
  share: number;
  /** Depth in the containment chain, if the recipient is a government body. */
  level?: string | null;
}

interface SplitBarProps {
  segments: SplitSegment[];
  /** Shown when the shares do not total 100 — a draft in progress. */
  showRemainder?: boolean;
}

/**
 * Luminance ramp, nearest tier darkest. Local money is the most concrete thing
 * on the page, so it carries the most ink.
 */
const LEVEL_TONE: Record<string, string> = {
  local: 'bg-fg-primary',
  district: 'bg-fg-secondary',
  regional: 'bg-fg-secondary opacity-80',
  national: 'bg-fg-tertiary',
  supranational: 'bg-fg-tertiary opacity-60',
};

const NON_GOVERNMENT_TONE = 'bg-accent-warm';

function toneFor(level: string | null | undefined): string {
  if (!level) {
    return NON_GOVERNMENT_TONE;
  }
  return LEVEL_TONE[level] ?? 'bg-fg-tertiary';
}

export function SplitBar({ segments, showRemainder = false }: SplitBarProps) {
  const total = segments.reduce((sum, segment) => sum + segment.share, 0);
  const unassigned = Math.max(0, 100 - total);
  const over = Math.max(0, total - 100);

  // Over-assignment has to be scaled explicitly. Flex children given widths
  // that sum past 100% shrink to fit by default, which would render a 115%
  // split as a full bar — the one reading that makes an unpublishable
  // directive look finished. Scaling keeps the segments in true proportion to
  // each other and lets the message below carry the fact that it is over.
  const scale = total > 100 ? 100 / total : 1;

  return (
    <div className="space-y-3">
      <div
        className="flex h-3 w-full overflow-hidden rounded-full bg-surface-raised"
        role="img"
        aria-label={segments.map(segment => `${segment.label}: ${segment.share}%`).join(', ')}
      >
        {segments.map(segment => (
          <div
            key={segment.id}
            className={`${toneFor(segment.level)} h-full`}
            // Widths are data, not design — they can only come from the row.
            style={{ width: `${segment.share * scale}%` }}
          />
        ))}
        {showRemainder && unassigned > 0 && (
          <div
            className="h-full bg-transparent"
            style={{ width: `${unassigned}%` }}
            aria-hidden="true"
          />
        )}
      </div>

      <ul className="space-y-0">
        {segments.map(segment => (
          <li
            key={segment.id}
            className="flex items-baseline gap-3 border-b border-border-default py-2 last:border-0"
          >
            <span
              className={`${toneFor(segment.level)} mt-1 h-2 w-2 shrink-0 rounded-full`}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 truncate text-sm text-fg-primary">{segment.label}</span>
            {/* Tabular figures so the column of percentages aligns on the
                decimal point rather than drifting with digit widths. */}
            <span className="tabular-nums text-sm font-medium text-fg-primary">
              {formatShare(segment.share)}%
            </span>
          </li>
        ))}
      </ul>

      {showRemainder && (unassigned > 0 || over > 0) && (
        <p className="text-sm text-status-warning">
          {over > 0
            ? `${formatShare(over)}% over — a directive must total 100% before it can be published.`
            : `${formatShare(unassigned)}% unassigned — a directive must total 100% before it can be published.`}
        </p>
      )}
    </div>
  );
}

/** Trim the stored three decimals down to what the number actually needs. */
function formatShare(share: number): string {
  return Number(share.toFixed(3)).toString();
}

export default SplitBar;
