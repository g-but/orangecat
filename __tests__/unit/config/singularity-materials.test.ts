/**
 * The Substrate Materials profile has to survive contact with the live schema.
 *
 * The company config is written once and pushed to production by a seed that
 * talks straight to PostgREST, so a bad enum value or a price of zero doesn't
 * fail in CI — it fails halfway through a seed run against the real database,
 * with some rows written and some not. These tests are the cheap version of
 * that discovery: they hold the payloads against the CHECK constraints in
 * supabase/migrations/20240101000001_baseline_public_schema.sql and against the
 * group label / feature / governance registries.
 *
 * They also hold the company to its own mandate — every listing has to trace to
 * one of the three curves, which is what "solely focused" means here.
 */

import {
  CATALOGUE,
  COMPANY,
  DESKS,
  GROUP_FEATURE_KEYS,
  GROUP_PAYLOAD,
  MANDATE_CURVES,
  PRODUCT_PAYLOADS,
  deskFor,
} from '@/config/singularity-materials';
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

describe('Substrate Materials — group profile payload', () => {
  it('uses a label, governance preset and visibility the platform knows', () => {
    expect(Object.keys(GROUP_LABELS)).toContain(GROUP_PAYLOAD.label);
    expect(Object.keys(GOVERNANCE_PRESETS)).toContain(GROUP_PAYLOAD.governance_preset);
    expect(GROUP_VISIBILITIES).toContain(GROUP_PAYLOAD.visibility);
  });

  it('is publicly readable, because a counterparty reads before it quotes', () => {
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

describe('Substrate Materials — catalogue', () => {
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

describe('Substrate Materials — the mandate is enforced, not just stated', () => {
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
});
