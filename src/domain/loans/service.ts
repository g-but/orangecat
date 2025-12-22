import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/utils/logger';
import { isTableNotFound } from '@/lib/db/errors';

interface CreateLoanInput {
  title: string;
  description: string;
  loan_category_id?: string | null;
  original_amount: number;
  remaining_balance: number;
  interest_rate?: number | null;
  bitcoin_address?: string | null;
  lightning_address?: string | null;
  fulfillment_type?: 'manual' | 'automatic';
}

export async function listLoans() {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('loans')
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

export async function createLoan(userId: string, input: CreateLoanInput) {
  const mode = process.env.LOANS_WRITE_MODE || 'db';
  if (mode === 'mock') {
    throw new Error('Mock mode is disabled by policy. Set LOANS_WRITE_MODE=db');
  }

  const supabase = await createServerClient();
  const payload = { ...input, user_id: userId };
  const { data, error } = await supabase.from('loans').insert(payload).select().single();
  if (error) {
    throw error;
  }
  return data;
}
