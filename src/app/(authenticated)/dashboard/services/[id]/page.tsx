import EntityDetailPage from '@/components/entity/EntityDetailPage';
import { serviceEntityConfig } from '@/config/entities/services';
import type { UserService } from '@/types/database';
import { convert, formatCurrency } from '@/services/currency';
import { PLATFORM_DEFAULT_CURRENCY } from '@/config/currencies';
import type { Currency } from '@/types/settings';

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
      makeDetailFields={(service, userCurrency) => {
        // Display prices in user's preferred currency (or service's currency)
        const displayCurrency = (userCurrency || service.currency || PLATFORM_DEFAULT_CURRENCY) as Currency;
        const priceParts: string[] = [];
        if (service.hourly_rate && service.currency) {
          const hourlyRate = service.currency === displayCurrency
            ? service.hourly_rate
            : convert(service.hourly_rate, service.currency as Currency, displayCurrency);
          priceParts.push(`${formatCurrency(hourlyRate, displayCurrency)}/hour`);
        }
        if (service.fixed_price && service.currency) {
          const fixedPrice = service.currency === displayCurrency
            ? service.fixed_price
            : convert(service.fixed_price, service.currency as Currency, displayCurrency);
          priceParts.push(formatCurrency(fixedPrice, displayCurrency));
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
