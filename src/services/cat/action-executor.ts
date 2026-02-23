/**
 * My Cat Action Executor
 *
 * Executes actions on behalf of users after permission verification.
 * This is the core engine that makes My Cat autonomous.
 *
 * Created: 2026-01-21
 * Last Modified: 2026-01-21
 * Last Modified Summary: Initial implementation
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { CAT_ACTIONS, type CatAction, type ActionCategory } from '@/config/cat-actions';
import { CatPermissionService } from './permission-service';
import { ENTITY_REGISTRY } from '@/config/entity-registry';
import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

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
  pendingActionId?: string; // If needs confirmation
  logId?: string; // Action log entry ID
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

// ==================== ACTION HANDLERS ====================

// Action handler type - each action has a handler function
type ActionHandler = (
  supabase: AnySupabaseClient,
  userId: string,
  actorId: string,
  params: Record<string, unknown>
) => Promise<{ success: boolean; data?: unknown; error?: string }>;

// Registry of action handlers
const ACTION_HANDLERS: Partial<Record<string, ActionHandler>> = {
  // ---------- ENTITY ACTIONS ----------

  create_product: async (supabase, _userId, actorId, params) => {
    const { data, error } = await supabase
      .from(ENTITY_REGISTRY.product.tableName)
      .insert({
        actor_id: actorId,
        title: params.title,
        description: params.description || null,
        price_sats: params.price_sats,
        category: params.category || null,
        status: params.publish ? 'active' : 'draft',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data };
  },

  create_service: async (supabase, _userId, actorId, params) => {
    // DB uses hourly_rate_sats / fixed_price_sats, not price_sats
    const priceField = params.hourly_rate_sats
      ? { hourly_rate_sats: params.hourly_rate_sats }
      : { fixed_price_sats: params.fixed_price_sats ?? params.price_sats ?? null };

    const { data, error } = await supabase
      .from(ENTITY_REGISTRY.service.tableName)
      .insert({
        actor_id: actorId,
        title: params.title,
        description: params.description || null,
        ...priceField,
        duration_minutes: params.duration_minutes || null,
        status: params.publish ? 'active' : 'draft',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data };
  },

  create_project: async (supabase, _userId, actorId, params) => {
    const { data, error } = await supabase
      .from(ENTITY_REGISTRY.project.tableName)
      .insert({
        actor_id: actorId,
        title: params.title,
        description: params.description || null,
        goal_sats: params.goal_sats,
        category: params.category || null,
        status: params.publish ? 'active' : 'draft',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data };
  },

  create_cause: async (supabase, _userId, actorId, params) => {
    const { data, error } = await supabase
      .from(ENTITY_REGISTRY.cause.tableName)
      .insert({
        actor_id: actorId,
        title: params.title,
        description: params.description || null,
        category: params.category || null,
        status: params.publish ? 'active' : 'draft',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data };
  },

  create_event: async (supabase, _userId, actorId, params) => {
    const { data, error } = await supabase
      .from(ENTITY_REGISTRY.event.tableName)
      .insert({
        actor_id: actorId,
        title: params.title,
        description: params.description || null,
        start_date: params.start_date,
        location: params.location,
        status: params.publish ? 'active' : 'draft',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data };
  },

  // ---------- COMMUNICATION ACTIONS ----------

  post_to_timeline: async (supabase, _userId, actorId, params) => {
    const { data, error } = await supabase
      .from('timeline_posts')
      .insert({
        actor_id: actorId,
        content: params.content,
        entity_id: params.entity_id || null,
        visibility: 'public',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data };
  },

  send_message: async (supabase, userId, _actorId, params) => {
    // First, find or create conversation
    const recipientId = params.recipient_id as string;

    // Check for existing conversation
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .or(
        `and(participant_1_id.eq.${userId},participant_2_id.eq.${recipientId}),and(participant_1_id.eq.${recipientId},participant_2_id.eq.${userId})`
      )
      .single();

    let conversationId: string;

    if (existingConv) {
      conversationId = existingConv.id;
    } else {
      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          participant_1_id: userId,
          participant_2_id: recipientId,
        })
        .select()
        .single();

      if (convError) {
        return { success: false, error: convError.message };
      }
      conversationId = newConv.id;
    }

    // Send message
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: params.content,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data: { ...data, conversation_id: conversationId } };
  },

  // ---------- CONTEXT ACTIONS ----------

  add_context: async (supabase, _userId, actorId, params) => {
    const { data, error } = await supabase
      .from(ENTITY_REGISTRY.document.tableName)
      .insert({
        actor_id: actorId,
        title: params.title,
        content: params.content,
        document_type: params.document_type || 'notes',
        visibility: 'cat_visible',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data };
  },

  // ---------- ORGANIZATION ACTIONS ----------

  create_organization: async (supabase, userId, _actorId, params) => {
    // Create the group (organization)
    const { data: group, error: groupError } = await supabase
      .from(ENTITY_REGISTRY.group.tableName)
      .insert({
        name: params.name,
        description: params.description || null,
        type: params.type || 'organization',
        created_by: userId,
      })
      .select()
      .single();

    if (groupError) {
      return { success: false, error: groupError.message };
    }

    // Add creator as admin member
    const { error: memberError } = await supabase.from(DATABASE_TABLES.GROUP_MEMBERS).insert({
      group_id: group.id,
      user_id: userId,
      role: 'admin',
    });

    if (memberError) {
      return { success: false, error: memberError.message };
    }

    return { success: true, data: group };
  },
};

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
    // Get pending action
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

    // Check if expired
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

    // Mark as confirmed
    await this.supabase
      .from(DATABASE_TABLES.CAT_PENDING_ACTIONS)
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('id', pendingActionId);

    // Get action definition
    const action = CAT_ACTIONS[pending.action_id];
    if (!action) {
      return {
        success: false,
        actionId: pending.action_id,
        status: 'failed',
        error: 'Action no longer available',
      };
    }

    // Execute the action
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
    // Create log entry
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
        sats_amount: this.extractSatsAmount(action, parameters),
      })
      .select()
      .single();

    if (logError) {
      logger.error('Failed to create action log', { error: logError }, 'CatActionExecutor');
    }

    // Get handler
    const handler = ACTION_HANDLERS[action.id];
    if (!handler) {
      // Update log with failure
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

    // Execute handler
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
    // Generate human-readable description of what will happen
    switch (action.id) {
      case 'create_product':
        return `Create product "${parameters.title}" priced at ${parameters.price_sats} sats`;
      case 'create_service':
        return `Create service "${parameters.title}" priced at ${parameters.price_sats} sats`;
      case 'create_project':
        return `Create crowdfunding project "${parameters.title}" with goal of ${parameters.goal_sats} sats`;
      case 'create_cause':
        return `Create cause "${parameters.title}"`;
      case 'create_event':
        return `Create event "${parameters.title}" at ${parameters.location}`;
      case 'post_to_timeline':
        return `Post to timeline: "${String(parameters.content).slice(0, 50)}..."`;
      case 'send_message':
        return `Send message to user`;
      case 'send_payment':
        return `Send ${parameters.amount_sats} sats to ${parameters.recipient}`;
      case 'add_context':
        return `Add context document: "${parameters.title}"`;
      case 'create_organization':
        return `Create organization "${parameters.name}"`;
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

  private extractSatsAmount(action: CatAction, parameters: Record<string, unknown>): number | null {
    // Extract sats amount from payment-related actions
    if (action.category === 'payments') {
      return (parameters.amount_sats as number) || (parameters.price_sats as number) || null;
    }
    return null;
  }
}

export function createActionExecutor(supabase: AnySupabaseClient): CatActionExecutor {
  return new CatActionExecutor(supabase);
}
