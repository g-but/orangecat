import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/utils/logger';
import { getTableName } from '@/config/entity-registry';

export interface CreateCauseInput {
  title: string;
  description?: string | null;
  cause_category: string;
  goal_amount?: number | null;
  currency?: 'SATS' | 'BTC' | 'USD' | 'EUR' | 'CHF';
  bitcoin_address?: string | null;
  lightning_address?: string | null;
  distribution_rules?: any;
}

export interface UpdateCauseInput extends Partial<CreateCauseInput> {
  status?: 'draft' | 'active' | 'completed' | 'cancelled';
}

export async function createCause(userId: string, input: CreateCauseInput) {
  const supabase = await createServerClient();

  const payload = {
    user_id: userId,
    title: input.title,
    description: input.description ?? null,
    cause_category: input.cause_category,
    goal_amount: input.goal_amount ?? null,
    currency: input.currency ?? 'CHF', // Platform default
    bitcoin_address: input.bitcoin_address ?? null,
    lightning_address: input.lightning_address ?? null,
    distribution_rules: input.distribution_rules,
    status: 'active', // Always create as active
  };

  const { data, error } = await (supabase
    .from(getTableName('cause')) as any)
    .insert(payload)
    .select()
    .single();

  if (error) {
    logger.error('Failed to create cause', { error, userId, input });
    throw error;
  }

  return data;
}

export async function updateCause(id: string, userId: string, input: UpdateCauseInput) {
  const supabase = await createServerClient();

  const { data, error } = await (supabase
    .from(getTableName('cause')) as any)
    .update(input)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    logger.error('Failed to update cause', { error, id, userId, input });
    throw error;
  }

  return data;
}

export async function deleteCause(id: string, userId: string) {
  const supabase = await createServerClient();

  const { error } = await supabase
    .from(getTableName('cause'))
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    logger.error('Failed to delete cause', { error, id, userId });
    throw error;
  }
}
