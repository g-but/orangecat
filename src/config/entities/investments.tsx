/**
 * Investment Entity Configuration
 *
 * List/card display config for the investment entity.
 */

import { EntityConfig } from '@/types/entity';
import { Investment } from '@/types/investments';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { PLATFORM_DEFAULT_CURRENCY } from '@/config/currencies';
import { ENTITY_REGISTRY } from '@/config/entity-registry';
import { STATUS } from '@/config/database-constants';
import { ROUTES } from '@/config/routes';

export const investmentEntityConfig: EntityConfig<Investment> = {
  name: 'Investment',
  namePlural: 'Investments',
  colorTheme: 'green',

  listPath: ENTITY_REGISTRY['investment'].basePath,
  detailPath: id => `${ENTITY_REGISTRY['investment'].basePath}/${id}`,
  createPath: ENTITY_REGISTRY['investment'].createPath,
  editPath: id => `${ENTITY_REGISTRY['investment'].createPath}?edit=${id}`,

  apiEndpoint: ENTITY_REGISTRY['investment'].apiEndpoint,

  makeHref: investment => `${ENTITY_REGISTRY['investment'].basePath}/${investment.id}`,

  makeCardProps: investment => {
    const currency = investment.currency || PLATFORM_DEFAULT_CURRENCY;
    const targetLabel = investment.target_amount
      ? `${investment.target_amount} ${currency} target`
      : undefined;

    const metadataParts: string[] = [];
    if (investment.investment_type) {
      metadataParts.push(investment.investment_type.replace('_', ' '));
    }
    if (investment.risk_level) {
      metadataParts.push(`${investment.risk_level} risk`);
    }
    if (investment.investor_count > 0) {
      metadataParts.push(
        `${investment.investor_count} investor${investment.investor_count !== 1 ? 's' : ''}`
      );
    }

    // Progress towards target
    const progress =
      investment.target_amount > 0
        ? Math.round((investment.total_raised / investment.target_amount) * 100)
        : 0;

    const statusBadgeMap: Record<string, { label: string; variant: string }> = {
      [STATUS.INVESTMENTS.DRAFT]: { label: 'Draft', variant: 'default' },
      [STATUS.INVESTMENTS.OPEN]: { label: 'Open', variant: 'success' },
      [STATUS.INVESTMENTS.FUNDED]: { label: 'Funded', variant: 'success' },
      [STATUS.INVESTMENTS.ACTIVE]: { label: 'Active', variant: 'success' },
      [STATUS.INVESTMENTS.CLOSED]: { label: 'Closed', variant: 'default' },
      [STATUS.INVESTMENTS.CANCELLED]: { label: 'Cancelled', variant: 'warning' },
    };

    const badge = statusBadgeMap[investment.status];

    return {
      priceLabel: targetLabel,
      badge: badge?.label,
      badgeVariant: badge?.variant as 'success' | 'default' | 'warning' | 'destructive' | undefined,
      metadata:
        metadataParts.length > 0 ? (
          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
            {metadataParts.map((part, idx) => (
              <span key={idx} className="capitalize">
                {part}
              </span>
            ))}
            {progress > 0 && <span className="text-green-600 font-medium">{progress}% funded</span>}
          </div>
        ) : undefined,
      showEditButton: true,
      editHref: `${ENTITY_REGISTRY['investment'].createPath}?edit=${investment.id}`,
    };
  },

  emptyState: {
    title: 'No investments yet',
    description: 'Create your first investment opportunity to connect with potential investors.',
    action: (
      <Link href={ROUTES.DASHBOARD.INVESTMENTS_CREATE}>
        <Button className="bg-gradient-to-r from-green-600 to-green-700">Create Investment</Button>
      </Link>
    ),
  },

  gridCols: {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  },
};
