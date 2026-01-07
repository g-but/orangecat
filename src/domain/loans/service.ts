import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/utils/logger';
import { isTableNotFound } from '@/lib/db/errors';
import { PLATFORM_DEFAULT_CURRENCY } from '@/config/currencies';
import { getTableName } from '@/config/entity-registry';

interface CreateLoanInput {
  loan_type?: 'new_request' | 'existing_refinance';
  title: string;
  description: string;
  loan_category_id?: string | null;
  original_amount: number;
  remaining_balance: number;
  interest_rate?: number | null;
  bitcoin_address?: string | null;
  lightning_address?: string | null;
  fulfillment_type?: 'manual' | 'automatic';
  // Fields for existing loan refinancing
  current_lender?: string | null;
  current_interest_rate?: number | null;
  monthly_payment?: number | null;
  desired_rate?: number | null;
  currency?: string;
}

export async function listLoans() {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from(getTableName('loan'))
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    if (isTableNotFound(error)) {
      return [];
    }
    throw error;
  }
  return data || [];
}

export async function createLoan(
  userId: string, 
  input: CreateLoanInput & { collateral?: any[] },
  supabase?: ReturnType<typeof createServerClient>
) {
  const mode = process.env.LOANS_WRITE_MODE || 'db';
  if (mode === 'mock') {
    throw new Error('Mock mode is disabled by policy. Set LOANS_WRITE_MODE=db');
  }

  const client = supabase || await createServerClient();
  
  // Extract collateral (will be handled separately)
  const { collateral, ...loanInput } = input;
  
  // Map form fields to database columns
  // Handle both new schema (original_amount) and legacy schema (amount_sats)
  // Convert original_amount to sats for legacy field (rough conversion: 1 CHF ≈ 86,000 sats)
  const amountInSats = loanInput.original_amount && loanInput.original_amount > 0
    ? Math.floor(loanInput.original_amount * 100000000 / 86000)
    : 1000000; // Default to 1M sats if no amount provided (shouldn't happen due to validation)
  
  // Normalize empty strings to null for UUID and optional fields
  const normalizeToNull = (value: any): any => {
    if (value === '' || value === undefined) {return null;}
    return value;
  };

  const payload: any = {
    user_id: userId,
    title: loanInput.title,
    description: loanInput.description || '',
    loan_type: loanInput.loan_type || 'new_request',
    // New schema fields
    original_amount: loanInput.original_amount,
    remaining_balance: loanInput.remaining_balance,
    interest_rate: normalizeToNull(loanInput.interest_rate),
    loan_category_id: normalizeToNull(loanInput.loan_category_id), // UUID column - empty string becomes null
    bitcoin_address: normalizeToNull(loanInput.bitcoin_address),
    lightning_address: normalizeToNull(loanInput.lightning_address),
    fulfillment_type: loanInput.fulfillment_type || 'manual',
    currency: loanInput.currency || PLATFORM_DEFAULT_CURRENCY,
    // Refinancing fields
    current_lender: normalizeToNull(loanInput.current_lender),
    current_interest_rate: normalizeToNull(loanInput.current_interest_rate),
    monthly_payment: normalizeToNull(loanInput.monthly_payment),
    desired_rate: normalizeToNull(loanInput.desired_rate),
    // Legacy fields (for backward compatibility) - required by schema
    amount_sats: amountInSats,
    status: 'active',
  };

  const { data, error } = await client.from(getTableName('loan')).insert(payload).select().single();
  if (error) {
    logger.error('Failed to create loan', { 
      error, 
      errorCode: error.code,
      errorMessage: error.message,
      errorDetails: error.details,
      errorHint: error.hint,
      userId, 
      input: loanInput,
      payload: JSON.stringify(payload, null, 2)
    });
    throw error;
  }

  // Handle collateral separately if provided
  if (collateral && Array.isArray(collateral) && collateral.length > 0 && data?.id) {
    // Collateral will be handled via separate API endpoint
    // For now, we just create the loan without collateral
    // TODO: Create loan_collateral entries via /api/loan-collateral endpoint
  }

  return data;
}
