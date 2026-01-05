import EntityDetailPage from '@/components/entity/EntityDetailPage';
import { productEntityConfig } from '@/config/entities/products';
import type { UserProduct } from '@/types/database';
import { convert, formatCurrency } from '@/services/currency';
import { PLATFORM_DEFAULT_CURRENCY } from '@/config/currencies';
import type { Currency } from '@/types/settings';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Product Detail Page
 *
 * Unified detail page using EntityDetailPage component.
 *
 * Created: 2025-01-27
 * Last Modified: 2026-01-03
 * Last Modified Summary: Refactored to use unified EntityDetailPage component
 */
export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <EntityDetailPage<UserProduct>
      config={productEntityConfig}
      entityId={id}
      requireAuth={true}
      redirectPath="/auth?mode=login&from=/dashboard/store"
      makeDetailFields={(product, userCurrency) => {
        // Display price in user's preferred currency (or product's currency)
        const displayCurrency = (userCurrency || product.currency || PLATFORM_DEFAULT_CURRENCY) as Currency;
        const priceValue = product.price && product.currency
          ? (() => {
              const price = product.currency === displayCurrency
                ? product.price
                : convert(product.price, product.currency as Currency, displayCurrency);
              return formatCurrency(price, displayCurrency);
            })()
          : 'Not set';
        
        const left = [
          { label: 'Status', value: product.status || 'draft' },
          { label: 'Price', value: priceValue },
          { label: 'Type', value: product.product_type || '—' },
          { label: 'Inventory', value: product.inventory_count === -1 ? 'Unlimited' : String(product.inventory_count || 0) },
          { label: 'Fulfillment', value: product.fulfillment_type || '—' },
        ];

        if (product.tags && product.tags.length > 0) {
          left.push({ label: 'Tags', value: product.tags.join(', ') });
        }

        return {
          left,
          right: [
            { label: 'Created', value: new Date(product.created_at || '').toLocaleString() },
            { label: 'Updated', value: new Date(product.updated_at || '').toLocaleString() },
          ],
        };
      }}
    />
  );
}
