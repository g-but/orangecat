/**
 * Entity Guidance - Barrel Export
 *
 * Central export for all entity guidance content.
 * Used by the unified EntityForm component.
 *
 * Created: 2025-12-03
 * Last Modified: 2025-12-04
 * Last Modified Summary: Added Circle and Loan guidance exports
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

// Re-export existing guidance from lib/
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

export {
  projectGuidanceContent,
  projectDefaultContent,
  type ProjectFieldType,
} from '@/lib/project-guidance';

