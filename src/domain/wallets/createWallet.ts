/**
 * Wallet Creation Domain Service
 *
 * Business logic for creating wallets, extracted from the API route to keep
 * routes thin (HTTP layer only) and logic testable in isolation.
 */

import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import {
  sanitizeWalletInput,
  validateAddressOrXpub,
  detectWalletType,
  type Wallet,
} from '@/types/wallet';
import { logger } from '@/utils/logger';
import { MAX_WALLETS_PER_ENTITY } from '@/lib/wallets/constants';
import {
  logWalletError,
  handleSupabaseError,
  isTableNotFoundError,
} from '@/lib/wallets/errorHandling';
import { apiError, apiBadRequest, apiForbidden, apiCreated } from '@/lib/api/standardResponse';
import { auditSuccess, AUDIT_ACTIONS } from '@/lib/api/auditLog';
import { getTableName } from '@/config/entity-registry';
import { walletCreateSchema } from '@/lib/validation/finance';
import type { z } from 'zod';

type WalletCreateInput = z.infer<typeof walletCreateSchema>;

interface CreateWalletResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  response: NextResponse<any>;
}

export async function createWallet(
  supabase: SupabaseClient,
  user: User,
  rawBody: unknown
): Promise<CreateWalletResult> {
  const parseResult = walletCreateSchema.safeParse(rawBody);
  if (!parseResult.success) {
    return { response: apiBadRequest('Invalid input', parseResult.error.errors) };
  }
  const body: WalletCreateInput = parseResult.data;

  const entityId = (body.profile_id || body.project_id)!;
  const entityType = body.profile_id ? 'profile' : 'project';

  // Verify ownership
  const ownershipError = await verifyOwnership(supabase, user, body);
  if (ownershipError) {return { response: ownershipError };}

  // Sanitize and validate address
  const sanitized = sanitizeWalletInput(body);
  const walletType = sanitized.address_or_xpub
    ? detectWalletType(sanitized.address_or_xpub)
    : 'lightning';

  if (sanitized.address_or_xpub) {
    const addressValidation = validateAddressOrXpub(sanitized.address_or_xpub);
    if (!addressValidation.valid) {
      return {
        response: apiError(addressValidation.error || 'Invalid address/xpub', 'INVALID_ADDRESS', 400, {
          field: 'address_or_xpub',
        }),
      };
    }
  }

  // Duplicate check and wallet count enforcement
  const preCheckResult = await runPreInsertChecks(supabase, body, sanitized, entityId, entityType);
  if ('response' in preCheckResult && preCheckResult.response) {
    return { response: preCheckResult.response };
  }
  const { isFirstWallet, duplicateInfo } = preCheckResult as {
    isFirstWallet: boolean;
    duplicateInfo: DuplicateInfo | null;
    response: null;
  };

  // Insert wallet
  try {
    const { data: wallet, error } = await supabase
      .from(getTableName('wallet'))
      .insert({
        profile_id: body.profile_id || null,
        project_id: body.project_id || null,
        label: sanitized.label,
        description: sanitized.description || null,
        address_or_xpub: sanitized.address_or_xpub || null,
        wallet_type: walletType,
        category: sanitized.category,
        category_icon: sanitized.category_icon || '💰',
        behavior_type: body.behavior_type || 'general',
        budget_amount: body.budget_amount || null,
        budget_period: body.budget_period || null,
        goal_amount: sanitized.goal_amount || null,
        goal_currency: sanitized.goal_currency || null,
        goal_deadline: sanitized.goal_deadline || null,
        lightning_address: body.lightning_address?.trim() || null,
        is_primary: body.is_primary !== undefined ? body.is_primary : isFirstWallet,
        balance_btc: 0,
      })
      .select()
      .single() as { data: Wallet | null; error: { message: string; code?: string } | null };

    if (error) {
      if (error.message.includes(`Maximum ${MAX_WALLETS_PER_ENTITY}`)) {
        return { response: apiError(`Maximum ${MAX_WALLETS_PER_ENTITY} wallets allowed`, 'WALLET_LIMIT', 400) };
      }
      if (isTableNotFoundError(error)) {
        return { response: apiError('Wallets table not available', 'TABLE_NOT_FOUND', 503) };
      }
      return { response: handleSupabaseError('create wallet', error, { entityId }) };
    }

    await auditSuccess(AUDIT_ACTIONS.WALLET_CREATED, user.id, 'wallet', wallet?.id ?? '', {
      walletType,
      category: sanitized.category,
      entityType,
      entityId,
    });

    const responseData = {
      wallet,
      ...(duplicateInfo && { duplicateWarning: duplicateInfo }),
    };
    return { response: apiCreated(responseData) };
  } catch (insertError: unknown) {
    if (isTableNotFoundError(insertError)) {
      return { response: apiError('Wallets table not available', 'TABLE_NOT_FOUND', 503) };
    }
    return { response: handleSupabaseError('create wallet', insertError, { entityId }) };
  }
}

// ── Internal helpers ──────────────────────────────────────────────────────────

async function verifyOwnership(
  supabase: SupabaseClient,
  user: User,
  body: WalletCreateInput
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<NextResponse<any> | null> {
  if (body.profile_id) {
    if (body.profile_id !== user.id) {
      logWalletError('verify profile ownership', new Error('Ownership mismatch'), {
        profile_id: body.profile_id,
        user_id: user.id,
      });
      return apiForbidden('Forbidden: Profile does not belong to this user');
    }
    return null;
  }
  if (body.project_id) {
    const { data: project } = await supabase
      .from(getTableName('project'))
      .select('user_id')
      .eq('id', body.project_id)
      .single() as { data: { user_id: string } | null };

    if (!project || project.user_id !== user.id) {
      return apiForbidden();
    }
  }
  return null;
}

interface DuplicateInfo {
  existingWallets: Array<{ id: string; label: string; category: string }>;
  message: string;
}

interface PreCheckOk {
  isFirstWallet: boolean;
  duplicateInfo: DuplicateInfo | null;
  response: null;
}
interface PreCheckFail {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  response: NextResponse<any>;
}

async function runPreInsertChecks(
  supabase: SupabaseClient,
  body: WalletCreateInput,
  sanitized: ReturnType<typeof sanitizeWalletInput>,
  entityId: string,
  entityType: string
): Promise<PreCheckOk | PreCheckFail> {
  try {
    const eqField = body.profile_id ? 'profile_id' : 'project_id';
    const addressToCheck = sanitized.address_or_xpub || null;
    let duplicateInfo: DuplicateInfo | null = null;

    // Duplicate address check
    if (addressToCheck && body.force_duplicate !== true) {
      const { data: existing } = await supabase
        .from(getTableName('wallet'))
        .select('id')
        .eq(eqField, entityId)
        .eq('address_or_xpub', addressToCheck)
        .eq('is_active', true)
        .single();

      if (existing) {
        const { data: existingWallets } = await supabase
          .from(getTableName('wallet'))
          .select('id, label, category')
          .eq(eqField, entityId)
          .eq('address_or_xpub', addressToCheck)
          .eq('is_active', true);

        logger.warn('Duplicate wallet address detected', {
          address: sanitized.address_or_xpub,
          entityId,
          entityType,
          existingCount: existingWallets?.length,
        }, 'WalletManagement');

        duplicateInfo = {
          existingWallets: existingWallets || [],
          message: 'This wallet address is already connected to your account',
        };
      }
    }

    // Wallet count check
    const { data: existingWallets } = await supabase
      .from(getTableName('wallet'))
      .select('id')
      .eq(eqField, entityId)
      .eq('is_active', true);

    const walletCount = existingWallets?.length || 0;
    if (walletCount >= MAX_WALLETS_PER_ENTITY) {
      return {
        response: apiError(
          `Maximum ${MAX_WALLETS_PER_ENTITY} wallets allowed per profile/project`,
          'WALLET_LIMIT_REACHED',
          400
        ),
      };
    }

    return { isFirstWallet: walletCount === 0, duplicateInfo, response: null };
  } catch (dupCheckError: unknown) {
    if (!isTableNotFoundError(dupCheckError)) {
      return { response: handleSupabaseError('check existing wallets', dupCheckError, { entityId }) };
    }
    // Wallets table missing — let the insert attempt handle it
    return { isFirstWallet: true, duplicateInfo: null, response: null };
  }
}
