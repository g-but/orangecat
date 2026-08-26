/**
 * Civic allocation SSOT — how a person states where their public money goes.
 *
 * The claim: a person should be able to direct what share of their taxes and
 * contributions reaches their municipality, their region, and their federation.
 * This file holds the vocabulary for that statement (what is being split, how
 * often, and the starting shapes people actually reach for) so the form, the
 * public page, the API and the Cat all describe it with the same words.
 *
 * Where the arithmetic lives: shares must total exactly 100 before a directive
 * can leave draft. That rule is enforced in the database
 * (civic_allocation_assert_balanced) and mirrored in the Zod schema
 * (src/lib/validation/civic.ts) so the form can say so before a round trip.
 */

import { JURISDICTION_LEVEL_META, type JurisdictionLevel } from './jurisdictions';

// ==================== WHAT IS BEING SPLIT ====================

export const ALLOCATION_BASES = ['tax', 'voluntary', 'mixed'] as const;
export type AllocationBasis = (typeof ALLOCATION_BASES)[number];

export interface AllocationBasisMeta {
  value: AllocationBasis;
  label: string;
  description: string;
}

export const ALLOCATION_BASIS_META: Record<AllocationBasis, AllocationBasisMeta> = {
  tax: {
    value: 'tax',
    label: 'Taxes',
    description:
      'The statutory amount you already owe. Today its split is decided for you; this states how you would split it.',
  },
  voluntary: {
    value: 'voluntary',
    label: 'Voluntary contributions',
    description: 'Money you give to public bodies and causes on top of what you owe.',
  },
  mixed: {
    value: 'mixed',
    label: 'Both',
    description: 'One directive covering what you owe and what you give.',
  },
};

// ==================== HOW OFTEN ====================

export const ALLOCATION_CADENCES = ['per_payment', 'monthly', 'quarterly', 'annual'] as const;
export type AllocationCadence = (typeof ALLOCATION_CADENCES)[number];

export const ALLOCATION_CADENCE_LABELS: Record<AllocationCadence, string> = {
  per_payment: 'Every payment',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annual: 'Annually',
};

export const ALLOCATION_STATUSES = ['draft', 'active', 'paused', 'archived'] as const;
export type AllocationStatus = (typeof ALLOCATION_STATUSES)[number];

export const ALLOCATION_VISIBILITIES = ['public', 'unlisted', 'private'] as const;
export type AllocationVisibility = (typeof ALLOCATION_VISIBILITIES)[number];

// ==================== THE ARITHMETIC RULE ====================

/** Shares of a directive must total exactly this before it can leave draft. */
export const ALLOCATION_TOTAL_PERCENT = 100;

/**
 * Rounding tolerance when summing shares. Shares are stored as numeric(6,3), so
 * three decimals are exact in the database — but a UI that computes a remainder
 * in float can land on 99.99999999999999. Comparing against a tolerance keeps
 * the form's verdict identical to the database's.
 */
export const ALLOCATION_PERCENT_EPSILON = 0.0005;

export function allocationTotal(shares: readonly number[]): number {
  return shares.reduce((sum, share) => sum + share, 0);
}

export function isAllocationBalanced(shares: readonly number[]): boolean {
  return Math.abs(allocationTotal(shares) - ALLOCATION_TOTAL_PERCENT) < ALLOCATION_PERCENT_EPSILON;
}

/** Signed distance from balanced: negative = unassigned, positive = over-assigned. */
export function allocationRemainder(shares: readonly number[]): number {
  return allocationTotal(shares) - ALLOCATION_TOTAL_PERCENT;
}

// ==================== RECIPIENT SHAPES ====================

/**
 * A line points at exactly one of three things. The database enforces the
 * "exactly one" as a CHECK; this type is what the app reasons about.
 *
 * `entity` is the deliberate one. Once a line can name a cause or a project
 * that already lives on OrangeCat, the difference between a tax and a
 * contribution stops being a difference in kind and becomes a difference in who
 * decided — which is the whole argument this entity exists to make.
 */
export const ALLOCATION_RECIPIENT_KINDS = ['jurisdiction', 'entity', 'external'] as const;
export type AllocationRecipientKind = (typeof ALLOCATION_RECIPIENT_KINDS)[number];

export const ALLOCATION_RECIPIENT_KIND_LABELS: Record<AllocationRecipientKind, string> = {
  jurisdiction: 'A government body',
  entity: 'Something on OrangeCat',
  external: 'Somewhere else',
};

// ==================== STARTING SHAPES ====================

/**
 * Presets are starting points, not recommendations — every one of them is a
 * position, and the person is the one taking it. `statusQuo` is listed first on
 * purpose: the most honest default is the split that already applies to you, so
 * that every other preset reads as a move away from something real rather than
 * as a number the platform picked.
 *
 * Shares are keyed by level, and a preset only applies to the levels a person's
 * own residency chain actually has — `presetShares()` renormalises when a chain
 * is shorter (no district tier, say) so the result still totals 100.
 */
export interface AllocationPreset {
  id: string;
  label: string;
  description: string;
  /** Percent per level. Keys absent from a person's chain are redistributed. */
  shares: Partial<Record<JurisdictionLevel, number>>;
}

export const ALLOCATION_PRESETS: AllocationPreset[] = [
  {
    id: 'status_quo',
    label: 'What applies today',
    description:
      'The split your jurisdiction already applies, as published. Start here and change what you disagree with.',
    shares: { local: 30, regional: 30, national: 40 },
  },
  {
    id: 'subsidiarity',
    label: 'Closest first',
    description:
      'Decide as much as possible at the tier nearest the people affected; send upward only what has to go upward.',
    shares: { local: 55, regional: 30, national: 15 },
  },
  {
    id: 'balanced',
    label: 'Even thirds',
    description: 'Equal weight to each tier that taxes you.',
    shares: { local: 34, regional: 33, national: 33 },
  },
  {
    id: 'national_first',
    label: 'Shared risk first',
    description:
      'Weight the tier that pools risk widest — social insurance, defence, cross-region infrastructure.',
    shares: { local: 20, regional: 25, national: 55 },
  },
];

/**
 * Apply a preset to the levels a person's chain actually contains.
 *
 * Renormalises rather than dropping the remainder: a chain without a district
 * tier should still total 100, and silently returning 85 would produce a
 * directive the database refuses to activate for a reason the person never
 * caused. Shares are rounded to three decimals (the stored scale) with the
 * rounding drift absorbed by the largest line, so the total is exact.
 */
export function presetShares(
  preset: AllocationPreset,
  levels: readonly JurisdictionLevel[]
): Array<{ level: JurisdictionLevel; share: number }> {
  const present = levels.filter(level => (preset.shares[level] ?? 0) > 0);
  if (present.length === 0) {
    return [];
  }

  const rawTotal = present.reduce((sum, level) => sum + (preset.shares[level] ?? 0), 0);
  const scaled = present.map(level => ({
    level,
    share: round3(((preset.shares[level] ?? 0) / rawTotal) * ALLOCATION_TOTAL_PERCENT),
  }));

  // Absorb rounding drift into the largest share so the set totals exactly 100.
  const drift = round3(ALLOCATION_TOTAL_PERCENT - allocationTotal(scaled.map(s => s.share)));
  if (drift !== 0) {
    const largest = scaled.reduce((a, b) => (b.share > a.share ? b : a));
    largest.share = round3(largest.share + drift);
  }
  return scaled;
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/** One-line "what this tier pays for", for the level a share is pointed at. */
export function levelPurpose(level: JurisdictionLevel): string {
  return JURISDICTION_LEVEL_META[level].description;
}
