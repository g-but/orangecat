import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/utils/logger';
import { getTableName } from '@/config/entity-registry';
import { getOrCreateUserActor } from '@/services/actors/getOrCreateUserActor';

export interface CreateCauseInput {
  title: string;
  description?: string | null;
  cause_category: string;
  goal_amount?: number | null;
  currency?: 'SATS' | 'BTC' | 'USD' | 'EUR' | 'CHF';
  bitcoin_address?: string | null;
  lightning_address?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  distribution_rules?: any;
}

export interface UpdateCauseInput extends Partial<CreateCauseInput> {
  status?: 'draft' | 'active' | 'completed' | 'cancelled';
}

export async function createCause(userId: string, input: CreateCauseInput) {
  const actor = await getOrCreateUserActor(userId);
  const supabase = await createServerClient();

  const payload = {
    actor_id: actor.id,
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from(getTableName('cause')) as any)
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
  const actor = await getOrCreateUserActor(userId);
  const supabase = await createServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from(getTableName('cause')) as any)
    .update(input)
    .eq('id', id)
    .eq('actor_id', actor.id)
    .select()
    .single();

  if (error) {
    logger.error('Failed to update cause', { error, id, userId, input });
    throw error;
  }

  return data;
}

export async function deleteCause(id: string, userId: string) {
  const actor = await getOrCreateUserActor(userId);
  const supabase = await createServerClient();

  const { error } = await supabase
    .from(getTableName('cause'))
    .delete()
    .eq('id', id)
    .eq('actor_id', actor.id);

  if (error) {
    logger.error('Failed to delete cause', { error, id, userId });
    throw error;
  }
}
