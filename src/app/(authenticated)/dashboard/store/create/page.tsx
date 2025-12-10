'use client';

/**
 * CREATE PRODUCT PAGE
 *
 * Uses the unified EntityForm component for consistent UX.
 * Now includes contextual guidance sidebar.
 *
 * Created: 2025-12-03
 * Last Modified: 2025-12-03
 * Last Modified Summary: Refactored to use unified EntityForm system
 */

import { EntityForm } from '@/components/create';
import { productConfig } from '@/config/entity-configs';

export default function CreateProductPage() {
  return <EntityForm config={productConfig} />;
}
