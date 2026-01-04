/**
 * Loan CRUD API Routes
 *
 * Uses generic entity handler from lib/api/entityCrudHandler.ts
 * Entity metadata comes from entity-registry (Single Source of Truth)
 *
 * Before refactoring: 192 lines
 * After refactoring: ~45 lines (76% reduction)
 */

import { loanSchema } from '@/lib/validation';
import { createEntityCrudHandlers } from '@/lib/api/entityCrudHandler';
import { createUpdatePayloadBuilder } from '@/lib/api/buildUpdatePayload';

// Build update payload from validated loan data
const buildLoanUpdatePayload = createUpdatePayloadBuilder([
  { from: 'title' },
  { from: 'description' },
  { from: 'loan_category_id' },
  { from: 'original_amount' },
  { from: 'remaining_balance' },
  { from: 'interest_rate' },
  { from: 'bitcoin_address' },
  { from: 'lightning_address' },
  { from: 'fulfillment_type', default: 'manual' },
]);

// Create handlers using generic factory
const { GET, PUT, DELETE } = createEntityCrudHandlers({
  entityType: 'loan',
  schema: loanSchema,
  buildUpdatePayload: buildLoanUpdatePayload,
  requireAuthForGet: true, // Loans require auth to view
  requireActiveStatus: false, // Loans don't have an 'active' status filter
});

export { GET, PUT, DELETE };

