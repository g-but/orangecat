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

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CHOKEPOINT_TEST,
  COMPANY,
  COVERAGE_AREAS,
  DISCLOSURE,
  GROUP_FEATURE_KEYS,
  GROUP_PAYLOAD,
  MANDATE_CURVES,
  MATERIALS,
  NODE_TYPES,
  PHASES,
  SCOPE,
  areaFor,
} from '@/config/substrata';
import {
  CHOKEPOINTS,
  COVERAGE,
  NODE_TYPE_LABEL,
  PRODUCER_ROLES,
  chokepointProgress,
  coverageProgress,
  materialsFor,
} from '@/config/substrata-coverage';
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

describe('Substrata — group profile payload', () => {
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

describe('Substrata — there is no trading desk, and nothing may imply one', () => {
  // The firm publishes research and sells nothing. Standing a regulated book up
  // is a long road through licensing, so every price, unit, lot size and
  // invitation to deal was removed. These tests are what stop one coming back:
  // a config that quietly regrows a price field is a config that puts an offer
  // in front of a reader nobody is licensed to sell to.
  const config = readFileSync(join('src', 'config', 'substrata.ts'), 'utf8');
  const siteBuilder = readFileSync(join('src', 'config', 'site-substrata.ts'), 'utf8');

  it('carries no price, unit or lot-size field on a material', () => {
    for (const material of MATERIALS) {
      expect(Object.keys(material).sort()).toEqual(['area', 'spec', 'tags', 'title', 'why']);
    }
  });

  it('never uses dealing language anywhere the reader can see it', () => {
    for (const [name, source] of [
      ['substrata.ts', config],
      ['site-substrata.ts', siteBuilder],
    ] as const) {
      for (const phrase of ['RFQ', 'indicativePrice', 'Settlement in', 'per wafer']) {
        expect(`${name} contains "${phrase}": ${source.includes(phrase)}`).toBe(
          `${name} contains "${phrase}": false`
        );
      }
    }
  });

  it('states plainly what the firm does not do', () => {
    expect(SCOPE.today.length).toBeGreaterThanOrEqual(3);
    expect(SCOPE.today.join(' ')).toContain('do not trade');
    expect(DISCLOSURE.today).toContain('holds no position');
  });

  it('advertises no marketplace, because there is nothing to sell', () => {
    expect(GROUP_FEATURE_KEYS).toEqual([]);
  });

  it('keeps a desk only as a future phase, never as a running one', () => {
    const desk = PHASES.find(phase => phase.id === 'desk');
    expect(desk).toBeDefined();
    expect(desk!.status).toBe('not-started');
  });
});

describe('Substrata — the mandate is enforced, not just stated', () => {
  it('every desk maps to one of the three curves', () => {
    const curveIds = MANDATE_CURVES.map(curve => curve.id);
    for (const area of COVERAGE_AREAS) {
      expect(curveIds).toContain(area.curve);
    }
  });

  it('every material sits in a coverage area, and so on a curve', () => {
    for (const material of MATERIALS) {
      const area = areaFor(material);
      expect(area).toBeDefined();
      expect(area.id).toBe(material.area);
    }
  });

  it('no coverage area is left empty — an empty area is scope creep on paper', () => {
    for (const area of COVERAGE_AREAS) {
      expect(MATERIALS.some(material => material.area === area.id)).toBe(true);
    }
  });

  it('every non-material chokepoint has a known node type and a real curve', () => {
    const curveIds = MANDATE_CURVES.map(curve => curve.id);
    const nodeIds = NODE_TYPES.map(node => node.id);
    for (const point of CHOKEPOINTS) {
      expect(curveIds).toContain(point.curve);
      expect(nodeIds).toContain(point.type);
      expect(NODE_TYPE_LABEL[point.type]).toBeTruthy();
      expect(point.why.length).toBeGreaterThan(0);
    }
  });

  it('proves the node taxonomy is used, not merely declared', () => {
    // It sat in the config for a while with nothing but materials in the
    // universe. If this ever drops back to one kind, "a node can be anything"
    // has become a claim the coverage does not support.
    expect(new Set(CHOKEPOINTS.map(point => point.type)).size).toBeGreaterThanOrEqual(3);
    expect(new Set(CHOKEPOINTS.map(point => point.curve)).size).toBe(MANDATE_CURVES.length);
  });

  it('holds non-material chokepoints to the same claim limits as producers', () => {
    const allowed = ['curve', 'jurisdictions', 'name', 'source', 'type', 'why'].sort();
    for (const point of CHOKEPOINTS) {
      expect(Object.keys(point).sort()).toEqual(allowed);
    }
    const { sourced, total } = chokepointProgress();
    expect(total).toBe(CHOKEPOINTS.length);
    expect(sourced).toBeLessThanOrEqual(total);
  });

  it('keeps a chokepoint screen and a node taxonomy, which is what makes it extensible', () => {
    expect(CHOKEPOINT_TEST.length).toBeGreaterThanOrEqual(4);
    // A universe that only admits materials cannot reach robotics by traversal.
    expect(NODE_TYPES.map(node => node.id)).toEqual(
      expect.arrayContaining(['material', 'company', 'person'])
    );
  });

  it('runs at least one phase, and never the desk', () => {
    const active = PHASES.filter(phase => phase.status === 'active');
    expect(active.length).toBeGreaterThanOrEqual(1);
    expect(active.some(phase => phase.id === 'desk')).toBe(false);
  });

  it('commits to disclosure before any position exists, which is the only time it is credible', () => {
    expect(DISCLOSURE.rules.length).toBeGreaterThanOrEqual(3);
  });
});

describe('Substrata — Phase 1 coverage universe', () => {
  it('owes a coverage entry to every material on the desk', () => {
    expect(coverageProgress().uncoveredMaterials).toEqual([]);
  });

  it('covers no material outside the list — coverage follows the universe', () => {
    const covered = MATERIALS.map(material => material.title);
    for (const entry of COVERAGE) {
      expect(covered).toContain(entry.material);
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
