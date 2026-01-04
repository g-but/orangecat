import EntityDetailPage from '@/components/entity/EntityDetailPage';
import { causeEntityConfig } from '@/config/entities/causes';
import type { UserCause } from '@/types/database';

interface CauseDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Cause Detail Page
 *
 * Unified detail page using EntityDetailPage component.
 *
 * Created: 2025-01-27
 * Last Modified: 2026-01-03
 * Last Modified Summary: Refactored to use unified EntityDetailPage component
 */
export default async function CauseDetailPage({ params }: CauseDetailPageProps) {
  const { id } = await params;

  return (
    <EntityDetailPage<UserCause>
      config={causeEntityConfig}
      entityId={id}
      requireAuth={false}
      makeDetailFields={(cause) => {
        const left = [
          { label: 'Category', value: cause.cause_category || '—' },
          { label: 'Status', value: cause.status ? cause.status.charAt(0).toUpperCase() + cause.status.slice(1) : 'Draft' },
          { label: 'Goal Amount', value: cause.target_amount ? `${cause.target_amount.toLocaleString()} ${cause.currency || 'CHF'}` : 'Open-ended' },
          { label: 'Current Amount', value: `${(cause.current_amount || 0).toLocaleString()} ${cause.currency || 'CHF'}` },
        ];

        const right: Array<{ label: string; value: string }> = [];

        if (cause.bitcoin_address) {
          right.push({ label: 'Bitcoin Address', value: cause.bitcoin_address });
        }
        if (cause.lightning_address) {
          right.push({ label: 'Lightning Address', value: cause.lightning_address });
        }

        if (cause.created_at) {
          right.push({ label: 'Created', value: new Date(cause.created_at).toLocaleString() });
        }
        if (cause.updated_at) {
          right.push({ label: 'Updated', value: new Date(cause.updated_at).toLocaleString() });
        }

        return { left, right };
      }}
    />
  );
}
