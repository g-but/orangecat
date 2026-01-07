/**
 * Entity Guidance - Barrel Export
 *
 * Central export for all entity guidance content.
 * Used by the unified EntityForm component.
 *
 * Created: 2025-12-03
 * Last Modified: 2025-12-16
 * Last Modified Summary: Consolidated project guidance, removed legacy imports
 */

// Product guidance
export {
  productGuidanceContent,
  productDefaultGuidance,
  type ProductFieldType,
} from './product-guidance';

// Service guidance
export {
  serviceGuidanceContent,
  serviceDefaultGuidance,
  type ServiceFieldType,
} from './service-guidance';

// Cause guidance
export {
  causeGuidanceContent,
  causeDefaultGuidance,
  type CauseFieldType,
} from './cause-guidance';

// Circle guidance
export {
  circleGuidanceContent,
  circleDefaultGuidance,
  type CircleFieldType,
} from './circle-guidance';

// Loan guidance
export {
  loanGuidanceContent,
  loanDefaultGuidance,
  type LoanFieldType,
} from './loan-guidance';

// Asset guidance
export {
  assetGuidanceContent,
  assetDefaultGuidance,
} from './asset-guidance';

// Organization guidance
export {
  organizationGuidanceContent,
  organizationDefaultGuidance,
  type OrganizationFieldType,
} from './organization-guidance';

// Project guidance (single source of truth - in this directory)
export {
  projectGuidanceContent,
  projectDefaultGuidance,
  type ProjectFieldType,
} from './project-guidance';

// AI Assistant guidance
export {
  aiAssistantGuidanceContent,
  aiAssistantDefaultGuidance,
  type AIAssistantFieldType,
} from './ai-assistant-guidance';

// Wishlist guidance
export {
  wishlistGuidanceContent,
  wishlistDefaultGuidance,
  wishlistItemGuidanceContent,
  wishlistProofGuidance,
  wishlistFeedbackGuidance,
  type WishlistFieldType,
  type WishlistItemFieldType,
} from './wishlist-guidance';

// Re-export profile/wallet guidance from lib/ (these are used elsewhere)
export {
  profileGuidanceContent,
  profileDefaultContent,
  type ProfileFieldType,
} from '@/lib/profile-guidance';

export {
  walletGuidanceContent,
  walletDefaultContent,
  type WalletFieldType,
} from '@/lib/wallet-guidance';

