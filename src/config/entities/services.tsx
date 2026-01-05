/**
 * Service Entity Configuration
 * 
 * Created: 2025-01-27
 * Last Modified: 2026-01-04
 * Last Modified Summary: Updated to convert prices to user's preferred currency
 */

import { EntityConfig } from '@/types/entity';
import { UserService } from '@/types/database';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { convert, formatCurrency } from '@/services/currency';
import { PLATFORM_DEFAULT_CURRENCY } from '@/config/currencies';
import type { Currency } from '@/types/settings';

export const serviceEntityConfig: EntityConfig<UserService> = {
  name: 'Service',
  namePlural: 'Services',
  colorTheme: 'orange',
  
  listPath: '/dashboard/services',
  detailPath: (id) => `/dashboard/services/${id}`,
  createPath: '/dashboard/services/create',
  editPath: (id) => `/dashboard/services/create?edit=${id}`,
  
  apiEndpoint: '/api/services',
  
  makeHref: (service) => `/dashboard/services/${service.id}`,
  
  makeCardProps: (service, userCurrency?: string) => {
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
    const priceLabel = priceParts.length > 0 ? priceParts.join(' or ') : undefined;

    // Build metadata (category, location)
    const metadataParts: string[] = [];
    if (service.category) {
      metadataParts.push(service.category);
    }
    if (service.service_location_type) {
      metadataParts.push(service.service_location_type === 'remote' ? 'Remote' : 
                         service.service_location_type === 'onsite' ? 'On-site' : 
                         'Remote & On-site');
    }

    return {
      priceLabel,
      badge: service.status === 'published' ? 'Published' : service.status === 'draft' ? 'Draft' : undefined,
      badgeVariant: service.status === 'published' ? 'success' : service.status === 'draft' ? 'default' : 'default',
      metadata: metadataParts.length > 0 ? (
        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
          {metadataParts.map((part, idx) => (
            <span key={idx}>{part}</span>
          ))}
        </div>
      ) : undefined,
      showEditButton: true,
      editHref: `/dashboard/services/create?edit=${service.id}`,
      // Removed duplicate actions button - edit icon overlay is sufficient
    };
  },
  
  emptyState: {
    title: 'No services yet',
    description: 'Start offering your expertise to the community by creating your first service.',
    action: (
      <Link href="/dashboard/services/create">
        <Button className="bg-gradient-to-r from-orange-600 to-orange-700">
          Add Service
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

