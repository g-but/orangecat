/**
 * The allocation profile — a person's published split, as a page.
 *
 * Deliberately NOT built on PublicEntityDetailPage. That component's shape is
 * "a thing, described, with a price" — right for a product, wrong here. This
 * page has one job: make a stranger understand, in the first screen, what this
 * person says should happen to their public money and why. So the split is the
 * hero, the reasoning is body copy rather than a sidebar card, and there is no
 * payment panel at all — nobody pays a directive.
 *
 * Server component: everything on it is a read, and the split must be in the
 * HTML for anyone who shares the link.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { looseClient } from '@/lib/supabase/untyped';
import { getTableName } from '@/config/entity-registry';
import { CivicAllocationService } from '@/domain/civic/service';
import { SplitBar } from './SplitBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import {
  ALLOCATION_BASIS_META,
  ALLOCATION_CADENCE_LABELS,
  isAllocationBalanced,
  type AllocationBasis,
  type AllocationCadence,
} from '@/config/civic-allocation';
import { JURISDICTION_LEVEL_META, type JurisdictionLevel } from '@/config/jurisdictions';

interface AllocationProfileProps {
  id: string;
}

export async function AllocationProfile({ id }: AllocationProfileProps) {
  const supabase = await createServerClient();

  // No status/visibility filter here on purpose: RLS already decides what this
  // reader may see, and duplicating the rule in the query would mean an owner
  // could not preview their own draft on the page they are about to publish.
  const { data } = await looseClient(supabase)
    .from(getTableName('allocation'))
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!data) {
    notFound();
  }
  const allocation = data as Record<string, unknown>;

  const service = new CivicAllocationService(supabase);
  const lines = await service.getResolvedLines(id);

  const basis = allocation.basis as AllocationBasis;
  const cadence = allocation.cadence as AllocationCadence;
  const status = allocation.status as string;
  const rationale = allocation.rationale as string | null;
  const referenceAmount = allocation.reference_amount as number | null;
  const currency = allocation.currency as string;
  const balanced = isAllocationBalanced(lines.map(line => line.share_percent));

  const segments = lines.map(line => ({
    id: line.id,
    label: line.recipientName,
    share: line.share_percent,
    level: line.recipientLevel,
  }));

  // The two halves of the same money, named. This is the comparison the page
  // exists to make: what a person is compelled to send, beside what they chose.
  const governmentShare = lines
    .filter(line => line.kind === 'jurisdiction')
    .reduce((sum, line) => sum + line.share_percent, 0);
  const directedShare = 100 - governmentShare;

  return (
    <article className="mx-auto max-w-shell px-4 py-10 sm:px-6 lg:px-8">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{ALLOCATION_BASIS_META[basis]?.label ?? 'Allocation'}</Badge>
          <Badge variant="outline">{ALLOCATION_CADENCE_LABELS[cadence] ?? cadence}</Badge>
          {periodLabel(allocation) && <Badge variant="outline">{periodLabel(allocation)}</Badge>}
          {status !== 'active' && (
            <Badge variant="outline" className="capitalize text-status-warning">
              {status}
            </Badge>
          )}
        </div>

        <h1 className="text-3xl font-semibold tracking-display text-fg-primary sm:text-4xl">
          {allocation.title as string}
        </h1>

        {typeof allocation.description === 'string' && allocation.description && (
          <p className="max-w-2xl text-lg text-fg-secondary">{allocation.description}</p>
        )}
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {/* The split is the hero. Everything else on this page explains it. */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">The split</CardTitle>
            </CardHeader>
            <CardContent>
              {segments.length === 0 ? (
                <p className="text-sm text-fg-secondary">
                  No lines yet. A directive says nothing until it names who gets what.
                </p>
              ) : (
                <SplitBar segments={segments} showRemainder={!balanced} />
              )}
            </CardContent>
          </Card>

          {rationale && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Why</CardTitle>
              </CardHeader>
              <CardContent>
                {/* whitespace-pre-line, not a markdown renderer: paragraph breaks
                    are the only formatting an argument needs, and rendering
                    user text as markup is how a public page becomes an attack
                    surface. */}
                <p className="whitespace-pre-line text-base leading-relaxed text-fg-secondary">
                  {rationale}
                </p>
              </CardContent>
            </Card>
          )}

          {lines.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Line by line</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {lines.map(line => (
                  <div
                    key={line.id}
                    className="border-b border-border-default pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <div className="min-w-0">
                        {line.recipientHref ? (
                          <Link
                            href={line.recipientHref}
                            className="font-medium text-fg-primary hover:underline"
                          >
                            {line.recipientName}
                          </Link>
                        ) : (
                          <span className="font-medium text-fg-primary">{line.recipientName}</span>
                        )}
                        <p className="mt-0.5 text-xs uppercase tracking-caps text-fg-tertiary">
                          {lineKindLabel(line.kind, line.recipientLevel)}
                        </p>
                      </div>
                      <span className="shrink-0 tabular-nums text-lg font-semibold text-fg-primary">
                        {line.share_percent}%
                      </span>
                    </div>
                    {line.note && <p className="mt-2 text-sm text-fg-secondary">{line.note}</p>}
                    {referenceAmount !== null && (
                      <p className="mt-1 text-sm text-fg-tertiary">
                        {formatAmount((referenceAmount * line.share_percent) / 100, currency)} of
                        the stated {formatAmount(referenceAmount, currency)}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Who decides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* The one number worth putting in a box. Every other figure on
                  this page is a share of the same money; this one says how much
                  of it the person claims back the right to point. */}
              <div>
                <p className="text-3xl font-semibold tabular-nums text-fg-primary">
                  {Number(directedShare.toFixed(3))}%
                </p>
                <p className="mt-1 text-sm text-fg-secondary">
                  directed outside the tiers of government
                </p>
              </div>
              <div className="border-t border-border-default pt-4">
                <p className="text-sm text-fg-secondary">
                  {Number(governmentShare.toFixed(3))}% goes to government bodies, split across{' '}
                  {countLevels(lines)} tier{countLevels(lines) === 1 ? '' : 's'}.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">The frame</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Covers" value={ALLOCATION_BASIS_META[basis]?.label ?? basis} />
              <Row label="Applies" value={ALLOCATION_CADENCE_LABELS[cadence] ?? cadence} />
              {periodLabel(allocation) && (
                <Row label="Period" value={periodLabel(allocation) as string} />
              )}
              {referenceAmount !== null && (
                <Row label="Amount" value={formatAmount(referenceAmount, currency)} />
              )}
              {typeof allocation.signature === 'string' && allocation.signature && (
                <Row label="Signed" value="Bitcoin signature on file" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-fg-secondary">
                A public directive is counted on each government body’s page as declared support —
                how many people have said what share it should get. That aggregate is what a
                governance vote can act on.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </article>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-fg-secondary">{label}</span>
      <span className="text-right font-medium text-fg-primary">{value}</span>
    </div>
  );
}

function lineKindLabel(kind: string, level: string | null): string {
  if (kind === 'jurisdiction' && level) {
    return `${JURISDICTION_LEVEL_META[level as JurisdictionLevel]?.label ?? level} government`;
  }
  if (kind === 'jurisdiction') {
    return 'Government';
  }
  if (kind === 'entity') {
    return 'On OrangeCat';
  }
  return 'Directed elsewhere';
}

function countLevels(lines: Array<{ kind: string; recipientLevel: string | null }>): number {
  return new Set(
    lines
      .filter(line => line.kind === 'jurisdiction' && line.recipientLevel)
      .map(line => line.recipientLevel)
  ).size;
}

function periodLabel(allocation: Record<string, unknown>): string | null {
  const start = (allocation.period_start as string | null)?.slice(0, 4);
  const end = (allocation.period_end as string | null)?.slice(0, 4);
  if (!start && !end) {
    return null;
  }
  if (start && end && start !== end) {
    return `${start}–${end}`;
  }
  return start ?? end ?? null;
}

/**
 * Formatted server-side with a fixed locale rather than through
 * useDisplayCurrency: this is a server component, and the figure is the
 * author's own stated amount in the currency they stated it in — converting it
 * to the reader's preferred currency would misquote what they published.
 */
function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default AllocationProfile;
