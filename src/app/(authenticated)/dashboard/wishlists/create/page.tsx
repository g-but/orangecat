/**
 * Create Wishlist Page
 *
 * Page for creating a new wishlist using the unified entity creation system.
 *
 * Created: 2026-01-07
 * Last Modified: 2026-01-07
 * Last Modified Summary: Converted to client component to fix serialization issues
 */

'use client';

import { CreateEntityWorkflow } from '@/components/create/CreateEntityWorkflow';
import { wishlistConfig } from '@/config/entity-configs/wishlist-config';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/Loading';

export default function CreateWishlistPage() {
  const { user, isLoading, hydrated } = useAuth();

  if (!hydrated || isLoading) {
    return <Loading fullScreen message="Preparing wishlist creator..." />;
  }

  if (!user) {
    return null;
  }

  return <CreateEntityWorkflow config={wishlistConfig} />;
}
