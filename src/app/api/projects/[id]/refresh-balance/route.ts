import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { fetchBitcoinBalance } from '@/services/blockchain';
import {
  apiSuccess,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiBadRequest,
  apiInternalError,
  apiRateLimited,
} from '@/lib/api/standardResponse';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { auditSuccess, AUDIT_ACTIONS } from '@/lib/api/auditLog';
import { logger } from '@/utils/logger';
import { getTableName } from '@/config/entity-registry';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;

    // Validate project ID
    const idValidation = getValidationError(validateUUID(projectId, 'project ID'));
    if (idValidation) {
      return idValidation;
    }

    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiUnauthorized();
    }

    const { data: project, error } = await supabase
      .from(getTableName('project'))
      .select(
        'id, user_id, bitcoin_address, bitcoin_balance_btc, bitcoin_balance_updated_at, title'
      )
      .eq('id', projectId)
      .single();

    if (error || !project) {
      logger.error('Project not found for balance refresh', { projectId, userId: user.id });
      return apiNotFound('Project not found');
    }

    if (user.id !== project.user_id) {
      logger.warn('Unauthorized balance refresh attempt', {
        projectId,
        userId: user.id,
        ownerId: project.user_id,
      });
      return apiForbidden('You can only refresh balance for your own projects');
    }

    if (!project.bitcoin_address) {
      logger.info('No Bitcoin address configured for project', { projectId, userId: user.id });
      return apiBadRequest('No Bitcoin address configured for this project');
    }

    // Check cooldown - return cached if very recent (<1 second)
    if (project.bitcoin_balance_updated_at) {
      const last = new Date(project.bitcoin_balance_updated_at);
      const secondsAgo = (Date.now() - last.getTime()) / 1000;

      if (secondsAgo < 1) {
        logger.info('Returning cached balance (updated <1s ago)', { projectId, userId: user.id });
        return apiSuccess(
          {
            balance_btc: project.bitcoin_balance_btc,
            updated_at: project.bitcoin_balance_updated_at,
            cached: true,
          },
          { status: 202 }
        );
      }

      const minutesAgo = secondsAgo / 60;
      if (minutesAgo < 5) {
        const wait = Math.ceil(5 - minutesAgo);
        logger.info('Balance refresh rate limited', {
          projectId,
          userId: user.id,
          minutesAgo,
          waitMinutes: wait,
        });
        return apiRateLimited(`Please wait ${wait} more minute${wait > 1 ? 's' : ''}`, wait * 60);
      }
    }

    // Fetch balance from blockchain
    let balance;
    try {
      balance = await fetchBitcoinBalance(project.bitcoin_address);
    } catch (error) {
      logger.error('Failed to fetch Bitcoin balance', {
        projectId,
        userId: user.id,
        address: project.bitcoin_address,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return apiInternalError('Failed to fetch balance from blockchain');
    }

    // Update project balance
    const { error: updateError } = await supabase
      .from(getTableName('project'))
      .update({
        bitcoin_balance_btc: balance.balance_btc,
        bitcoin_balance_updated_at: balance.updated_at,
      })
      .eq('id', projectId);

    if (updateError) {
      logger.error('Failed to update project balance', {
        projectId,
        userId: user.id,
        error: updateError.message,
      });
      return apiInternalError('Failed to update project balance');
    }

    // Audit log balance refresh
    await auditSuccess(AUDIT_ACTIONS.PROJECT_CREATED, user.id, 'project', projectId, {
      action: 'balance_refresh',
      previousBalance: project.bitcoin_balance_btc,
      newBalance: balance.balance_btc,
      address: project.bitcoin_address,
      txCount: balance.tx_count,
    });

    logger.info('Project balance refreshed successfully', {
      projectId,
      userId: user.id,
      balance: balance.balance_btc,
      txCount: balance.tx_count,
    });

    return apiSuccess({
      balance_btc: balance.balance_btc,
      tx_count: balance.tx_count,
      updated_at: balance.updated_at,
    });
  } catch (error) {
    logger.error('Unexpected error refreshing project balance', { error });
    return apiInternalError('Failed to refresh balance');
  }
}
