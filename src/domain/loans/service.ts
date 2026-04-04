import { createServerClient } from '@/lib/supabase/server';
import { isTableNotFound } from '@/lib/db/errors';
import { PLATFORM_DEFAULT_CURRENCY } from '@/config/currencies';
import { getTableName } from '@/config/entity-registry';
import { STATUS } from '@/config/database-constants';
import { createEntity } from '@/domain/base/entityService';

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
  input: CreateLoanInput & {
    collateral?: Array<{ type: string; value: number; description?: string }>;
  },
  supabase?: Awaited<ReturnType<typeof createServerClient>>
) {
  const mode = process.env.LOANS_WRITE_MODE || 'db';
  if (mode === 'mock') {
    throw new Error('Mock mode is disabled by policy. Set LOANS_WRITE_MODE=db');
  }

  // Extract collateral (will be handled separately)
  const { collateral: _collateral, ...loanInput } = input;

  // Map form fields to database columns
  // original_amount is stored directly as BTC
  const amountBtc =
    loanInput.original_amount && loanInput.original_amount > 0
      ? loanInput.original_amount
      : 0.01; // Default to 0.01 BTC if no amount provided (shouldn't happen due to validation)

  // Normalize empty strings to null for UUID and optional fields
  const normalizeToNull = <T>(value: T): T | null => {
    if (value === '' || value === undefined) {
      return null;
    }
    return value;
  };

  const data = await createEntity(
    'loan',
    userId,
    {
      title: loanInput.title,
      description: loanInput.description || '',
      loan_type: loanInput.loan_type || 'new_request',
      // New schema fields
      original_amount: loanInput.original_amount,
      remaining_balance: loanInput.remaining_balance,
      interest_rate: normalizeToNull(loanInput.interest_rate),
      loan_category_id: normalizeToNull(loanInput.loan_category_id),
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
      amount_btc: amountBtc,
      status: STATUS.LOANS.ACTIVE,
    },
    {
      client: supabase,
    }
  );

  // Handle collateral separately if provided
  if (_collateral && Array.isArray(_collateral) && _collateral.length > 0 && data?.id) {
    // Collateral will be handled via separate API endpoint
    // TODO: Create loan_collateral entries via /api/loan-collateral endpoint
  }

  return data;
}
