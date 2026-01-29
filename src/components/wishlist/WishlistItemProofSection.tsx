/**
 * Wishlist Item Proof Section Wrapper
 *
 * Client component that fetches proofs and renders WishlistProofSection.
 *
 * Created: 2026-01-07
 * Last Modified: 2026-01-07
 * Last Modified Summary: Created wrapper component for fetching and displaying proofs
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { WishlistProofSection } from './WishlistProofSection';
import { logger } from '@/utils/logger';
import type { FulfillmentProof } from './types';

interface WishlistItemProofSectionProps {
  itemId: string;
  canAddProof: boolean;
}

export function WishlistItemProofSection({ itemId, canAddProof }: WishlistItemProofSectionProps) {
  const [proofs, setProofs] = useState<FulfillmentProof[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProofs = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/wishlists/items/${itemId}/proofs`);

      if (!response.ok) {
        throw new Error('Failed to fetch proofs');
      }

      const data = await response.json();

      // Transform the API response to match FulfillmentProof type
      const transformedProofs: FulfillmentProof[] = data.proofs.map((proof: any) => ({
        id: proof.id,
        wishlist_item_id: proof.wishlist_item_id,
        user_id: proof.user_id,
        proof_type: proof.proof_type,
        description: proof.description,
        image_url: proof.image_url || undefined,
        transaction_id: proof.transaction_id || undefined,
        created_at: proof.created_at,
        user: proof.creator
          ? {
              id: proof.creator.id,
              username: proof.creator.username,
              avatar_url: proof.creator.avatar_url,
            }
          : undefined,
        feedback_summary: proof.feedback
          ? {
              likes: proof.feedback.likes,
              dislikes: proof.feedback.dislikes,
              user_feedback: proof.feedback.user_feedback?.type || null,
            }
          : undefined,
      }));

      setProofs(transformedProofs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load proofs');
      logger.error('Error fetching proofs', err, 'Wishlist');
    } finally {
      setIsLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    fetchProofs();
  }, [fetchProofs]);

  const handleProofAdded = (proof: FulfillmentProof) => {
    setProofs(prev => [proof, ...prev]);
    // Refetch to get the full proof data with feedback
    fetchProofs();
  };

  const handleProofDeleted = (proofId: string) => {
    setProofs(prev => prev.filter(p => p.id !== proofId));
  };

  const handleFeedbackChanged = () => {
    // Refetch to get updated feedback counts
    fetchProofs();
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 text-sm">{error}</p>
        <button
          onClick={fetchProofs}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <WishlistProofSection
        wishlistItemId={itemId}
        proofs={proofs}
        canAddProof={canAddProof}
        onProofAdded={handleProofAdded}
        onProofDeleted={handleProofDeleted}
        onFeedbackChanged={handleFeedbackChanged}
        isLoading={isLoading}
      />
    </div>
  );
}
