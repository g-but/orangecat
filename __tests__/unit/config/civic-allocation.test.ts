/**
 * The split arithmetic.
 *
 * Worth pinning because the database refuses anything that is not exactly 100,
 * and every route to a published directive runs through these helpers. A preset
 * that lands on 99.999 is not a rounding curiosity — it is a directive a person
 * cannot publish, for a reason they did not cause and cannot see.
 */

import {
  ALLOCATION_TOTAL_PERCENT,
  allocationRemainder,
  allocationTotal,
  isAllocationBalanced,
  presetShares,
  ALLOCATION_PRESETS,
  type AllocationPreset,
} from '@/config/civic-allocation';
import {
  canContain,
  jurisdictionCanReceive,
  jurisdictionLevelRank,
  JURISDICTION_LEVELS,
  JURISDICTION_LEVELS_BY_RANK,
  JURISDICTION_VERIFICATION_STATUSES,
  type JurisdictionLevel,
} from '@/config/jurisdictions';

describe('allocation balance', () => {
  it('accepts an exact 100', () => {
    expect(isAllocationBalanced([45, 25, 20, 10])).toBe(true);
    expect(isAllocationBalanced([100])).toBe(true);
  });

  it('rejects under and over', () => {
    expect(isAllocationBalanced([45, 25, 20])).toBe(false);
    expect(isAllocationBalanced([60, 60])).toBe(false);
  });

  it('an empty split is not balanced', () => {
    // A directive with no lines says nothing, and must not be publishable.
    expect(isAllocationBalanced([])).toBe(false);
  });

  it('tolerates float drift that the numeric(6,3) column would not see', () => {
    // 33.333 * 3 in float arithmetic is 99.99900000000001 — the tolerance is
    // what keeps the form's verdict identical to the database's.
    expect(isAllocationBalanced([33.333, 33.333, 33.334])).toBe(true);
  });

  it('reports the remainder in the direction it needs to move', () => {
    expect(allocationRemainder([45, 25, 20])).toBeCloseTo(-10, 6);
    expect(allocationRemainder([60, 60])).toBeCloseTo(20, 6);
    expect(allocationRemainder([50, 50])).toBeCloseTo(0, 6);
  });

  it('totals what it is given', () => {
    expect(allocationTotal([])).toBe(0);
    expect(allocationTotal([1.5, 2.25])).toBeCloseTo(3.75, 6);
  });
});

describe('presetShares', () => {
  const FULL_CHAIN: JurisdictionLevel[] = ['local', 'regional', 'national'];

  it.each(ALLOCATION_PRESETS.map(p => [p.id, p] as const))(
    '%s totals exactly 100 on a full chain',
    (_id, preset: AllocationPreset) => {
      const shares = presetShares(preset, FULL_CHAIN).map(s => s.share);
      expect(allocationTotal(shares)).toBeCloseTo(ALLOCATION_TOTAL_PERCENT, 6);
      expect(isAllocationBalanced(shares)).toBe(true);
    }
  );

  it.each(ALLOCATION_PRESETS.map(p => [p.id, p] as const))(
    '%s still totals 100 when a tier is missing',
    (_id, preset: AllocationPreset) => {
      // A chain without a regional tier must renormalise, not silently return
      // 70 — which would produce a directive the database refuses to activate.
      const shares = presetShares(preset, ['local', 'national']).map(s => s.share);
      expect(isAllocationBalanced(shares)).toBe(true);
    }
  );

  it('renormalises a single-tier chain to the whole split', () => {
    const preset = ALLOCATION_PRESETS[0];
    const shares = presetShares(preset, ['local']);
    expect(shares).toHaveLength(1);
    expect(shares[0].share).toBeCloseTo(100, 6);
  });

  it('returns nothing when the chain shares no tier with the preset', () => {
    const preset = ALLOCATION_PRESETS[0];
    expect(presetShares(preset, ['supranational'])).toEqual([]);
    expect(presetShares(preset, [])).toEqual([]);
  });

  it('opens at the status quo', () => {
    // The first preset is the split that already applies, so that every other
    // preset reads as a move away from something real.
    expect(ALLOCATION_PRESETS[0].id).toBe('status_quo');
  });

  it('keeps shares at the scale the column stores', () => {
    for (const preset of ALLOCATION_PRESETS) {
      for (const { share } of presetShares(preset, FULL_CHAIN)) {
        expect(share).toBeCloseTo(Math.round(share * 1000) / 1000, 9);
      }
    }
  });
});

describe('jurisdiction levels', () => {
  it('ranks every level uniquely', () => {
    const ranks = JURISDICTION_LEVELS.map(jurisdictionLevelRank);
    expect(new Set(ranks).size).toBe(JURISDICTION_LEVELS.length);
  });

  it('orders by rank from the place you live outward', () => {
    expect(JURISDICTION_LEVELS_BY_RANK[0]).toBe('local');
    expect(JURISDICTION_LEVELS_BY_RANK.at(-1)).toBe('supranational');
    const ranks = JURISDICTION_LEVELS_BY_RANK.map(jurisdictionLevelRank);
    expect([...ranks].sort((a, b) => a - b)).toEqual(ranks);
  });

  it('lets a parent contain only strictly lower tiers', () => {
    expect(canContain('national', 'local')).toBe(true);
    expect(canContain('regional', 'local')).toBe(true);
    // The rule Postgres enforces, and the reason a cycle cannot form: an edge
    // may only ever point strictly upward.
    expect(canContain('local', 'national')).toBe(false);
    expect(canContain('local', 'local')).toBe(false);
  });

  it('mirrors the SQL rank function ordering', () => {
    // jurisdiction_level_rank() in 20260826180000_civic_allocation_entities.sql
    expect(JURISDICTION_LEVELS.map(jurisdictionLevelRank)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('jurisdiction verification', () => {
  it('lets only a verified body receive', () => {
    expect(jurisdictionCanReceive('verified')).toBe(true);
    for (const status of JURISDICTION_VERIFICATION_STATUSES) {
      if (status !== 'verified') {
        expect(jurisdictionCanReceive(status)).toBe(false);
      }
    }
  });

  it('defaults to the state that routes no money', () => {
    // The column default is `unclaimed`; if that ever became a receiving state
    // the whole open-directory design would silently invert.
    expect(jurisdictionCanReceive('unclaimed')).toBe(false);
  });
});
