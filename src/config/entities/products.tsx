/**
 * Product Entity Configuration
 * 
 * Created: 2025-01-27
 * Last Modified: 2025-01-27
 * Last Modified Summary: Initial creation of product entity configuration
 */

import { EntityConfig } from '@/types/entity';
import { UserProduct } from '@/types/database';
import Link from 'next/link';
import Button from '@/components/ui/Button';

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
  
  makeCardProps: (product) => {
    const priceLabel = product.price_sats 
      ? `${product.price_sats} ${product.currency || 'sats'}` 
      : undefined;

    return {
      priceLabel,
      badge: product.status === 'published' ? 'Published' : product.status === 'draft' ? 'Draft' : undefined,
      badgeVariant: product.status === 'published' ? 'success' : product.status === 'draft' ? 'default' : 'default',
      showEditButton: true,
      editHref: `/dashboard/store/create?edit=${product.id}`,
      actions: (
        <Link href={`/dashboard/store/create?edit=${product.id}`}>
          <Button size="sm" variant="outline">
            Edit
          </Button>
        </Link>
      ),
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

