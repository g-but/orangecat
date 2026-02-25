import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { apiSuccess, apiError, apiNotFound } from '@/lib/api/standardResponse';
import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';

// DELETE /api/entity-wallets/[id] - Remove a wallet-entity link
export const DELETE = withAuth(
  async (request: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
    const { user, supabase } = request;
    const { id } = await context.params;

    if (!id) {
      return apiError('Link ID is required', 'MISSING_ID', 400);
    }

    // Fetch the link to verify ownership
    const { data: link, error: fetchError } = await supabase
      .from(DATABASE_TABLES.ENTITY_WALLETS)
      .select('id, wallet_id, created_by')
      .eq('id', id)
      .single();

    if (fetchError || !link) {
      return apiNotFound('Entity-wallet link');
    }

    // Check if user owns the wallet or created the link
    const { data: wallet } = await supabase
      .from(DATABASE_TABLES.WALLETS)
      .select('profile_id')
      .eq('id', link.wallet_id)
      .single();

    const isOwner = wallet?.profile_id === user.id;
    const isCreator = link.created_by === user.id;

    if (!isOwner && !isCreator) {
      return apiError('Not authorized to remove this link', 'FORBIDDEN', 403);
    }

    const { error: deleteError } = await supabase
      .from(DATABASE_TABLES.ENTITY_WALLETS)
      .delete()
      .eq('id', id);

    if (deleteError) {
      logger.error('Failed to delete entity-wallet link', { id, error: deleteError.message });
      return apiError('Failed to remove link', 'DELETE_ERROR', 500);
    }

    return apiSuccess({ deleted: true });
  }
);
