import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { apiSuccess, apiError, apiCreated } from '@/lib/api/standardResponse';
import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';

// GET /api/entity-wallets?entity_type=X&entity_id=Y  OR  ?wallet_id=X
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  const { supabase } = request;
  const searchParams = request.nextUrl.searchParams;
  const entityType = searchParams.get('entity_type');
  const entityId = searchParams.get('entity_id');
  const walletId = searchParams.get('wallet_id');

  if (walletId) {
    // Get entities linked to a specific wallet
    const { data, error } = await supabase
      .from(DATABASE_TABLES.ENTITY_WALLETS)
      .select('*')
      .eq('wallet_id', walletId);

    if (error) {
      logger.error('Failed to fetch entity-wallets by wallet_id', {
        walletId,
        error: error.message,
      });
      return apiError('Failed to fetch linked entities', 'FETCH_ERROR', 500);
    }
    return apiSuccess(data || []);
  }

  if (!entityType || !entityId) {
    return apiError('entity_type and entity_id are required (or wallet_id)', 'MISSING_PARAMS', 400);
  }

  // Get wallets linked to a specific entity, with joined wallet data
  const { data, error } = await supabase
    .from(DATABASE_TABLES.ENTITY_WALLETS)
    .select(`*, wallet:${DATABASE_TABLES.WALLETS}(*)`)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId);

  if (error) {
    logger.error('Failed to fetch entity-wallets', { entityType, entityId, error: error.message });
    return apiError('Failed to fetch linked wallets', 'FETCH_ERROR', 500);
  }

  return apiSuccess(data || []);
});

// POST /api/entity-wallets - Create a wallet-entity link
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  const { user, supabase } = request;
  const body = await request.json();
  const { wallet_id, entity_type, entity_id } = body as {
    wallet_id?: string;
    entity_type?: string;
    entity_id?: string;
  };

  if (!wallet_id || !entity_type || !entity_id) {
    return apiError('wallet_id, entity_type, and entity_id are required', 'MISSING_FIELDS', 400);
  }

  // Verify the user owns this wallet
  const { data: wallet, error: walletError } = await supabase
    .from(DATABASE_TABLES.WALLETS)
    .select('id, profile_id')
    .eq('id', wallet_id)
    .single();

  if (walletError || !wallet) {
    return apiError('Wallet not found', 'NOT_FOUND', 404);
  }

  if (wallet.profile_id !== user.id) {
    return apiError('You can only link your own wallets', 'FORBIDDEN', 403);
  }

  const { data, error } = await supabase
    .from(DATABASE_TABLES.ENTITY_WALLETS)
    .insert({
      wallet_id,
      entity_type,
      entity_id,
      is_primary: true,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    // Handle unique constraint violation
    if (error.code === '23505') {
      return apiError('This wallet is already linked to this entity', 'DUPLICATE', 409);
    }
    logger.error('Failed to create entity-wallet link', {
      wallet_id,
      entity_type,
      entity_id,
      error: error.message,
    });
    return apiError('Failed to link wallet', 'INSERT_ERROR', 500);
  }

  return apiCreated(data);
});
