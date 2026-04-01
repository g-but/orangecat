import { PLATFORM_DEFAULT_CURRENCY } from '@/config/currencies';
import { STATUS } from '@/config/database-constants';
import { entityTransforms } from '@/lib/api/normalizeEntityData';
import { createEntity } from '@/domain/base/entityService';
import { createServerClient } from '@/lib/supabase/server';
import type { CreateInvestmentRequest } from '@/types/investments';

const normalizeToNull = (value: unknown): unknown =>
  entityTransforms.emptyStringToNull(value) ?? null;

export async function createInvestment(
  userId: string,
  input: CreateInvestmentRequest,
  supabase?: Awaited<ReturnType<typeof createServerClient>>
) {
  return createEntity(
    'investment',
    userId,
    {
      title: input.title,
      description: input.description || '',
      investment_type: input.investment_type || 'revenue_share',
      target_amount: input.target_amount,
      minimum_investment: input.minimum_investment,
      maximum_investment: normalizeToNull(input.maximum_investment),
      total_raised: 0,
      currency: input.currency || PLATFORM_DEFAULT_CURRENCY,
      expected_return_rate: normalizeToNull(input.expected_return_rate),
      return_frequency: normalizeToNull(input.return_frequency),
      term_months: normalizeToNull(input.term_months),
      end_date: normalizeToNull(input.end_date),
      risk_level: normalizeToNull(input.risk_level),
      terms: normalizeToNull(input.terms),
      is_public: input.is_public ?? false,
      investor_count: 0,
      bitcoin_address: normalizeToNull(input.bitcoin_address),
      lightning_address: normalizeToNull(input.lightning_address),
      status: STATUS.INVESTMENTS.DRAFT,
    },
    {
      client: supabase,
    }
  );
}
