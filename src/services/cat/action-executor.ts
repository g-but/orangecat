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
import { logger } from '@/utils/logger';
import { ACTION_HANDLERS } from './handlers';

// Re-export parseReminderDate for back-compat (legacy tests import from here).
export { parseReminderDate } from './handlers/date-utils';

// ==================== TYPES ====================

export interface ActionRequest {
  actionId: string;
  parameters: Record<string, unknown>;
  conversationId?: string;
  messageId?: string;
}

export interface ActionResult {
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
      return {
        success: false,
        actionId,
        status: 'denied',
        error: permission.reason || 'Permission denied',
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
          description: this.generateActionDescription(action, parameters),
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
      .eq('status', 'pending')
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
        .update({ status: 'expired' })
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
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
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
        status: 'rejected',
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
      .eq('status', 'pending')
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
    const description = this.generateActionDescription(action, parameters);

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

  private generateActionDescription(
    action: CatAction,
    parameters: Record<string, unknown>
  ): string {
    switch (action.id) {
      case 'create_product': {
        const price = parameters.price_btc ?? parameters.price ?? 'unpriced';
        return `Create product "${parameters.title}" priced at ${price} BTC`;
      }
      case 'create_service': {
        const rate = parameters.hourly_rate ?? parameters.fixed_price;
        return `Create service "${parameters.title}"${rate ? ` at ${rate} BTC` : ''}`;
      }
      case 'create_project': {
        const goal = parameters.goal_btc ?? parameters.goal_amount ?? 'open-ended';
        return `Create project "${parameters.title}" with goal of ${goal} BTC`;
      }
      case 'create_cause':
        return `Create cause "${parameters.title}"`;
      case 'create_investment': {
        const target = parameters.target_amount_btc ?? parameters.target_amount ?? 'open-ended';
        const type = parameters.investment_type || 'revenue_share';
        return `Create ${type} investment "${parameters.title}" targeting ${target} BTC`;
      }
      case 'create_loan': {
        const amount = parameters.amount_btc ?? 'unspecified';
        const rate = parameters.interest_rate ? ` at ${parameters.interest_rate}% interest` : '';
        return `Create loan request "${parameters.title}" for ${amount} BTC${rate}`;
      }
      case 'create_research': {
        const goal = parameters.funding_goal_btc ?? 0.001;
        const field = parameters.field ? ` [${parameters.field}]` : '';
        return `Create research entity "${parameters.title}"${field} with ${goal} BTC funding goal`;
      }
      case 'create_wishlist': {
        const type = parameters.type ? ` (${parameters.type})` : '';
        return `Create wishlist "${parameters.title}"${type}`;
      }
      case 'create_event':
        return `Create event "${parameters.title}" at ${parameters.location}`;
      case 'create_asset':
        return `Register asset "${parameters.title}"${parameters.location ? ` at ${parameters.location}` : ''}`;
      case 'update_entity':
        return `Update ${parameters.entity_type} with ${Object.keys(typeof parameters.updates === 'object' ? (parameters.updates as object) : {}).join(', ') || 'changes'}`;
      case 'publish_entity':
        return `Publish ${parameters.entity_type} (make it live)`;
      case 'archive_entity':
        return `Archive ${parameters.entity_type} (remove from public view)`;
      case 'post_to_timeline':
        return `Post to timeline: "${String(parameters.content).slice(0, 50)}..."`;
      case 'send_message':
        return `Send message to user`;
      case 'reply_to_message':
        return `Reply in conversation: "${String(parameters.content).slice(0, 50)}"`;
      case 'invite_to_organization':
        return `Invite user to organization (role: ${parameters.role || 'member'})`;
      case 'send_payment': {
        const amount = parameters.amount_btc;
        return `Send ${amount} BTC to ${parameters.recipient}`;
      }
      case 'fund_project': {
        const amount = parameters.amount_btc;
        return `Fund project with ${amount} BTC`;
      }
      case 'add_context':
        return `Add context document: "${parameters.title}"`;
      case 'create_task': {
        const priority = parameters.priority ? ` [${parameters.priority}]` : '';
        const due = parameters.due_date ? ` due ${parameters.due_date}` : '';
        return `Create task: "${parameters.title}"${priority}${due}`;
      }
      case 'set_reminder': {
        const reminderTitle = (parameters.title as string | undefined) || (parameters.message as string | undefined) || 'reminder';
        const reminderWhen = (parameters.due_date as string | undefined) || (parameters.when as string | undefined) || 'no date';
        return `Set reminder: "${reminderTitle}" — ${reminderWhen}`;
      }
      case 'complete_task':
        return `Mark task as completed (id: ${parameters.task_id})`;
      case 'update_task': {
        const parts: string[] = [];
        if (parameters.title) { parts.push(`rename to "${parameters.title}"`); }
        if (parameters.due_date) { parts.push(`reschedule to ${parameters.due_date}`); }
        if (parameters.priority) { parts.push(`priority → ${parameters.priority}`); }
        return `Update task (id: ${parameters.task_id})${parts.length ? ': ' + parts.join(', ') : ''}`;
      }
      case 'create_organization':
        return `Create organization "${parameters.name}"`;
      case 'update_profile': {
        const fields = ['name', 'bio', 'background', 'website', 'location_city', 'location_country']
          .filter(f => parameters[f] !== undefined)
          .join(', ');
        return `Update profile${fields ? ': ' + fields : ''}`;
      }
      case 'add_wallet': {
        const walletLabel = parameters.label as string | undefined;
        const btype = parameters.behavior_type as string | undefined;
        const typeLabel = btype === 'one_time_goal' ? ' (goal)' : btype === 'recurring_budget' ? ' (budget)' : '';
        return `Create wallet: "${walletLabel ?? 'unnamed'}"${typeLabel}`;
      }
      default:
        return `Execute ${action.name}`;
    }
  }

  private async updateActionLog(
    logId: string,
    status: 'completed' | 'failed',
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
      return (parameters.amount_btc as number) || (parameters.price_btc as number) || (parameters.price as number) || null;
    }
    return null;
  }
}

export function createActionExecutor(supabase: AnySupabaseClient): CatActionExecutor {
  return new CatActionExecutor(supabase);
}
