import { createEntity, updateEntity, deleteEntity } from '@/domain/base/entityService';
import { STATUS } from '@/config/database-constants';

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
  return createEntity('cause', userId, {
    title: input.title,
    description: input.description ?? null,
    cause_category: input.cause_category,
    goal_amount: input.goal_amount ?? null,
    currency: input.currency ?? 'CHF',
    bitcoin_address: input.bitcoin_address ?? null,
    lightning_address: input.lightning_address ?? null,
    distribution_rules: input.distribution_rules,
    status: STATUS.CAUSES.ACTIVE,
  });
}

export async function updateCause(id: string, userId: string, input: UpdateCauseInput) {
  return updateEntity('cause', id, userId, { ...input } as Record<string, unknown>);
}

export async function deleteCause(id: string, userId: string) {
  return deleteEntity('cause', id, userId);
}
