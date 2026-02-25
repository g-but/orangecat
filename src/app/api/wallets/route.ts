import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import {
  WalletFormData,
  validateWalletFormData,
  sanitizeWalletInput,
  validateAddressOrXpub,
  detectWalletType,
} from '@/types/wallet';
import { logger } from '@/utils/logger';
import { MAX_WALLETS_PER_ENTITY } from '@/lib/wallets/constants';
import {
  logWalletError,
  handleSupabaseError,
  isTableNotFoundError,
} from '@/lib/wallets/errorHandling';
import { applyRateLimitHeaders, type RateLimitResult } from '@/lib/rate-limit';
import { enforceUserWriteLimit, RateLimitError } from '@/lib/api/rateLimiting';
import {
  apiRateLimited,
  apiSuccess,
  apiError,
  apiCreated,
  apiForbidden,
  apiValidationError,
} from '@/lib/api/standardResponse';
import { validateOneOfIds, getValidationError } from '@/lib/api/validation';
import { auditSuccess, AUDIT_ACTIONS } from '@/lib/api/auditLog';
import { getTableName } from '@/config/entity-registry';

type _SupabaseClient = Awaited<ReturnType<typeof createServerClient>>;

// GET /api/wallets?profile_id=xxx OR ?project_id=xxx
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const searchParams = request.nextUrl.searchParams;
    const profileId = searchParams.get('profile_id');
    const projectId = searchParams.get('project_id');

    // Validate that exactly one ID is provided using centralized validator
    const idValidation = validateOneOfIds(
      { profile_id: profileId, project_id: projectId },
      'profile_id or project_id is required'
    );
    const validationError = getValidationError(idValidation);
    if (validationError) {
      return validationError;
    }

    // Build query for wallets table
    let query = supabase
      .from(getTableName('wallet'))
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (profileId) {
      query = query.eq('profile_id', profileId);
    } else if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to fetch wallets', {
        profileId,
        projectId,
        error: error.message,
        code: error.code,
      });
      return handleSupabaseError('fetch wallets', error, { profileId, projectId });
    }

    // Return wallets with standard response format and caching
    return apiSuccess(data || [], { cache: 'SHORT' });
  } catch (error) {
    logger.error('Unexpected error in GET /api/wallets', { error });
    return handleSupabaseError('fetch wallets', error);
  }
}

// POST /api/wallets - Create new wallet (FIXED VERSION)
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { user, supabase } = request;

    // Rate limiting check - 30 writes per minute per user
    let rateLimitResult: RateLimitResult;
    try {
      rateLimitResult = await enforceUserWriteLimit(user.id);
    } catch (e) {
      if (e instanceof RateLimitError) {
        const retryAfter = e.details?.retryAfter || 60;
        logger.info('Wallet creation rate limit exceeded', { userId: user.id });
        return apiRateLimited('Too many wallet creation requests. Please slow down.', retryAfter);
      }
      throw e;
    }

    const body = (await request.json()) as WalletFormData & {
      profile_id?: string;
      project_id?: string;
      force_duplicate?: boolean;
      lightning_address?: string;
    };

    // Validate entity ownership
    if (!body.profile_id && !body.project_id) {
      return apiError('profile_id or project_id required', 'MISSING_ENTITY', 400);
    }

    if (body.profile_id && body.project_id) {
      return apiError('Cannot specify both profile_id and project_id', 'INVALID_ENTITY', 400);
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const entityId = body.profile_id || body.project_id!;
    const entityType = body.profile_id ? 'profile' : 'project';
    if (!uuidRegex.test(entityId)) {
      return apiError('Invalid entity ID format', 'INVALID_ID', 400);
    }

    // Validate form data
    const validation = validateWalletFormData(body);
    if (!validation.valid) {
      return apiValidationError(validation.error || 'Validation failed');
    }

    // Verify ownership
    if (body.profile_id) {
      // Profiles.id IS the user_id (references auth.users), so we can directly compare
      if (body.profile_id !== user.id) {
        logWalletError('verify profile ownership', new Error('Ownership mismatch'), {
          profile_id: body.profile_id,
          user_id: user.id,
        });
        return apiForbidden('Forbidden: Profile does not belong to this user');
      }
    } else if (body.project_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: project } = await (supabase.from(getTableName('project')) as any)
        .select('user_id')
        .eq('id', body.project_id)
        .single();

      if (!project || project.user_id !== user.id) {
        return apiForbidden();
      }
    }

    // Sanitize input
    const sanitized = sanitizeWalletInput(body);

    // Detect wallet type
    const walletType = detectWalletType(sanitized.address_or_xpub);

    // Double-check validation for security
    const addressValidation = validateAddressOrXpub(sanitized.address_or_xpub);
    if (!addressValidation.valid) {
      return apiError(addressValidation.error || 'Invalid address/xpub', 'INVALID_ADDRESS', 400, {
        field: 'address_or_xpub',
      });
    }

    // Check for duplicate address/xpub for this entity in the wallets table if it exists.
    // If the table does not exist (42P01), we will fall back to profile-based storage below.
    let isFirstWallet = false;
    let duplicateInfo: {
      existingWallets: Array<{ id: string; label: string; category: string }>;
      message: string;
    } | null = null;

    try {
      const { data: existingWallet } = await supabase
        .from(getTableName('wallet'))
        .select('id')
        .eq(body.profile_id ? 'profile_id' : 'project_id', entityId)
        .eq('address_or_xpub', sanitized.address_or_xpub)
        .eq('is_active', true)
        .single();

      const forceDuplicate = body.force_duplicate === true;

      if (existingWallet && !forceDuplicate) {
        // Get details of existing wallets with the same address
        const { data: existingWallets } = await supabase
          .from(getTableName('wallet'))
          .select('id, label, category')
          .eq(body.profile_id ? 'profile_id' : 'project_id', entityId)
          .eq('address_or_xpub', sanitized.address_or_xpub)
          .eq('is_active', true);

        duplicateInfo = {
          existingWallets: existingWallets || [],
          message: 'This wallet address is already connected to your account',
        };

        logger.warn(
          'Duplicate wallet address detected',
          {
            address: sanitized.address_or_xpub,
            entityId,
            entityType,
            existingCount: existingWallets?.length,
          },
          'WalletManagement'
        );
      }

      const { data: existingWallets } = await supabase
        .from(getTableName('wallet'))
        .select('id')
        .eq(body.profile_id ? 'profile_id' : 'project_id', entityId)
        .eq('is_active', true);

      const walletCount = existingWallets?.length || 0;
      isFirstWallet = walletCount === 0;

      if (walletCount >= MAX_WALLETS_PER_ENTITY) {
        return apiError(
          `Maximum ${MAX_WALLETS_PER_ENTITY} wallets allowed per profile/project`,
          'WALLET_LIMIT_REACHED',
          400
        );
      }
    } catch (dupCheckError: unknown) {
      if (!isTableNotFoundError(dupCheckError)) {
        return handleSupabaseError('check existing wallets', dupCheckError, { entityId });
      }
      // If wallets table is missing, we'll handle persistence via fallback below.
    }

    // Try to create the wallet in the dedicated wallets table first
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: wallet, error } = await (supabase.from(getTableName('wallet')) as any)
        .insert({
          profile_id: body.profile_id || null,
          project_id: body.project_id || null,
          label: sanitized.label,
          description: sanitized.description || null,
          address_or_xpub: sanitized.address_or_xpub,
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
        .single();

      if (error) {
        // Check for specific error messages
        if (error.message.includes(`Maximum ${MAX_WALLETS_PER_ENTITY}`)) {
          return apiError(`Maximum ${MAX_WALLETS_PER_ENTITY} wallets allowed`, 'WALLET_LIMIT', 400);
        }

        // If the wallets table is missing, return a clear, consistent error
        if (isTableNotFoundError(error)) {
          return apiError('Wallets table not available', 'TABLE_NOT_FOUND', 503);
        }

        return handleSupabaseError('create wallet', error, { entityId });
      }

      // Audit log wallet creation
      await auditSuccess(AUDIT_ACTIONS.WALLET_CREATED, user.id, 'wallet', wallet.id, {
        walletType,
        category: sanitized.category,
        entityType,
        entityId,
      });

      const responseData = {
        wallet,
        ...(duplicateInfo && { duplicateWarning: duplicateInfo }),
      };
      return applyRateLimitHeaders(apiCreated(responseData), rateLimitResult);
    } catch (insertError: unknown) {
      if (isTableNotFoundError(insertError)) {
        return apiError('Wallets table not available', 'TABLE_NOT_FOUND', 503);
      }
      return handleSupabaseError('create wallet', insertError, { entityId });
    }
  } catch (error) {
    return handleSupabaseError('create wallet', error);
  }
});
