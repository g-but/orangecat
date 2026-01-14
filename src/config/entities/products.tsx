/**
 * Product Entity Configuration
 * 
 * Created: 2025-01-27
 * Last Modified: 2026-01-04
 * Last Modified Summary: Updated to convert prices to user's preferred currency
 */

import { EntityConfig } from '@/types/entity';
import { UserProduct } from '@/types/database';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { convert, formatCurrency } from '@/services/currency';
import { PLATFORM_DEFAULT_CURRENCY } from '@/config/currencies';
import type { Currency } from '@/types/settings';

export const productEntityConfig: EntityConfig<UserProduct> = {
  name: 'Product',
  namePlural: 'Products',
  colorTheme: 'orange',
  
  listPath: '/dashboard/store',
  detailPath: (id) => `/dashboard/store/${id}`,
  createPath: '/dashboard/store/create',
  editPath: (id) => `/dashboard/store/create?edit=${id}`,
  
  apiEndpoint: '/api/products',
  
  makeHref: (product) => `/dashboard/store/${product.id}`,
  
  makeCardProps: (product, userCurrency?: string) => {
    // Display price in user's preferred currency (or product's currency)
    const displayCurrency = (userCurrency || product.currency || PLATFORM_DEFAULT_CURRENCY) as Currency;
    const priceLabel = product.price && product.currency
      ? (() => {
          // If product currency matches display currency, use directly
          if (product.currency === displayCurrency) {
            return formatCurrency(product.price, displayCurrency);
          }
          // Otherwise convert from product's currency to display currency
          const converted = convert(product.price, product.currency as Currency, displayCurrency);
          return formatCurrency(converted, displayCurrency);
        })()
      : undefined;

    return {
      priceLabel,
      badge: product.status === 'active' ? 'Active' : product.status === 'draft' ? 'Draft' : product.status === 'paused' ? 'Paused' : product.status === 'sold_out' ? 'Sold Out' : undefined,
      badgeVariant: product.status === 'active' ? 'success' : product.status === 'draft' ? 'default' : product.status === 'paused' ? 'warning' : product.status === 'sold_out' ? 'destructive' : 'default',
      showEditButton: true,
      editHref: `/dashboard/store/create?edit=${product.id}`,
      // Removed duplicate actions button - edit icon overlay is sufficient
    };
  },
  
  emptyState: {
    title: 'No products yet',
    description: 'Start building your marketplace by adding your first product.',
    action: (
      <Link href="/dashboard/store/create">
        <Button className="bg-gradient-to-r from-orange-600 to-orange-700">
          Add Product
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

