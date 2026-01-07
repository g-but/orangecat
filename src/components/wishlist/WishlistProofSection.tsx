/**
 * Wishlist Proof Section Component
 *
 * Container component that displays all proofs for a wishlist item
 * and allows adding new proofs.
 *
 * Created: 2026-01-06
 * Last Modified: 2026-01-06
 */

'use client';

import React, { useState } from 'react';
import { Plus, Receipt, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProofOfPurchaseCard } from './ProofOfPurchaseCard';
import { ProofUploadForm } from './ProofUploadForm';
import { cn } from '@/lib/utils';
import type { WishlistProofSectionProps, FulfillmentProof } from './types';

export function WishlistProofSection({
  wishlistItemId,
  proofs,
  canAddProof = false,
  onProofAdded,
  onProofDeleted,
  onFeedbackChanged,
  isLoading = false,
  className,
}: WishlistProofSectionProps) {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(proofs.length <= 3);

  const handleProofAdded = (proof: FulfillmentProof) => {
    setShowUploadForm(false);
    onProofAdded?.(proof);
  };

  const handleLike = async (proofId: string) => {
    try {
      await fetch('/api/wishlists/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wishlist_item_id: wishlistItemId,
          fulfillment_proof_id: proofId,
          feedback_type: 'like',
        }),
      });
      onFeedbackChanged?.();
    } catch (error) {
      console.error('Error submitting like:', error);
    }
  };

  const handleDislike = async (proofId: string, comment: string) => {
    try {
      await fetch('/api/wishlists/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wishlist_item_id: wishlistItemId,
          fulfillment_proof_id: proofId,
          feedback_type: 'dislike',
          comment,
        }),
      });
      onFeedbackChanged?.();
    } catch (error) {
      console.error('Error submitting dislike:', error);
    }
  };

  const handleDelete = async (proofId: string) => {
    if (!confirm('Are you sure you want to delete this proof?')) {return;}

    try {
      await fetch(`/api/wishlists/proofs/${proofId}`, {
        method: 'DELETE',
      });
      onProofDeleted?.(proofId);
    } catch (error) {
      console.error('Error deleting proof:', error);
    }
  };

  const visibleProofs = isExpanded ? proofs : proofs.slice(0, 3);
  const hiddenCount = proofs.length - 3;

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">
            Proof of Purchase
            {proofs.length > 0 && (
              <span className="ml-2 text-muted-foreground font-normal">
                ({proofs.length})
              </span>
            )}
          </h3>
        </div>

        {canAddProof && !showUploadForm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUploadForm(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Proof
          </Button>
        )}
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <ProofUploadForm
          wishlistItemId={wishlistItemId}
          onSuccess={handleProofAdded}
          onCancel={() => setShowUploadForm(false)}
        />
      )}

      {/* Proofs List */}
      {proofs.length === 0 ? (
        <EmptyState
          title="No proofs yet"
          description={
            canAddProof
              ? "Post proof of purchase to show supporters how their contributions were used."
              : "The creator hasn't posted any proof of purchase yet."
          }
          action={
            canAddProof && !showUploadForm ? (
              <Button onClick={() => setShowUploadForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Proof
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {visibleProofs.map((proof) => (
            <ProofOfPurchaseCard
              key={proof.id}
              proof={proof}
              onLike={() => handleLike(proof.id)}
              onDislike={(comment) => handleDislike(proof.id, comment)}
              isOwner={canAddProof}
              onDelete={canAddProof ? () => handleDelete(proof.id) : undefined}
            />
          ))}

          {/* Show More/Less Button */}
          {proofs.length > 3 && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Show {hiddenCount} More Proof{hiddenCount !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
