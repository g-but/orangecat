/**
 * JURISDICTION ENTITY CONFIGURATION
 *
 * List/dashboard display for government bodies in the civic directory.
 */

import { EntityConfig } from '@/types/entity';
import { ENTITY_REGISTRY } from '@/config/entity-registry';
import {
  JURISDICTION_LEVEL_META,
  JURISDICTION_VERIFICATION_META,
  type JurisdictionLevel,
  type JurisdictionVerificationStatus,
} from '@/config/jurisdictions';

export interface JurisdictionListItem {
  id: string;
  title: string;
  description: string | null;
  level: JurisdictionLevel;
  country_code: string | null;
  region_code: string | null;
  locality: string | null;
  verification_status: JurisdictionVerificationStatus;
  status: string;
  created_at: string;
  [key: string]: unknown;
}

export const jurisdictionEntityConfig: EntityConfig<JurisdictionListItem> = {
  name: ENTITY_REGISTRY['jurisdiction'].name,
  namePlural: ENTITY_REGISTRY['jurisdiction'].namePlural,
  colorTheme: ENTITY_REGISTRY['jurisdiction'].colorTheme,

  listPath: ENTITY_REGISTRY['jurisdiction'].basePath,
  detailPath: id => `${ENTITY_REGISTRY['jurisdiction'].basePath}/${id}`,
  createPath: ENTITY_REGISTRY['jurisdiction'].createPath,
  editPath: id => `${ENTITY_REGISTRY['jurisdiction'].createPath}?edit=${id}`,

  entityType: ENTITY_REGISTRY['jurisdiction'].type,
  apiEndpoint: ENTITY_REGISTRY['jurisdiction'].apiEndpoint,

  makeHref: item => `${ENTITY_REGISTRY['jurisdiction'].basePath}/${item.id}`,

  makeCardProps: item => ({
    badge: JURISDICTION_LEVEL_META[item.level]?.label ?? 'Jurisdiction',
    status: item.status,
    showEditButton: true,
    editHref: `${ENTITY_REGISTRY['jurisdiction'].createPath}?edit=${item.id}`,
    metadata: (
      <div className="flex flex-wrap gap-2 text-xs text-fg-secondary">
        {(item.locality || item.region_code || item.country_code) && (
          <span>
            {[item.locality, item.region_code ?? item.country_code].filter(Boolean).join(' · ')}
          </span>
        )}
        {/* Said on the card, not only on the page: a reader scanning the
            directory needs to know which of these bodies can actually be paid
            before they click into one. */}
        <span>{JURISDICTION_VERIFICATION_META[item.verification_status]?.label}</span>
      </div>
    ),
  }),

  emptyState: {
    title: 'No government bodies listed yet',
    description:
      'Add the municipality, region or federation you want to be able to direct money toward.',
  },

  gridCols: {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  },
};
