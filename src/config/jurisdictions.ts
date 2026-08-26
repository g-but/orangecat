/**
 * Jurisdiction SSOT — the levels of government a person can allocate toward.
 *
 * "Local, state, federal" is how the right is usually stated, and it is one
 * country's shape. The tiers below are the general form: a strictly ordered
 * containment chain from the place you live up to the largest body that taxes
 * you. `rank` is the ordering, and it is the same ordering the database trigger
 * `jurisdictions_check_parent_rank` enforces — a parent must always outrank its
 * child, which is also what makes a cycle in the chain impossible.
 *
 * The vocabulary per country differs (Gemeinde/Kanton/Bund, city/state/federal,
 * commune/département/république); `localNames` carries the common ones so a
 * page can say "canton" to someone in Zürich and "state" to someone in Texas
 * without inventing a second set of levels.
 */

import { Building2, Landmark, Map as MapIcon, Flag, Globe2, type LucideIcon } from 'lucide-react';

export const JURISDICTION_LEVELS = [
  'local',
  'district',
  'regional',
  'national',
  'supranational',
] as const;

export type JurisdictionLevel = (typeof JURISDICTION_LEVELS)[number];

export interface JurisdictionLevelMeta {
  level: JurisdictionLevel;
  /** Containment rank. Higher contains lower. Mirrors jurisdiction_level_rank() in SQL. */
  rank: number;
  label: string;
  /** What this tier typically pays for — shown as the one-line "why this matters". */
  description: string;
  /** Names this tier goes by in common systems, for copy that adapts to the reader. */
  localNames: string[];
  icon: LucideIcon;
}

export const JURISDICTION_LEVEL_META: Record<JurisdictionLevel, JurisdictionLevelMeta> = {
  local: {
    level: 'local',
    rank: 1,
    label: 'Local',
    description:
      'Schools, transit, utilities, streets, social services — the tier you can walk to.',
    localNames: ['municipality', 'city', 'commune', 'Gemeinde', 'town'],
    icon: Building2,
  },
  district: {
    level: 'district',
    rank: 2,
    label: 'District',
    description: 'Courts, land registry and shared services between municipalities.',
    localNames: ['district', 'county', 'Bezirk', 'département', 'borough'],
    icon: MapIcon,
  },
  regional: {
    level: 'regional',
    rank: 3,
    label: 'Regional',
    description: 'Education, health, policing, roads — the tier most people underestimate.',
    localNames: ['canton', 'state', 'province', 'Land', 'region'],
    icon: Landmark,
  },
  national: {
    level: 'national',
    rank: 4,
    label: 'National',
    description: 'Defence, foreign affairs, social insurance, national infrastructure.',
    localNames: ['federal', 'national', 'Bund', 'confederation'],
    icon: Flag,
  },
  supranational: {
    level: 'supranational',
    rank: 5,
    label: 'Supranational',
    description: 'Union-level budgets and treaty bodies above the national tier.',
    localNames: ['union', 'supranational'],
    icon: Globe2,
  },
};

/** Levels ordered from the place you live outward. The order every UI should use. */
export const JURISDICTION_LEVELS_BY_RANK: JurisdictionLevel[] = [...JURISDICTION_LEVELS].sort(
  (a, b) => JURISDICTION_LEVEL_META[a].rank - JURISDICTION_LEVEL_META[b].rank
);

export function jurisdictionLevelRank(level: JurisdictionLevel): number {
  return JURISDICTION_LEVEL_META[level].rank;
}

export function isJurisdictionLevel(value: string): value is JurisdictionLevel {
  return (JURISDICTION_LEVELS as readonly string[]).includes(value);
}

/**
 * Whether `parent` may contain `child`. The single rule: strictly higher rank.
 * Kept here as well as in SQL so a form can reject the pairing before a round
 * trip, with the same answer the database would give.
 */
export function canContain(parent: JurisdictionLevel, child: JurisdictionLevel): boolean {
  return jurisdictionLevelRank(parent) > jurisdictionLevelRank(child);
}

// ==================== VERIFICATION ====================

export const JURISDICTION_VERIFICATION_STATUSES = [
  'unclaimed',
  'pending',
  'verified',
  'disputed',
] as const;

export type JurisdictionVerificationStatus = (typeof JURISDICTION_VERIFICATION_STATUSES)[number];

export interface VerificationMeta {
  label: string;
  /** Said plainly on the page. A vague badge here is worse than none. */
  explanation: string;
  /** Whether money may actually be routed to this body. */
  canReceive: boolean;
  tone: 'neutral' | 'warning' | 'positive' | 'negative';
}

export const JURISDICTION_VERIFICATION_META: Record<
  JurisdictionVerificationStatus,
  VerificationMeta
> = {
  unclaimed: {
    label: 'Unclaimed',
    explanation:
      'Listed by the community. This body has not claimed the page, so nothing can be paid to it here — an allocation naming it records intent, not a transfer.',
    canReceive: false,
    tone: 'neutral',
  },
  pending: {
    label: 'Claim under review',
    explanation:
      'Someone has claimed this page on the body’s behalf. Evidence is being checked; payments stay closed until it is.',
    canReceive: false,
    tone: 'warning',
  },
  verified: {
    label: 'Verified',
    explanation:
      'The body proved control of this page and its published payment details. Contributions routed here reach it.',
    canReceive: true,
    tone: 'positive',
  },
  disputed: {
    label: 'Disputed',
    explanation: 'A claim on this page is contested. Payments are closed until it is resolved.',
    canReceive: false,
    tone: 'negative',
  },
};

/** Whether contributions may be routed to a body in this state. */
export function jurisdictionCanReceive(status: JurisdictionVerificationStatus): boolean {
  return JURISDICTION_VERIFICATION_META[status].canReceive;
}

export const JURISDICTION_STATUSES = ['draft', 'active', 'paused', 'archived'] as const;
export type JurisdictionStatus = (typeof JURISDICTION_STATUSES)[number];
