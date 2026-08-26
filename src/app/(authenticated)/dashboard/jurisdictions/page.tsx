'use client';

import EntityDashboardPage from '@/components/entity/EntityDashboardPage';
import {
  jurisdictionEntityConfig,
  type JurisdictionListItem,
} from '@/config/entities/jurisdictions';

/**
 * Jurisdictions dashboard — the civic directory.
 */
export default function JurisdictionsPage() {
  return (
    <EntityDashboardPage<JurisdictionListItem>
      config={jurisdictionEntityConfig}
      title="Jurisdictions"
      description="Government bodies you can direct money toward. Listing one is not claiming it — every entry starts unclaimed."
      createButtonLabel="Add a body"
    />
  );
}
