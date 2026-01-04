/**
 * LOANS SERVICE - Validation Utilities
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Extracted from loans/index.ts for modularity
 */

import { isSupportedCurrency } from '@/config/currencies';
import type { CreateLoanRequest } from '@/types/loans';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate loan creation request
 */
export function validateCreateLoanRequest(request: CreateLoanRequest): ValidationResult {
  const errors: ValidationError[] = [];

  if (!request.title || request.title.trim().length < 3) {
    errors.push({ field: 'title', message: 'Title must be at least 3 characters' });
  }

  if (!request.original_amount || request.original_amount <= 0) {
    errors.push({ field: 'original_amount', message: 'Original amount must be greater than 0' });
  }

  if (!request.remaining_balance || request.remaining_balance <= 0) {
    errors.push({ field: 'remaining_balance', message: 'Remaining balance must be greater than 0' });
  }

  if (request.remaining_balance > request.original_amount) {
    errors.push({ field: 'remaining_balance', message: 'Remaining balance cannot exceed original amount' });
  }

  if (request.currency && !isSupportedCurrency(request.currency)) {
    errors.push({ field: 'currency', message: 'Unsupported currency' });
  }

  if (request.interest_rate && (request.interest_rate < 0 || request.interest_rate > 100)) {
    errors.push({ field: 'interest_rate', message: 'Interest rate must be between 0 and 100' });
  }

  return { valid: errors.length === 0, errors };
}
