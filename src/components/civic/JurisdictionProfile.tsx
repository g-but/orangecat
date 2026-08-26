/**
 * The jurisdiction profile — a government body, as a page people can act on.
 *
 * Two things carry this page, and neither is on a normal entity profile.
 *
 * First, the verification state, stated plainly and at the top. Every entry in
 * an open directory of governments is a potential impersonation, so the page
 * either says "this body proved it controls this page" or it says "unclaimed,
 * and nothing here routes money" — never a vague badge the reader has to
 * interpret.
 *
 * Second, declared support: how many people have publicly said what share of
 * their taxes this body should get, and what they said. That number exists
 * before a single payment does, and it is the thing a governance vote can
 * actually act on.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { looseClient } from '@/lib/supabase/untyped';
import { getTableName } from '@/config/entity-registry';
import { CivicAllocationService } from '@/domain/civic/service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import {
  JURISDICTION_LEVEL_META,
  JURISDICTION_VERIFICATION_META,
  type JurisdictionLevel,
  type JurisdictionVerificationStatus,
} from '@/config/jurisdictions';

interface JurisdictionProfileProps {
  id: string;
}

const TONE_CLASSES: Record<string, string> = {
  neutral: 'border-border-default text-fg-secondary',
  warning: 'border-status-warning text-status-warning',
  positive: 'border-status-positive text-status-positive',
  negative: 'border-status-negative text-status-negative',
};

export async function JurisdictionProfile({ id }: JurisdictionProfileProps) {
  const supabase = await createServerClient();

  const { data } = await looseClient(supabase)
    .from(getTableName('jurisdiction'))
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!data) {
    notFound();
  }
  const jurisdiction = data as Record<string, unknown>;

  const service = new CivicAllocationService(supabase);
  const [support, chain] = await Promise.all([
    service.getDeclaredSupport(id),
    service.getChain(id),
  ]);

  const level = jurisdiction.level as JurisdictionLevel;
  const levelMeta = JURISDICTION_LEVEL_META[level];
  const verification = jurisdiction.verification_status as JurisdictionVerificationStatus;
  const verificationMeta = JURISDICTION_VERIFICATION_META[verification];
  const budget = jurisdiction.annual_budget as number | null;
  const currency = jurisdiction.currency as string;

  // The chain includes this body first; the rest is what contains it.
  const ancestors = chain.slice(1);

  return (
    <article className="mx-auto max-w-shell px-4 py-10 sm:px-6 lg:px-8">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{levelMeta?.label ?? level}</Badge>
          {placeLabel(jurisdiction) && <Badge variant="outline">{placeLabel(jurisdiction)}</Badge>}
        </div>

        <h1 className="text-3xl font-semibold tracking-display text-fg-primary sm:text-4xl">
          {jurisdiction.title as string}
        </h1>

        {/* Ancestors read as a sentence rather than a breadcrumb: this is the
            chain a resident belongs to, and saying "inside" makes the
            containment relation explicit to someone meeting it for the first
            time. */}
        {ancestors.length > 0 && (
          <p className="text-sm text-fg-secondary">
            Inside{' '}
            {ancestors.map((ancestor, index) => (
              <span key={ancestor.id as string}>
                {index > 0 && ', '}
                <Link
                  href={`/jurisdictions/${ancestor.id as string}`}
                  className="text-fg-primary hover:underline"
                >
                  {ancestor.title as string}
                </Link>
              </span>
            ))}
          </p>
        )}

        {typeof jurisdiction.description === 'string' && jurisdiction.description && (
          <p className="max-w-2xl text-lg text-fg-secondary">{jurisdiction.description}</p>
        )}
      </header>

      {/* Above everything, because it governs how every other fact on the page
          should be read. */}
      <div
        className={`mt-8 rounded-lg border px-4 py-3 ${TONE_CLASSES[verificationMeta?.tone ?? 'neutral']}`}
      >
        <p className="text-sm font-medium">{verificationMeta?.label}</p>
        <p className="mt-1 text-sm text-fg-secondary">{verificationMeta?.explanation}</p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Declared support</CardTitle>
            </CardHeader>
            <CardContent>
              {support.supporterCount === 0 ? (
                <p className="text-sm text-fg-secondary">
                  Nobody has published a split naming this body yet. The first person to do so
                  starts the record.
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-6 sm:grid-cols-3">
                    <Stat value={String(support.supporterCount)} label="published splits name it" />
                    <Stat value={`${support.medianShare}%`} label="median share" />
                    <Stat value={`${support.averageShare}%`} label="mean share" />
                  </div>
                  {/* Median first, mean second, and both shown: on a small,
                      self-selected sample the two diverging is the interesting
                      signal, and reporting only one hides it. */}
                  <p className="text-sm text-fg-secondary">
                    Counted from public, active directives only. This is what people say should
                    reach this body — not what it has received.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What this tier does</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-base text-fg-secondary">{levelMeta?.description}</p>
              {levelMeta && (
                <p className="text-sm text-fg-tertiary">
                  Also called: {levelMeta.localNames.join(', ')}.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Facts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {budget !== null && (
                <Row
                  label={`Budget${jurisdiction.budget_year ? ` (${jurisdiction.budget_year})` : ''}`}
                  value={formatAmount(budget, currency)}
                />
              )}
              {typeof jurisdiction.population === 'number' && (
                <Row
                  label="Population"
                  value={new Intl.NumberFormat('de-CH').format(jurisdiction.population)}
                />
              )}
              {typeof jurisdiction.region_code === 'string' && jurisdiction.region_code && (
                <Row label="Region code" value={jurisdiction.region_code} />
              )}
              {budget !== null && support.medianShare > 0 && (
                // The share made concrete: a percentage of an unstated total
                // means nothing, so it is multiplied through the one total the
                // body itself publishes.
                <Row
                  label="Median share of budget"
                  value={formatAmount((budget * support.medianShare) / 100, currency)}
                />
              )}
            </CardContent>
          </Card>

          {(typeof jurisdiction.official_url === 'string' && jurisdiction.official_url) ||
          (typeof jurisdiction.budget_url === 'string' && jurisdiction.budget_url) ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {typeof jurisdiction.official_url === 'string' && jurisdiction.official_url && (
                  <ExternalRow label="Official site" href={jurisdiction.official_url} />
                )}
                {typeof jurisdiction.budget_url === 'string' && jurisdiction.budget_url && (
                  <ExternalRow label="Published budget" href={jurisdiction.budget_url} />
                )}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-fg-secondary">
                {verificationMeta?.canReceive
                  ? 'This body has proved control of its page, so contributions routed here reach it.'
                  : 'Naming this body in your allocation records what you think should happen. It is what gives the body a reason to claim this page.'}
              </p>
              <Link
                href="/dashboard/allocations/create"
                className="mt-3 inline-block text-sm font-medium text-accent-warm hover:underline"
              >
                State your split →
              </Link>
            </CardContent>
          </Card>
        </aside>
      </div>
    </article>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-semibold tabular-nums text-fg-primary">{value}</p>
      <p className="mt-1 text-sm text-fg-secondary">{label}</p>
    </div>
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

function ExternalRow({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-baseline justify-between gap-4 hover:underline"
    >
      <span className="text-fg-secondary">{label}</span>
      <span className="truncate text-right font-medium text-fg-primary">{hostOf(href)}</span>
    </a>
  );
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function placeLabel(jurisdiction: Record<string, unknown>): string | null {
  const parts = [
    jurisdiction.locality as string | null,
    (jurisdiction.region_code as string | null) ?? (jurisdiction.country_code as string | null),
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : null;
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default JurisdictionProfile;
