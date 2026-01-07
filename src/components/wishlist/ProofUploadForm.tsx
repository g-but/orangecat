/**
 * Proof Upload Form Component
 *
 * Form for uploading proof of purchase/fulfillment.
 * Supports receipts, screenshots, transaction IDs, and text descriptions.
 *
 * Created: 2026-01-06
 * Last Modified: 2026-01-06
 */

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Receipt,
  Camera,
  Bitcoin,
  MessageSquare,
  Upload,
  X,
  Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/label';
import {
  wishlistFulfillmentProofSchema,
  type WishlistFulfillmentProofFormData,
} from '@/lib/validation';
import { cn } from '@/lib/utils';
import { PROOF_TYPE_META, type ProofUploadFormProps, type ProofType } from './types';

const PROOF_TYPE_OPTIONS: Array<{
  value: ProofType;
  icon: React.ElementType;
  label: string;
  description: string;
}> = [
  {
    value: 'receipt',
    icon: Receipt,
    label: 'Receipt',
    description: 'Upload a receipt or invoice',
  },
  {
    value: 'screenshot',
    icon: Camera,
    label: 'Screenshot',
    description: 'Order confirmation or delivery proof',
  },
  {
    value: 'transaction',
    icon: Bitcoin,
    label: 'Transaction',
    description: 'Bitcoin transaction ID',
  },
  {
    value: 'comment',
    icon: MessageSquare,
    label: 'Description',
    description: 'Text explanation only',
  },
];

export function ProofUploadForm({
  wishlistItemId,
  onSuccess,
  onCancel,
  className,
}: ProofUploadFormProps) {
  const [selectedType, setSelectedType] = useState<ProofType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<WishlistFulfillmentProofFormData>({
    resolver: zodResolver(wishlistFulfillmentProofSchema),
    defaultValues: {
      wishlist_item_id: wishlistItemId,
      proof_type: undefined,
      description: '',
      image_url: null,
      transaction_id: null,
    },
  });

  const imageUrl = watch('image_url');
  const proofType = watch('proof_type');

  const handleTypeSelect = (type: ProofType) => {
    setSelectedType(type);
    setValue('proof_type', type);
  };

  const handleImageUpload = (url: string) => {
    setValue('image_url', url);
  };

  const handleImageRemove = () => {
    setValue('image_url', null);
  };

  const onSubmit = async (data: WishlistFulfillmentProofFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/wishlists/proofs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to upload proof');
      }

      const result = await response.json();
      reset();
      setSelectedType(null);
      onSuccess?.(result.proof);
    } catch (error) {
      console.error('Error uploading proof:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const proofMeta = selectedType ? PROOF_TYPE_META[selectedType] : null;

  return (
    <Card className={cn('p-4', className)}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Hidden fields */}
        <input type="hidden" {...register('wishlist_item_id')} />

        {/* Proof Type Selection */}
        <div className="space-y-2">
          <Label>Proof Type</Label>
          <div className="grid grid-cols-2 gap-2">
            {PROOF_TYPE_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleTypeSelect(option.value)}
                  className={cn(
                    'flex flex-col items-center p-3 rounded-lg border-2 transition-colors',
                    'hover:bg-muted/50',
                    selectedType === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-muted'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 mb-1',
                      selectedType === option.value
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    )}
                  />
                  <span className="text-sm font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground text-center">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
          {errors.proof_type && (
            <p className="text-sm text-destructive">{errors.proof_type.message}</p>
          )}
        </div>

        {/* Conditional Fields based on Proof Type */}
        {selectedType && (
          <>
            {/* Image Upload (for receipt/screenshot) */}
            {proofMeta?.requiresImage && (
              <div className="space-y-2">
                <Label>
                  {selectedType === 'receipt' ? 'Receipt Image' : 'Screenshot'}
                </Label>
                {imageUrl ? (
                  <div className="relative">
                    <img
                      src={imageUrl}
                      alt="Proof"
                      className="w-full rounded-lg object-cover max-h-48"
                    />
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleImageRemove}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Image upload coming soon
                    </p>
                    <Input
                      type="url"
                      placeholder="Or paste image URL..."
                      onChange={(e) => handleImageUpload(e.target.value)}
                      className="mt-3"
                    />
                  </div>
                )}
                {errors.image_url && (
                  <p className="text-sm text-destructive">
                    {errors.image_url.message}
                  </p>
                )}
              </div>
            )}

            {/* Transaction ID (for transaction type) */}
            {proofMeta?.requiresTransaction && (
              <div className="space-y-2">
                <Label htmlFor="transaction_id">Transaction ID</Label>
                <div className="flex items-center gap-2">
                  <Bitcoin className="h-5 w-5 text-bitcoin-orange shrink-0" />
                  <Input
                    id="transaction_id"
                    {...register('transaction_id')}
                    placeholder="Enter Bitcoin transaction ID..."
                    className="font-mono text-sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  The transaction ID can be found in your wallet or on a block
                  explorer
                </p>
                {errors.transaction_id && (
                  <p className="text-sm text-destructive">
                    {errors.transaction_id.message}
                  </p>
                )}
              </div>
            )}

            {/* Description (always shown) */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Describe how you used the funds..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 10 characters required
              </p>
              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Post Proof
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </form>
    </Card>
  );
}
