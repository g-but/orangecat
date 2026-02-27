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
import { STATUS } from '@/config/database-constants';
import { ROUTES } from '@/config/routes';
import { ENTITY_REGISTRY } from '@/config/entity-registry';
import type { Currency } from '@/types/settings';

export const productEntityConfig: EntityConfig<UserProduct> = {
  name: 'Product',
  namePlural: 'Products',
  colorTheme: 'orange',

  listPath: ENTITY_REGISTRY['product'].basePath,
  detailPath: id => `${ENTITY_REGISTRY['product'].basePath}/${id}`,
  createPath: ENTITY_REGISTRY['product'].createPath,
  editPath: id => `${ENTITY_REGISTRY['product'].createPath}?edit=${id}`,

  apiEndpoint: ENTITY_REGISTRY['product'].apiEndpoint,

  makeHref: product => `${ENTITY_REGISTRY['product'].basePath}/${product.id}`,

  makeCardProps: (product, userCurrency?: string) => {
    // Display price in user's preferred currency (or product's currency)
    const displayCurrency = (userCurrency ||
      product.currency ||
      PLATFORM_DEFAULT_CURRENCY) as Currency;
    const priceLabel =
      product.price && product.currency
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
      badge:
        product.status === STATUS.PRODUCTS.ACTIVE
          ? 'Active'
          : product.status === STATUS.PRODUCTS.DRAFT
            ? 'Draft'
            : product.status === STATUS.PRODUCTS.PAUSED
              ? 'Paused'
              : product.status === STATUS.PRODUCTS.SOLD_OUT
                ? 'Sold Out'
                : undefined,
      badgeVariant:
        product.status === STATUS.PRODUCTS.ACTIVE
          ? 'success'
          : product.status === STATUS.PRODUCTS.DRAFT
            ? 'default'
            : product.status === STATUS.PRODUCTS.PAUSED
              ? 'warning'
              : product.status === STATUS.PRODUCTS.SOLD_OUT
                ? 'destructive'
                : 'default',
      showEditButton: true,
      editHref: `${ENTITY_REGISTRY['product'].createPath}?edit=${product.id}`,
      // Removed duplicate actions button - edit icon overlay is sufficient
    };
  },

  emptyState: {
    title: 'No products yet',
    description: 'Start building your marketplace by adding your first product.',
    action: (
      <Link href={ROUTES.DASHBOARD.STORE_CREATE}>
        <Button className="bg-gradient-to-r from-orange-600 to-orange-700">Add Product</Button>
      </Link>
    ),
  },

  gridCols: {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  },
};
