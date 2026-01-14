/**
 * Wishlist Item Detail Page
 *
 * Displays a wishlist item with its proof section.
 *
 * Created: 2026-01-07
 * Last Modified: 2026-01-07
 * Last Modified Summary: Created wishlist item detail page with proof section
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { notFound, redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { WishlistItemProofSection } from '@/components/wishlist/WishlistItemProofSection';

interface PageProps {
  params: Promise<{ itemId: string }>;
}

export default async function WishlistItemDetailPage({ params }: PageProps) {
  const { itemId } = await params;

  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth?mode=login&from=/dashboard/wishlists');
  }

  // Fetch wishlist item
  const { data: item, error: itemError } = await (supabase
    .from('wishlist_items') as any)
    .select(`
      id,
      title,
      description,
      image_url,
      target_amount_sats,
      funded_amount_sats,
      is_fully_funded,
      is_fulfilled,
      wishlist_id,
      wishlists!inner (
        id,
        title,
        actor_id
      )
    `)
    .eq('id', itemId)
    .single();

  if (itemError || !item) {
    notFound();
  }

  const wishlist = Array.isArray(item.wishlists) ? item.wishlists[0] : item.wishlists;
  const isOwner = wishlist && wishlist.actor_id === user.id;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <a
          href={`/dashboard/wishlists/${wishlist?.id}`}
          className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block"
        >
          ← Back to Wishlist
        </a>
        <h1 className="text-3xl font-bold mt-2">{item.title}</h1>
        {item.description && (
          <p className="text-gray-600 mt-2">{item.description}</p>
        )}
      </div>

      {/* Funding Status */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Funding Status</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Target:</span>
            <span className="font-medium">{item.target_amount_sats.toLocaleString()} sats</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Funded:</span>
            <span className="font-medium">{item.funded_amount_sats.toLocaleString()} sats</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <div
              className="bg-orange-600 h-2 rounded-full"
              style={{
                width: `${Math.min(100, (item.funded_amount_sats / item.target_amount_sats) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Proof Section */}
      <WishlistItemProofSection itemId={itemId} canAddProof={isOwner || false} />
    </div>
  );
}
