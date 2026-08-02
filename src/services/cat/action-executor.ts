/**
 * My Cat Action Executor
 *
 * Executes actions on behalf of users after permission verification.
 * This is the core engine that makes My Cat autonomous.
 *
 * Handler implementations live in ./handlers/ organised by category
 * (entities, communication, organization, context, productivity, payments).
 */

import type { AnySupabaseClient } from '@/lib/supabase/types';
import { CAT_ACTIONS, type CatAction, type ActionCategory } from '@/config/cat-actions';
import { CatPermissionService } from './permission-service';
import { DATABASE_TABLES } from '@/config/database-tables';
import { STATUS } from '@/config/database-constants';
import { logger } from '@/utils/logger';
import { ACTION_HANDLERS } from './handlers';
import { generateActionDescription } from './action-descriptions';

// Re-export parseReminderDate for back-compat (legacy tests import from here).
export { parseReminderDate } from './handlers/date-utils';

// ==================== TYPES ====================

interface ActionRequest {
  actionId: string;
  parameters: Record<string, unknown>;
  conversationId?: string;
  messageId?: string;
}

interface ActionResult {
  success: boolean;
  actionId: string;
  status: 'completed' | 'failed' | 'pending_confirmation' | 'denied';
  data?: unknown;
  error?: string;
  pendingActionId?: string;
  logId?: string;
}

export interface PendingAction {
  id: string;
  actionId: string;
  category: ActionCategory;
  parameters: Record<string, unknown>;
  description: string;
  conversationId?: string;
  expiresAt: string;
}

// ==================== EXECUTOR SERVICE ====================

export class CatActionExecutor {
  private permissionService: CatPermissionService;

  constructor(private supabase: AnySupabaseClient) {
    this.permissionService = new CatPermissionService(supabase);
  }

  /**
   * Execute an action on behalf of a user
   */
  async executeAction(
    userId: string,
    actorId: string,
    request: ActionRequest
  ): Promise<ActionResult> {
    const { actionId, parameters, conversationId, messageId } = request;

    // 1. Validate action exists
    const action = CAT_ACTIONS[actionId];
    if (!action) {
      return {
        success: false,
        actionId,
        status: 'failed',
        error: `Unknown action: ${actionId}`,
      };
    }

    if (!action.enabled) {
      return {
        success: false,
        actionId,
        status: 'failed',
        error: `Action is disabled: ${actionId}`,
      };
    }

    // 2. Check permission
    const permission = await this.permissionService.checkPermission(userId, actionId);

    if (!permission.allowed) {
      const reason = permission.reason || 'Permission denied';
      // Denials are audit rows too — without them the track record only ever
      // sees wins, and the Cat re-proposes its losses forever.
      await this.logDeniedAction(userId, action, parameters, reason, conversationId, messageId);
      return {
        success: false,
        actionId,
        status: 'denied',
        error: reason,
      };
    }

    // 2b. Enforce BTC spend caps early so the user isn't asked to confirm a
    // payment that will be denied anyway. performAction re-checks as the
    // enforcement backstop (caps/budget can change between propose and confirm).
    const spendCheck = await this.permissionService.checkSpendCaps(
      userId,
      actionId,
      this.extractBtcAmount(action, parameters)
    );
    if (!spendCheck.allowed) {
      const reason = spendCheck.reason || 'Spend cap exceeded';
      await this.logDeniedAction(userId, action, parameters, reason, conversationId, messageId);
      return {
        success: false,
        actionId,
        status: 'denied',
        error: reason,
      };
    }

    // 3. If confirmation required, create pending action
    if (permission.requiresConfirmation) {
      const pendingAction = await this.createPendingAction(
        userId,
        action,
        parameters,
        conversationId,
        messageId
      );

      return {
        success: true,
        actionId,
        status: 'pending_confirmation',
        pendingActionId: pendingAction.id,
        data: {
          description: generateActionDescription(action, parameters),
          pendingAction,
        },
      };
    }

    // 4. Execute action
    return this.performAction(userId, actorId, action, parameters, conversationId, messageId);
  }

  /**
   * Confirm and execute a pending action
   */
  async confirmPendingAction(
    userId: string,
    actorId: string,
    pendingActionId: string
  ): Promise<ActionResult> {
    const { data: pending, error: fetchError } = await this.supabase
      .from(DATABASE_TABLES.CAT_PENDING_ACTIONS)
      .select('*')
      .eq('id', pendingActionId)
      .eq('user_id', userId)
      .eq('status', STATUS.CAT_PENDING_ACTIONS.PENDING)
      .single();

    if (fetchError || !pending) {
      return {
        success: false,
        actionId: '',
        status: 'failed',
        error: 'Pending action not found or already processed',
      };
    }

    if (new Date(pending.expires_at) < new Date()) {
      await this.supabase
        .from(DATABASE_TABLES.CAT_PENDING_ACTIONS)
        .update({ status: STATUS.CAT_PENDING_ACTIONS.EXPIRED })
        .eq('id', pendingActionId);

      return {
        success: false,
        actionId: pending.action_id,
        status: 'failed',
        error: 'Action has expired',
      };
    }

    await this.supabase
      .from(DATABASE_TABLES.CAT_PENDING_ACTIONS)
      .update({
        status: STATUS.CAT_PENDING_ACTIONS.CONFIRMED,
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', pendingActionId);

    const action = CAT_ACTIONS[pending.action_id];
    if (!action) {
      return {
        success: false,
        actionId: pending.action_id,
        status: 'failed',
        error: 'Action no longer available',
      };
    }

    return this.performAction(
      userId,
      actorId,
      action,
      pending.parameters,
      pending.conversation_id,
      pending.message_id
    );
  }

  /**
   * Reject a pending action
   */
  async rejectPendingAction(
    userId: string,
    pendingActionId: string,
    reason?: string
  ): Promise<void> {
    await this.supabase
      .from(DATABASE_TABLES.CAT_PENDING_ACTIONS)
      .update({
        status: STATUS.CAT_PENDING_ACTIONS.REJECTED,
        rejected_at: new Date().toISOString(),
        rejection_reason: reason || null,
      })
      .eq('id', pendingActionId)
      .eq('user_id', userId);
  }

  /**
   * Get pending actions for a user
   */
  async getPendingActions(userId: string): Promise<PendingAction[]> {
    const { data } = await this.supabase
      .from(DATABASE_TABLES.CAT_PENDING_ACTIONS)
      .select('*')
      .eq('user_id', userId)
      .eq('status', STATUS.CAT_PENDING_ACTIONS.PENDING)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    return (data || []).map(p => ({
      id: p.id,
      actionId: p.action_id,
      category: p.category,
      parameters: p.parameters,
      description: p.description,
      conversationId: p.conversation_id,
      expiresAt: p.expires_at,
    }));
  }

  /**
   * Get action history for a user
   */
  async getActionHistory(
    userId: string,
    options: { limit?: number; actionId?: string; status?: string } = {}
  ) {
    let query = this.supabase
      .from(DATABASE_TABLES.CAT_ACTION_LOG)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(options.limit || 50);

    if (options.actionId) {
      query = query.eq('action_id', options.actionId);
    }

    if (options.status) {
      query = query.eq('status', options.status);
    }

    const { data } = await query;
    return data || [];
  }

  // ==================== PRIVATE METHODS ====================

  private async performAction(
    userId: string,
    actorId: string,
    action: CatAction,
    parameters: Record<string, unknown>,
    conversationId?: string,
    messageId?: string
  ): Promise<ActionResult> {
    const { data: logEntry, error: logError } = await this.supabase
      .from(DATABASE_TABLES.CAT_ACTION_LOG)
      .insert({
        user_id: userId,
        action_id: action.id,
        category: action.category,
        parameters,
        status: 'executing',
        conversation_id: conversationId || null,
        message_id: messageId || null,
        started_at: new Date().toISOString(),
        amount_btc: this.extractBtcAmount(action, parameters),
      })
      .select()
      .single();

    if (logError) {
      logger.error('Failed to create action log', { error: logError }, 'CatActionExecutor');
    }

    // Spend-cap backstop: this is the single choke point both the direct and the
    // confirm-pending paths go through. Denials are logged for the audit trail.
    const spendCheck = await this.permissionService.checkSpendCaps(
      userId,
      action.id,
      this.extractBtcAmount(action, parameters),
      { excludeLogId: logEntry?.id }
    );
    if (!spendCheck.allowed) {
      const reason = spendCheck.reason || 'Spend cap exceeded';
      if (logEntry) {
        await this.updateActionLog(logEntry.id, 'denied', null, reason);
      }
      return {
        success: false,
        actionId: action.id,
        status: 'denied',
        error: reason,
        logId: logEntry?.id,
      };
    }

    const handler = ACTION_HANDLERS[action.id];
    if (!handler) {
      if (logEntry) {
        await this.updateActionLog(logEntry.id, 'failed', null, 'No handler for action');
      }

      return {
        success: false,
        actionId: action.id,
        status: 'failed',
        error: `No handler implemented for action: ${action.id}`,
        logId: logEntry?.id,
      };
    }

    try {
      const result = await handler(this.supabase, userId, actorId, parameters);

      if (result.success) {
        if (logEntry) {
          await this.updateActionLog(logEntry.id, 'completed', result.data);
        }

        return {
          success: true,
          actionId: action.id,
          status: 'completed',
          data: result.data,
          logId: logEntry?.id,
        };
      } else {
        if (logEntry) {
          await this.updateActionLog(logEntry.id, 'failed', null, result.error);
        }

        return {
          success: false,
          actionId: action.id,
          status: 'failed',
          error: result.error,
          logId: logEntry?.id,
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (logEntry) {
        await this.updateActionLog(logEntry.id, 'failed', null, errorMessage);
      }

      return {
        success: false,
        actionId: action.id,
        status: 'failed',
        error: errorMessage,
        logId: logEntry?.id,
      };
    }
  }

  private async createPendingAction(
    userId: string,
    action: CatAction,
    parameters: Record<string, unknown>,
    conversationId?: string,
    messageId?: string
  ): Promise<PendingAction> {
    const description = generateActionDescription(action, parameters);

    const { data, error } = await this.supabase
      .from(DATABASE_TABLES.CAT_PENDING_ACTIONS)
      .insert({
        user_id: userId,
        action_id: action.id,
        category: action.category,
        parameters,
        description,
        conversation_id: conversationId || null,
        message_id: messageId || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create pending action: ${error.message}`);
    }

    return {
      id: data.id,
      actionId: data.action_id,
      category: data.category,
      parameters: data.parameters,
      description: data.description,
      conversationId: data.conversation_id,
      expiresAt: data.expires_at,
    };
  }

  /**
   * Audit a denial that happens BEFORE performAction opens a log row (early
   * permission / spend-cap checks). One terminal insert, fire-and-safe: a
   * failed write only warns — denying the action never depends on logging it.
   */
  private async logDeniedAction(
    userId: string,
    action: CatAction,
    parameters: Record<string, unknown>,
    reason: string,
    conversationId?: string,
    messageId?: string
  ): Promise<void> {
    const { error } = await this.supabase.from(DATABASE_TABLES.CAT_ACTION_LOG).insert({
      user_id: userId,
      action_id: action.id,
      category: action.category,
      parameters,
      status: 'denied',
      error_message: reason,
      conversation_id: conversationId || null,
      message_id: messageId || null,
      completed_at: new Date().toISOString(),
      amount_btc: this.extractBtcAmount(action, parameters),
    });
    if (error) {
      logger.warn('Failed to log denied action', { error: error.message }, 'CatActionExecutor');
    }
  }

  private async updateActionLog(
    logId: string,
    status: 'completed' | 'failed' | 'denied',
    result: unknown,
    errorMessage?: string
  ): Promise<void> {
    await this.supabase
      .from(DATABASE_TABLES.CAT_ACTION_LOG)
      .update({
        status,
        result: result || null,
        error_message: errorMessage || null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', logId);
  }

  private extractBtcAmount(action: CatAction, parameters: Record<string, unknown>): number | null {
    // Extract BTC amount from payment-related actions for the action log
    if (action.category === 'payments') {
      return (
        (parameters.amount_btc as number) ||
        (parameters.price_btc as number) ||
        (parameters.price as number) ||
        null
      );
    }
    return null;
  }
}

export function createActionExecutor(supabase: AnySupabaseClient): CatActionExecutor {
  return new CatActionExecutor(supabase);
}
