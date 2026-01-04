/**
 * Project Entity Configuration
 *
 * Following Engineering Principles:
 * - DRY: Uses shared EntityConfig pattern
 * - SSOT: Paths reference entity-registry.ts values
 * - Consistency: Same structure as products, services, loans
 *
 * Created: 2025-12-31
 * Last Modified: 2025-12-31
 * Last Modified Summary: Initial creation of project entity configuration
 */

import { EntityConfig } from '@/types/entity';
import Link from 'next/link';
import Button from '@/components/ui/Button';

// Project type for EntityList usage
export interface ProjectListItem {
  id: string;
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  goal_amount?: number | null;
  total_funding?: number;
  current_amount?: number;
  currency?: string;
  category?: string;
  status?: string;
  isDraft?: boolean;
  isActive?: boolean;
  isPaused?: boolean;
  tags?: string[];
}

export const projectEntityConfig: EntityConfig<ProjectListItem> = {
  name: 'Project',
  namePlural: 'Projects',
  colorTheme: 'orange',

  listPath: '/dashboard/projects',
  detailPath: (id) => `/projects/${id}`,
  createPath: '/dashboard/projects/create',
  editPath: (id) => `/projects/${id}/edit`,

  apiEndpoint: '/api/projects',

  makeHref: (project) => `/projects/${project.id}`,

  makeCardProps: (project) => {
    // Format funding progress
    const fundingLabel = project.goal_amount
      ? `${(project.current_amount || project.total_funding || 0).toLocaleString()} / ${project.goal_amount.toLocaleString()} ${project.currency || 'SATS'}`
      : project.total_funding
        ? `${project.total_funding.toLocaleString()} ${project.currency || 'SATS'}`
        : undefined;

    // Calculate progress percentage
    const progress = project.goal_amount && project.goal_amount > 0
      ? Math.round(((project.current_amount || project.total_funding || 0) / project.goal_amount) * 100)
      : 0;

    // Build metadata parts
    const metadataParts: string[] = [];
    if (project.category) {
      metadataParts.push(project.category);
    }

    return {
      priceLabel: fundingLabel,
      badge: project.isDraft ? 'Draft' :
             project.isActive ? 'Active' :
             project.isPaused ? 'Paused' :
             project.status === 'completed' ? 'Completed' :
             project.status === 'cancelled' ? 'Cancelled' : undefined,
      badgeVariant: project.isDraft ? 'default' :
                    project.isActive ? 'success' :
                    project.isPaused ? 'warning' :
                    project.status === 'completed' ? 'success' :
                    project.status === 'cancelled' ? 'destructive' : 'default',
      metadata: metadataParts.length > 0 || progress > 0 ? (
        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
          {metadataParts.map((part, idx) => (
            <span key={idx} className="capitalize">
              {part}
            </span>
          ))}
          {progress > 0 && (
            <span className="text-orange-600 font-medium">
              {progress}% funded
            </span>
          )}
        </div>
      ) : undefined,
      showEditButton: true,
      editHref: `/projects/${project.id}/edit`,
    };
  },

  emptyState: {
    title: 'No projects yet',
    description: 'Create your first project to start accepting Bitcoin donations and building support for your cause.',
    action: (
      <Link href="/dashboard/projects/create">
        <Button className="bg-gradient-to-r from-orange-600 to-orange-700">
          Create Project
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
