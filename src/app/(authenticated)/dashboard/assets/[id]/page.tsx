import EntityDetailPage from '@/components/entity/EntityDetailPage';
import { assetEntityConfig } from '@/config/entities/assets';
import type { Asset } from '@/types/asset';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Asset Detail Page
 *
 * Unified detail page using EntityDetailPage component.
 *
 * Created: 2026-01-03
 * Last Modified: 2026-01-03
 * Last Modified Summary: Initial creation using unified EntityDetailPage component
 */
export default async function AssetDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <EntityDetailPage<Asset>
      config={assetEntityConfig}
      entityId={id}
      requireAuth={true}
      redirectPath="/auth?mode=login&from=/dashboard/assets"
      makeDetailFields={(asset) => {
        const left = [
          {
            label: 'Status',
            value: asset.status
              ? asset.status.charAt(0).toUpperCase() + asset.status.slice(1)
              : 'Draft',
          },
          {
            label: 'Type',
            value: asset.type ? asset.type.replace(/_/g, ' ') : '—',
          },
          {
            label: 'Estimated Value',
            value: asset.estimated_value
              ? `${asset.estimated_value.toLocaleString()} ${asset.currency || 'CHF'}`
              : 'Not set',
          },
          {
            label: 'Verification Status',
            value:
              asset.verification_status === 'third_party_verified'
                ? 'Third Party Verified'
                : asset.verification_status === 'user_provided'
                  ? 'Self-Verified'
                  : 'Not Verified',
          },
        ];

        if (asset.location) {
          left.push({
            label: 'Location',
            value: asset.location,
          });
        }

        if (asset.description) {
          left.push({
            label: 'Description',
            value: asset.description,
          });
        }

        if (asset.purchase_date) {
          left.push({
            label: 'Purchase Date',
            value: new Date(asset.purchase_date).toLocaleDateString(),
          });
        }

        if (asset.purchase_price) {
          left.push({
            label: 'Purchase Price',
            value: `${asset.purchase_price.toLocaleString()} ${asset.currency || 'CHF'}`,
          });
        }

        const right: Array<{ label: string; value: string }> = [];

        if (asset.documentation_url) {
          right.push({
            label: 'Documentation',
            value: asset.documentation_url,
          });
        }

        if (asset.notes) {
          right.push({
            label: 'Notes',
            value: asset.notes,
          });
        }

        if (asset.created_at) {
          right.push({
            label: 'Created',
            value: new Date(asset.created_at).toLocaleString(),
          });
        }

        if (asset.updated_at) {
          right.push({
            label: 'Updated',
            value: new Date(asset.updated_at).toLocaleString(),
          });
        }

        return { left, right };
      }}
    />
  );
}
