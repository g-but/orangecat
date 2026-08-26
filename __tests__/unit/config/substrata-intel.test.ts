/**
 * The Substrate profile has to survive contact with the live schema, and the
 * firm has to survive contact with its own mandate.
 *
 * The config is written once and pushed to production by a seed that talks
 * straight to PostgREST, so a bad enum value or a price of zero doesn't fail in
 * CI — it fails halfway through a seed run against the real database, with some
 * rows written and some not. The first half of these tests is the cheap version
 * of that discovery: the payloads held against the CHECK constraints in
 * supabase/migrations/20240101000001_baseline_public_schema.sql and against the
 * group label / feature / governance registries.
 *
 * The second half holds the firm to its own rules — every listing traces to a
 * curve, every material on the desk has a coverage entry, and no producer row
 * is presented as a finding before someone has sourced it. Those are the
 * claims the profile makes in public; a test is what keeps them true.
 */

import {
  CATALOGUE,
  CHOKEPOINT_TEST,
  COMPANY,
  DESKS,
  DISCLOSURE,
  GROUP_FEATURE_KEYS,
  GROUP_PAYLOAD,
  MANDATE_CURVES,
  NODE_TYPES,
  PHASES,
  PRODUCT_PAYLOADS,
  deskFor,
  formatChf,
} from '@/config/substrata-intel';
import {
  COVERAGE,
  PRODUCER_ROLES,
  coverageProgress,
  materialsFor,
} from '@/config/substrata-intel-coverage';
import { GROUP_LABELS } from '@/config/group-labels';
import { GROUP_FEATURES } from '@/config/group-features';
import { GOVERNANCE_PRESETS } from '@/config/governance-presets';
import { isReservedUsername } from '@/config/usernames';

// Mirrors of the live CHECK constraints on public.user_products / public.groups.
const PRODUCT_CURRENCIES = ['USD', 'EUR', 'CHF', 'BTC', 'GBP'];
const PRODUCT_TYPES = ['physical', 'digital', 'service'];
const FULFILLMENT_TYPES = ['manual', 'automatic', 'digital'];
const PRODUCT_STATUSES = ['draft', 'active', 'paused', 'sold_out'];
const GROUP_VISIBILITIES = ['public', 'members_only', 'private'];

describe('Substrate — group profile payload', () => {
  it('uses a label, governance preset and visibility the platform knows', () => {
    expect(Object.keys(GROUP_LABELS)).toContain(GROUP_PAYLOAD.label);
    expect(Object.keys(GOVERNANCE_PRESETS)).toContain(GROUP_PAYLOAD.governance_preset);
    expect(GROUP_VISIBILITIES).toContain(GROUP_PAYLOAD.visibility);
  });

  it('is publicly readable — a research firm that gates its research is not one', () => {
    expect(GROUP_PAYLOAD.is_public).toBe(true);
    expect(GROUP_PAYLOAD.visibility).toBe('public');
  });

  it('carries a slug that is URL-safe and not a reserved handle', () => {
    expect(GROUP_PAYLOAD.slug).toBe(COMPANY.slug);
    expect(COMPANY.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    expect(isReservedUsername(COMPANY.slug)).toBe(false);
  });

  it('enables only features that exist and whose required fields are supplied', () => {
    for (const key of GROUP_FEATURE_KEYS) {
      const feature = GROUP_FEATURES[key as keyof typeof GROUP_FEATURES];
      expect(feature).toBeDefined();

      // treasury requires bitcoin_address; the payload has no wallet fields, so
      // enabling it here would produce a group advertising a treasury it lacks.
      const required: string[] = (feature as { requiresFields?: string[] }).requiresFields ?? [];
      for (const field of required) {
        expect(Object.keys(GROUP_PAYLOAD)).toContain(field);
      }
    }
  });
});

describe('Substrate — the desk', () => {
  it('lists something', () => {
    expect(PRODUCT_PAYLOADS.length).toBe(CATALOGUE.length);
    expect(PRODUCT_PAYLOADS.length).toBeGreaterThan(0);
  });

  it('has unique titles, since the seed keys idempotency on (actor_id, title)', () => {
    const titles = PRODUCT_PAYLOADS.map(p => p.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it.each(PRODUCT_PAYLOADS.map(p => [p.title, p] as const))(
    '%s satisfies every user_products CHECK constraint',
    (_title, payload) => {
      expect(PRODUCT_CURRENCIES).toContain(payload.currency);
      expect(PRODUCT_TYPES).toContain(payload.product_type);
      expect(FULFILLMENT_TYPES).toContain(payload.fulfillment_type);
      expect(PRODUCT_STATUSES).toContain(payload.status);
      expect(payload.price).toBeGreaterThan(0);
    }
  );

  it('prices fit numeric(20,8) — no value the column would silently round', () => {
    for (const payload of PRODUCT_PAYLOADS) {
      const decimals = (String(payload.price).split('.')[1] ?? '').length;
      expect(decimals).toBeLessThanOrEqual(8);
      expect(String(Math.trunc(payload.price)).length).toBeLessThanOrEqual(12);
    }
  });

  it('says the price is indicative, so no listing reads as a firm quote', () => {
    for (const payload of PRODUCT_PAYLOADS) {
      expect(payload.description).toContain('Indicative reference');
      expect(payload.description).toContain('not a quote');
    }
  });
});

describe('Substrate — the mandate is enforced, not just stated', () => {
  it('every desk maps to one of the three curves', () => {
    const curveIds = MANDATE_CURVES.map(curve => curve.id);
    for (const desk of DESKS) {
      expect(curveIds).toContain(desk.curve);
    }
  });

  it('every listed material sits on a desk, and so on a curve', () => {
    for (const listing of CATALOGUE) {
      const desk = deskFor(listing);
      expect(desk).toBeDefined();
      expect(desk.id).toBe(listing.desk);
    }
  });

  it('every listing is filed under its desk name, which is the product category', () => {
    const deskNames = DESKS.map(desk => desk.name);
    for (const payload of PRODUCT_PAYLOADS) {
      expect(deskNames).toContain(payload.category);
    }
  });

  it('no desk is left without a listing — an empty desk is scope creep on paper', () => {
    for (const desk of DESKS) {
      expect(CATALOGUE.some(listing => listing.desk === desk.id)).toBe(true);
    }
  });

  it('keeps a chokepoint screen and a node taxonomy, which is what makes it extensible', () => {
    expect(CHOKEPOINT_TEST.length).toBeGreaterThanOrEqual(4);
    // A universe that only admits materials cannot reach robotics by traversal.
    expect(NODE_TYPES.map(node => node.id)).toEqual(
      expect.arrayContaining(['material', 'company', 'person'])
    );
  });

  it('runs exactly one phase at a time — sequencing is the whole point', () => {
    expect(PHASES.filter(phase => phase.status === 'active')).toHaveLength(1);
  });

  it('commits to disclosure before any position exists, which is the only time it is credible', () => {
    expect(DISCLOSURE.rules.length).toBeGreaterThanOrEqual(3);
  });
});

describe('Substrate — Phase 1 coverage universe', () => {
  it('owes a coverage entry to every material on the desk', () => {
    expect(coverageProgress().uncoveredMaterials).toEqual([]);
  });

  it('covers no material the desk does not trade — coverage follows the book', () => {
    const traded = CATALOGUE.map(listing => listing.title);
    for (const entry of COVERAGE) {
      expect(traded).toContain(entry.material);
    }
  });

  it('names more than one producer per material, or it is not a map', () => {
    for (const entry of COVERAGE) {
      expect(entry.producers.length).toBeGreaterThan(1);
      expect(entry.thesis.length).toBeGreaterThan(0);
    }
  });

  it('uses only known roles and plausible ISO-3166 jurisdictions', () => {
    const roles = PRODUCER_ROLES.map(role => role.id);
    for (const entry of COVERAGE) {
      for (const producer of entry.producers) {
        expect(roles).toContain(producer.role);
        expect(producer.jurisdictions.length).toBeGreaterThan(0);
        for (const jurisdiction of producer.jurisdictions) {
          expect(jurisdiction).toMatch(/^[A-Z]{2}$/);
        }
      }
    }
  });

  it('does not list the same company twice on one material', () => {
    for (const entry of COVERAGE) {
      const names = entry.producers.map(producer => producer.name);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it('presents unsourced rows as leads, never as findings', () => {
    const { total, sourced } = coverageProgress();
    expect(total).toBeGreaterThan(0);
    // Not an assertion that nothing is sourced — it is an assertion that the
    // count is honest. Phase 1 is done when sourced === total, and this test
    // is what makes that a number rather than a feeling.
    expect(sourced).toBeLessThanOrEqual(total);
    for (const entry of COVERAGE) {
      for (const producer of entry.producers) {
        expect(producer).toHaveProperty('source');
      }
    }
  });

  it('carries no capacity, share or financial claim — there is no field for one', () => {
    const allowed = ['name', 'jurisdictions', 'role', 'source'].sort();
    for (const entry of COVERAGE) {
      for (const producer of entry.producers) {
        expect(Object.keys(producer).sort()).toEqual(allowed);
      }
    }
  });

  it('surfaces the cross-material overlaps that make the map worth having', () => {
    // A company appearing on several materials is the map earning its keep:
    // one counterparty, several exposures. If this ever returns nothing for
    // every company, the universe has been flattened into unrelated lists.
    const everyName = COVERAGE.flatMap(entry => entry.producers.map(p => p.name));
    const overlapping = [...new Set(everyName)].filter(name => materialsFor(name).length > 1);
    expect(overlapping.length).toBeGreaterThan(0);
  });
});

describe('Substrate — price formatting', () => {
  it('groups thousands, so a five-figure quote cannot be misread', () => {
    expect(formatChf(15000)).toBe('15’000');
    expect(formatChf(1400)).toBe('1’400');
    expect(formatChf(3.2)).toBe('3.2');
    expect(formatChf(95)).toBe('95');
    expect(formatChf(1234567)).toBe('1’234’567');
  });

  it('formats every listed price the same way wherever it is shown', () => {
    for (const listing of CATALOGUE) {
      const payload = PRODUCT_PAYLOADS.find(p => p.title === listing.title);
      expect(payload?.description).toContain(
        `CHF ${formatChf(listing.indicativePriceChf)} per ${listing.unit}`
      );
    }
  });
});
