/**
 * ALLOCATION ENTITY CONFIGURATION
 *
 * List/dashboard display for civic allocation directives — an actor's split of
 * taxes and contributions across the tiers of government (and anything else
 * they choose to name).
 */

import { EntityConfig } from '@/types/entity';
import { ENTITY_REGISTRY } from '@/config/entity-registry';
import {
  ALLOCATION_BASIS_META,
  ALLOCATION_CADENCE_LABELS,
  type AllocationBasis,
  type AllocationCadence,
} from '@/config/civic-allocation';

export interface AllocationListItem {
  id: string;
  title: string;
  description: string | null;
  basis: AllocationBasis;
  cadence: AllocationCadence;
  period_start: string | null;
  period_end: string | null;
  currency: string;
  visibility: string;
  status: string;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

/** "2026", or "2026–2027" when a directive spans a boundary. */
function periodLabel(item: AllocationListItem): string | null {
  const startYear = item.period_start?.slice(0, 4);
  const endYear = item.period_end?.slice(0, 4);
  if (!startYear && !endYear) {
    return null;
  }
  if (startYear && endYear && startYear !== endYear) {
    return `${startYear}–${endYear}`;
  }
  return startYear ?? endYear ?? null;
}

export const allocationEntityConfig: EntityConfig<AllocationListItem> = {
  name: ENTITY_REGISTRY['allocation'].name,
  namePlural: ENTITY_REGISTRY['allocation'].namePlural,
  colorTheme: ENTITY_REGISTRY['allocation'].colorTheme,

  listPath: ENTITY_REGISTRY['allocation'].basePath,
  detailPath: id => `${ENTITY_REGISTRY['allocation'].basePath}/${id}`,
  createPath: ENTITY_REGISTRY['allocation'].createPath,
  editPath: id => `${ENTITY_REGISTRY['allocation'].createPath}?edit=${id}`,

  entityType: ENTITY_REGISTRY['allocation'].type,
  apiEndpoint: ENTITY_REGISTRY['allocation'].apiEndpoint,

  makeHref: item => `${ENTITY_REGISTRY['allocation'].basePath}/${item.id}`,

  makeCardProps: item => ({
    badge: ALLOCATION_BASIS_META[item.basis]?.label ?? 'Allocation',
    // A draft is shown as a draft. It is the state a directive spends real time
    // in — the split gets built after the directive exists — so hiding it would
    // hide the work in progress.
    status: item.status === 'active' ? 'active' : item.status,
    showEditButton: true,
    editHref: `${ENTITY_REGISTRY['allocation'].createPath}?edit=${item.id}`,
    metadata: (
      <div className="flex flex-wrap gap-2 text-xs text-fg-secondary">
        {periodLabel(item) && <span>{periodLabel(item)}</span>}
        <span>{ALLOCATION_CADENCE_LABELS[item.cadence] ?? item.cadence}</span>
        <span className="capitalize">{item.visibility}</span>
      </div>
    ),
  }),

  emptyState: {
    title: 'You have not stated a split yet',
    description:
      'Say what share of your taxes and contributions should reach your municipality, your region, and your federation.',
  },

  gridCols: {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  },
};
