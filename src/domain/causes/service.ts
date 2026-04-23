import { createEntity, updateEntity, deleteEntity } from '@/domain/base/entityService';
import { STATUS } from '@/config/database-constants';

export interface CreateCauseInput {
  title: string;
  description?: string | null;
  cause_category: string;
  target_amount?: number | null;
  currency?: 'SATS' | 'BTC' | 'USD' | 'EUR' | 'CHF';
  bitcoin_address?: string | null;
  lightning_address?: string | null;
}

export interface UpdateCauseInput extends Partial<CreateCauseInput> {
  status?: 'draft' | 'active' | 'completed' | 'cancelled';
}

export async function createCause(userId: string, input: CreateCauseInput) {
  return createEntity('cause', userId, {
    user_id: userId,
    title: input.title,
    description: input.description ?? null,
    cause_category: input.cause_category,
    target_amount: input.target_amount ?? null,
    currency: input.currency ?? 'CHF',
    bitcoin_address: input.bitcoin_address ?? null,
    lightning_address: input.lightning_address ?? null,
    status: STATUS.CAUSES.ACTIVE,
  });
}

export async function updateCause(id: string, userId: string, input: UpdateCauseInput) {
  return updateEntity('cause', id, userId, { ...input } as Record<string, unknown>);
}

export async function deleteCause(id: string, userId: string) {
  return deleteEntity('cause', id, userId);
}
