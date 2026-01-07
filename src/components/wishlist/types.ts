/**
 * Wishlist Component Types
 *
 * Type definitions for wishlist proof and feedback components.
 *
 * Created: 2026-01-06
 * Last Modified: 2026-01-06
 */

import type {
  WishlistFulfillmentProofFormData,
  WishlistFeedbackFormData,
} from '@/lib/validation';

// ==================== PROOF TYPES ====================

export type ProofType = 'receipt' | 'screenshot' | 'transaction' | 'comment';

export interface FulfillmentProof extends WishlistFulfillmentProofFormData {
  id: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
  // Computed/joined fields
  user?: {
    id: string;
    username?: string;
    avatar_url?: string;
  };
  feedback_summary?: {
    likes: number;
    dislikes: number;
    user_feedback?: 'like' | 'dislike' | null;
  };
}

// ==================== FEEDBACK TYPES ====================

export type FeedbackType = 'like' | 'dislike';

export interface ProofFeedback extends WishlistFeedbackFormData {
  id: string;
  user_id: string;
  created_at: string;
  // Computed/joined fields
  user?: {
    id: string;
    username?: string;
    avatar_url?: string;
  };
}

// ==================== COMPONENT PROPS ====================

export interface ProofOfPurchaseCardProps {
  proof: FulfillmentProof;
  onLike?: () => void;
  onDislike?: (comment: string) => void;
  isOwner?: boolean;
  onDelete?: () => void;
  isLoading?: boolean;
}

export interface ProofUploadFormProps {
  wishlistItemId: string;
  onSuccess?: (proof: FulfillmentProof) => void;
  onCancel?: () => void;
  className?: string;
}

export interface FeedbackButtonsProps {
  proofId: string;
  wishlistItemId: string;
  likes: number;
  dislikes: number;
  userFeedback?: 'like' | 'dislike' | null;
  onLike?: () => void;
  onDislike?: (comment: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export interface WishlistProofSectionProps {
  wishlistItemId: string;
  proofs: FulfillmentProof[];
  canAddProof?: boolean;
  onProofAdded?: (proof: FulfillmentProof) => void;
  onProofDeleted?: (proofId: string) => void;
  onFeedbackChanged?: () => void;
  isLoading?: boolean;
  className?: string;
}

// ==================== PROOF TYPE METADATA ====================

export const PROOF_TYPE_META: Record<
  ProofType,
  {
    label: string;
    description: string;
    requiresImage: boolean;
    requiresTransaction: boolean;
  }
> = {
  receipt: {
    label: 'Receipt',
    description: 'Upload a receipt or invoice showing the purchase',
    requiresImage: true,
    requiresTransaction: false,
  },
  screenshot: {
    label: 'Screenshot',
    description: 'Share a screenshot of the order confirmation or delivery',
    requiresImage: true,
    requiresTransaction: false,
  },
  transaction: {
    label: 'Transaction',
    description: 'Provide the Bitcoin transaction ID as proof',
    requiresImage: false,
    requiresTransaction: true,
  },
  comment: {
    label: 'Description Only',
    description: 'Add a text description explaining how funds were used',
    requiresImage: false,
    requiresTransaction: false,
  },
};
