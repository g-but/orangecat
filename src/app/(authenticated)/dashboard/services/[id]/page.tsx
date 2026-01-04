import EntityDetailPage from '@/components/entity/EntityDetailPage';
import { serviceEntityConfig } from '@/config/entities/services';
import type { UserService } from '@/types/database';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Service Detail Page
 *
 * Unified detail page using EntityDetailPage component.
 *
 * Created: 2025-01-27
 * Last Modified: 2026-01-03
 * Last Modified Summary: Refactored to use unified EntityDetailPage component
 */
export default async function ServiceDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <EntityDetailPage<UserService>
      config={serviceEntityConfig}
      entityId={id}
      requireAuth={true}
      redirectPath="/auth?mode=login&from=/dashboard/services"
      makeDetailFields={(service) => {
        const priceParts: string[] = [];
        if (service.hourly_rate_sats) {
          priceParts.push(`${service.hourly_rate_sats.toLocaleString()} ${service.currency || 'CHF'}/hour`);
        }
        if (service.fixed_price_sats) {
          priceParts.push(`${service.fixed_price_sats.toLocaleString()} ${service.currency || 'CHF'}`);
        }
        const priceLabel = priceParts.length > 0 ? priceParts.join(' or ') : 'Contact for pricing';

        const left = [
          { label: 'Status', value: service.status || 'draft' },
          { label: 'Category', value: service.category || '—' },
          { label: 'Pricing', value: priceLabel },
          { label: 'Location', value: service.service_location_type === 'remote' ? 'Remote' : service.service_location_type === 'onsite' ? 'On-site' : service.service_location_type || '—' },
        ];

        if (service.duration_minutes) {
          left.push({ label: 'Duration', value: `${service.duration_minutes} minutes` });
        }

        return {
          left,
          right: [
            { label: 'Created', value: new Date(service.created_at || '').toLocaleString() },
            { label: 'Updated', value: new Date(service.updated_at || '').toLocaleString() },
          ],
        };
      }}
    />
  );
}
