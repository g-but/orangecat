/**
 * Organization Entity Configuration
 *
 * Created: 2025-12-25
 * Last Modified: 2025-12-25
 * Last Modified Summary: Initial creation of organization entity configuration
 */

import { EntityConfig } from '@/types/entity';
import Link from 'next/link';
import Button from '@/components/ui/Button';

/**
 * Organization entity as returned by the API
 * Matches the database schema for organizations table
 */
export interface OrganizationEntity {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  type: string;
  governance_model: string;
  is_public: boolean;
  requires_approval?: boolean;
  transparency_score?: number;
  website_url?: string | null;
  treasury_address?: string | null;
  lightning_address?: string | null;
  category?: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
  created_by: string;
  created_at: string;
  updated_at?: string;
  // Required for BaseEntity compatibility
  title: string;
  thumbnail_url?: string | null;
}

/**
 * Transform database organization to entity format
 */
export function toOrganizationEntity(org: Omit<OrganizationEntity, 'title' | 'thumbnail_url'>): OrganizationEntity {
  return {
    ...org,
    title: org.name,
    thumbnail_url: org.avatar_url,
  };
}

export const organizationEntityConfig: EntityConfig<OrganizationEntity> = {
  name: 'Organization',
  namePlural: 'Organizations',
  colorTheme: 'purple',

  listPath: '/dashboard/organizations',
  detailPath: (id) => `/organizations/${id}`,
  createPath: '/organizations/create',
  editPath: (id) => `/organizations/${id}/settings`,

  apiEndpoint: '/api/organizations',

  makeHref: (org) => `/organizations/${org.slug}`,

  makeCardProps: (org) => {
    // Build type/governance label
    const typeLabel = org.type
      ? org.type.charAt(0).toUpperCase() + org.type.slice(1)
      : undefined;

    // Build governance model label
    const governanceLabel = org.governance_model
      ? org.governance_model.replace(/_/g, ' ')
      : undefined;

    return {
      badge: org.is_public ? 'Public' : 'Private',
      badgeVariant: org.is_public ? 'success' : 'default',
      metadata: (
        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
          {typeLabel && <span className="capitalize">{typeLabel}</span>}
          {governanceLabel && <span className="capitalize">{governanceLabel}</span>}
          {org.transparency_score !== undefined && org.transparency_score > 0 && (
            <span>{org.transparency_score}% transparent</span>
          )}
        </div>
      ),
      showEditButton: true,
      editHref: `/organizations/${org.slug}/settings`,
      actions: (
        <Link href={`/organizations/${org.slug}/settings`}>
          <Button size="sm" variant="outline">
            Manage
          </Button>
        </Link>
      ),
    };
  },

  emptyState: {
    title: 'No organizations yet',
    description: 'Create your first organization to collaborate with others, manage shared resources, and build together.',
    action: (
      <Link href="/organizations/create">
        <Button className="bg-gradient-to-r from-purple-600 to-purple-700">
          Create Organization
        </Button>
      </Link>
    ),
  },

  gridCols: {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  },
};
