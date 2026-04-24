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
import type { AnySupabaseClient } from '@/lib/supabase/types';
import { CAT_ACTIONS, type CatAction, type ActionCategory } from '@/config/cat-actions';
import { CatPermissionService } from './permission-service';
import { ENTITY_REGISTRY } from '@/config/entity-registry';
import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';
import { NWCClient } from '@/lib/nostr/nwc';
import { decrypt } from '@/domain/payments/encryptionService';
import { generateInvoice } from '@/domain/payments/invoiceGenerationService';
import { resolveSellerWallet, getSellerUserId } from '@/domain/payments/walletResolutionService';
import { getAdminClient } from '@/lib/supabase/admin';
import type { ResolvedWallet } from '@/domain/payments/types';

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

/**
 * Parses natural-language reminder time expressions into ISO timestamps.
 * Returns an ISO string on success, or null if the expression cannot be parsed.
 *
 * Supports:
 *   - Relative: "in 30 minutes", "in 2 hours", "in 3 days"
 *   - Named: "tomorrow", "next week", "next month"
 *   - ISO/date strings: passed through as-is if parseable
 */
export function parseReminderDate(when: string): string | null {
  if (!when) { return null; }
  const now = new Date();
  const lower = when.trim().toLowerCase();

  // "in N unit" pattern
  const inMatch = lower.match(/^in\s+(\d+)\s+(minute|minutes|hour|hours|day|days|week|weeks|month|months)$/);
  if (inMatch) {
    const n = parseInt(inMatch[1], 10);
    const unit = inMatch[2];
    const result = new Date(now);
    if (unit.startsWith('minute')) { result.setMinutes(result.getMinutes() + n); }
    else if (unit.startsWith('hour')) { result.setHours(result.getHours() + n); }
    else if (unit.startsWith('day')) { result.setDate(result.getDate() + n); }
    else if (unit.startsWith('week')) { result.setDate(result.getDate() + n * 7); }
    else if (unit.startsWith('month')) { result.setMonth(result.getMonth() + n); }
    return result.toISOString();
  }

  // Named shortcuts
  if (lower === 'tomorrow') {
    const result = new Date(now);
    result.setDate(result.getDate() + 1);
    result.setHours(9, 0, 0, 0); // 9 AM next day
    return result.toISOString();
  }
  if (lower === 'next week') {
    const result = new Date(now);
    result.setDate(result.getDate() + 7);
    result.setHours(9, 0, 0, 0);
    return result.toISOString();
  }
  if (lower === 'next month') {
    const result = new Date(now);
    result.setMonth(result.getMonth() + 1);
    result.setDate(1);
    result.setHours(9, 0, 0, 0);
    return result.toISOString();
  }

  // Try parsing as a date string directly
  const parsed = new Date(when);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  // Couldn't parse — store null, the reminder will be "timeless"
  return null;
}

// Registry of action handlers
const ACTION_HANDLERS: Partial<Record<string, ActionHandler>> = {
  // ---------- ENTITY ACTIONS ----------

  create_product: async (supabase, _userId, actorId, params) => {
    // DB column is `price` (numeric), not `price_btc`
    const price = (params.price_btc as number | null) ?? (params.price as number | null) ?? null;

    const { data, error } = await supabase
      .from(ENTITY_REGISTRY.product.tableName)
      .insert({
        actor_id: actorId,
        title: params.title,
        description: params.description || null,
        price,
        currency: 'BTC',
        product_type: 'physical',
        images: [],
        fulfillment_type: 'manual',
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
    // DB columns are `hourly_rate` and `fixed_price` (no _btc suffix)
    const priceField = params.hourly_rate
      ? { hourly_rate: params.hourly_rate as number }
      : params.fixed_price
        ? { fixed_price: params.fixed_price as number }
        : params.hourly_rate_btc
          ? { hourly_rate: params.hourly_rate_btc }
          : { fixed_price: params.fixed_price_btc ?? params.price_btc ?? null };

    const { data, error } = await supabase
      .from(ENTITY_REGISTRY.service.tableName)
      .insert({
        actor_id: actorId,
        title: params.title,
        description: params.description || null,
        ...priceField,
        currency: 'BTC',
        duration_minutes: params.duration_minutes || null,
        service_location_type: 'remote',
        images: [],
        portfolio_links: [],
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
    // DB columns are `goal_amount` + `currency`, not `goal_btc`
    const goalAmount = (params.goal_btc as number | null) ?? (params.goal_amount as number | null) ?? null;

    const { data, error } = await supabase
      .from(ENTITY_REGISTRY.project.tableName)
      .insert({
        actor_id: actorId,
        title: params.title,
        description: params.description || null,
        goal_amount: goalAmount,
        currency: 'BTC',
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
    // DB column is `cause_category` (not `category`); target_amount is the funding goal
    const targetAmount = (params.goal_btc as number | null) ?? (params.target_amount as number | null) ?? (params.goal_amount as number | null) ?? null;
    const { data, error } = await supabase
      .from(ENTITY_REGISTRY.cause.tableName)
      .insert({
        actor_id: actorId,
        title: params.title,
        description: params.description || null,
        cause_category: (params.cause_category as string | null) ?? (params.category as string | null) ?? null,
        target_amount: targetAmount,
        currency: 'BTC',
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

  create_asset: async (supabase, _userId, actorId, params) => {
    const { data, error } = await supabase
      .from(ENTITY_REGISTRY.asset.tableName)
      .insert({
        actor_id: actorId,
        title: params.title,
        description: params.description || null,
        type: params.asset_type || null,
        location: params.location || null,
        currency: 'BTC',
        verification_status: 'unverified',
        public_visibility: false,
        status: params.publish ? 'active' : 'draft',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data };
  },

  create_investment: async (supabase, _userId, actorId, params) => {
    // DB columns: target_amount + currency (not target_amount_btc), minimum_investment.
    // Published investments use status='open' (not 'active') per investments status enum.
    const targetAmount = (params.target_amount_btc as number | null) ?? (params.target_amount as number | null) ?? null;
    const minimumInvestment = (params.minimum_investment_btc as number | null) ?? (params.minimum_investment as number | null) ?? 0.0001;

    const { data, error } = await supabase
      .from(ENTITY_REGISTRY.investment.tableName)
      .insert({
        actor_id: actorId,
        title: params.title,
        description: params.description || null,
        investment_type: (params.investment_type as string) || 'revenue_share',
        target_amount: targetAmount,
        minimum_investment: minimumInvestment,
        currency: 'BTC',
        total_raised: 0,
        investor_count: 0,
        is_public: Boolean(params.publish),
        status: params.publish ? 'open' : 'draft',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data };
  },

  create_loan: async (supabase, userId, actorId, params) => {
    // Loans table has both actor_id (added by migration) and user_id (original).
    // amount_btc → original_amount + remaining_balance (BTC decimal columns).
    // amount_sats is the legacy satoshi column; kept in sync via conversion.
    const amountBtc = (params.amount_btc as number) ?? 0;
    const amountSats = Math.round(amountBtc * 100_000_000);

    const { data, error } = await supabase
      .from(ENTITY_REGISTRY.loan.tableName)
      .insert({
        actor_id: actorId,
        user_id: userId,
        title: params.title,
        description: params.description || null,
        loan_type: (params.loan_type as string) || 'new_request',
        original_amount: amountBtc,
        remaining_balance: amountBtc,
        amount_sats: amountSats,
        currency: 'BTC',
        interest_rate: (params.interest_rate as number | undefined) ?? null,
        fulfillment_type: 'manual',
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data };
  },

  // ---------- ENTITY MANAGEMENT ACTIONS ----------

  update_entity: async (supabase, _userId, actorId, params) => {
    const entityType = params.entity_type as string;
    const entityId = params.entity_id as string;
    const updates = (
      typeof params.updates === 'string' ? JSON.parse(params.updates) : params.updates
    ) as Record<string, unknown>;

    const meta = ENTITY_REGISTRY[entityType as keyof typeof ENTITY_REGISTRY];
    if (!meta) {
      return { success: false, error: `Unknown entity type: ${entityType}` };
    }

    // Only allow updating safe fields.
    // cause_category is the causes-specific equivalent of category (causes table has no generic `category` column).
    const safeFields = ['title', 'description', 'category', 'cause_category', 'status', 'tags'];
    const safeUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (safeFields.includes(key)) {
        safeUpdates[key] = value;
      }
    }

    if (Object.keys(safeUpdates).length === 0) {
      return { success: false, error: 'No valid fields to update' };
    }

    const { data, error } = await supabase
      .from(meta.tableName)
      .update(safeUpdates)
      .eq('id', entityId)
      .eq('actor_id', actorId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data };
  },

  publish_entity: async (supabase, _userId, actorId, params) => {
    const entityType = params.entity_type as string;
    const entityId = params.entity_id as string;

    const meta = ENTITY_REGISTRY[entityType as keyof typeof ENTITY_REGISTRY];
    if (!meta) {
      return { success: false, error: `Unknown entity type: ${entityType}` };
    }

    const { data, error } = await supabase
      .from(meta.tableName)
      .update({ status: 'active' })
      .eq('id', entityId)
      .eq('actor_id', actorId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data };
  },

  archive_entity: async (supabase, _userId, actorId, params) => {
    // Soft-delete: set status to 'archived'. Reversible. Works for all entity types.
    // Uses actor_id ownership guard so users can only archive their own entities.
    const entityType = params.entity_type as string;
    const entityId = params.entity_id as string;

    const meta = ENTITY_REGISTRY[entityType as keyof typeof ENTITY_REGISTRY];
    if (!meta) {
      return { success: false, error: `Unknown entity type: ${entityType}` };
    }

    const { data, error } = await supabase
      .from(meta.tableName)
      .update({ status: 'archived' })
      .eq('id', entityId)
      .eq('actor_id', actorId)
      .select('id, title, status')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const title = (data as Record<string, unknown>)?.title as string | undefined;
    return {
      success: true,
      data: {
        ...data,
        displayMessage: `🗂️ "${title ?? entityId}" has been archived and removed from public view`,
      },
    };
  },

  // ---------- COMMUNICATION ACTIONS ----------

  post_to_timeline: async (supabase, _userId, actorId, params) => {
    // timeline_events schema: event_type, event_subtype, subject_type (all required),
    // title (required), description (text), content (jsonb { text: ... })
    // No entity_id column — not timeline_posts (which doesn't exist).
    const text = (params.content as string) || '';
    const title = text.length > 100 ? text.slice(0, 97) + '…' : text;

    const { data, error } = await supabase
      .from(DATABASE_TABLES.TIMELINE_EVENTS)
      .insert({
        actor_id: actorId,
        event_type: 'post',
        event_subtype: 'text',
        subject_type: 'profile',
        title,
        description: text,
        content: { text },
        visibility: (params.visibility as string) || 'public',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data };
  },

  send_message: async (supabase, userId, _actorId, params) => {
    // Resolve recipient: accept "@username" (preferred) or raw UUID (fallback)
    let recipientId = params.recipient_id as string | undefined;
    const recipientParam = (params.recipient as string | undefined) ?? recipientId;

    if (!recipientParam) {
      return { success: false, error: 'recipient is required' };
    }

    if (recipientParam.startsWith('@') || !recipientParam.match(/^[0-9a-f-]{36}$/i)) {
      // Looks like a username — resolve to user ID via profiles table
      const username = recipientParam.replace(/^@/, '');
      const { data: profile, error: profileError } = await supabase
        .from(DATABASE_TABLES.PROFILES)
        .select('id')
        .eq('username', username)
        .single();

      if (profileError || !profile) {
        return { success: false, error: `User @${username} not found` };
      }
      recipientId = profile.id as string;
    } else {
      recipientId = recipientParam;
    }

    // Find existing direct conversation via conversation_participants junction table
    // (conversations has no participant_1_id/participant_2_id columns — uses junction table)
    const { data: myParticipations } = await supabase
      .from(DATABASE_TABLES.CONVERSATION_PARTICIPANTS)
      .select('conversation_id')
      .eq('user_id', userId)
      .eq('is_active', true);

    const myConvIds = (myParticipations || []).map(
      (r: { conversation_id: string }) => r.conversation_id
    );

    let conversationId: string | null = null;

    if (myConvIds.length > 0) {
      const { data: shared } = await supabase
        .from(DATABASE_TABLES.CONVERSATION_PARTICIPANTS)
        .select('conversation_id')
        .eq('user_id', recipientId)
        .eq('is_active', true)
        .in('conversation_id', myConvIds)
        .limit(1)
        .maybeSingle();

      conversationId = (shared as { conversation_id: string } | null)?.conversation_id ?? null;
    }

    if (!conversationId) {
      // Create new direct conversation + both participant rows
      const { data: newConv, error: convError } = await supabase
        .from(DATABASE_TABLES.CONVERSATIONS)
        .insert({ created_by: userId, is_group: false })
        .select('id')
        .single();

      if (convError || !newConv) {
        return { success: false, error: convError?.message ?? 'Failed to create conversation' };
      }
      conversationId = (newConv as { id: string }).id;

      const { error: partError } = await supabase
        .from(DATABASE_TABLES.CONVERSATION_PARTICIPANTS)
        .insert([
          { conversation_id: conversationId, user_id: userId, role: 'member', is_active: true },
          { conversation_id: conversationId, user_id: recipientId, role: 'member', is_active: true },
        ])
        .select();

      if (partError) {
        return { success: false, error: `Could not set up conversation: ${partError.message}` };
      }
    }

    // Send message
    const { data, error } = await supabase
      .from(DATABASE_TABLES.MESSAGES)
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: params.content,
        message_type: 'text',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data: { ...data, conversation_id: conversationId } };
  },

  reply_to_message: async (supabase, userId, _actorId, params) => {
    const { data, error } = await supabase
      .from(DATABASE_TABLES.MESSAGES)
      .insert({
        conversation_id: params.conversation_id,
        sender_id: userId,
        content: params.content,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data };
  },

  invite_to_organization: async (supabase, userId, _actorId, params) => {
    // group_invitations: group_id (= organization_id), user_id, role, invited_by (inviter's userId)
    const { data, error } = await supabase
      .from(DATABASE_TABLES.GROUP_INVITATIONS)
      .insert({
        group_id: params.organization_id,
        user_id: params.user_id,
        role: (params.role as string) || 'member',
        invited_by: userId,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data };
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

  update_profile: async (supabase, userId, _actorId, params) => {
    // Update the user's public profile. Only safe text fields — no username (affects URLs),
    // no email, no financial addresses. Profile.id = auth.users.id = userId.
    const SAFE_FIELDS = ['name', 'bio', 'background', 'website', 'location_city', 'location_country'] as const;
    type SafeField = typeof SAFE_FIELDS[number];

    const updates: Partial<Record<SafeField, string>> = {};
    for (const field of SAFE_FIELDS) {
      if (params[field] !== undefined && params[field] !== null) {
        updates[field] = params[field] as string;
      }
    }

    if (Object.keys(updates).length === 0) {
      return { success: false, error: 'No profile fields to update — provide at least one of: name, bio, background, website, location_city, location_country' };
    }

    const { data, error } = await supabase
      .from(DATABASE_TABLES.PROFILES)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('name, bio, background, website, location_city, location_country')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const updatedFields = Object.keys(updates).join(', ');
    return {
      success: true,
      data: {
        ...data,
        displayMessage: `✅ Profile updated: ${updatedFields}`,
      },
    };
  },

  // ---------- PRODUCTIVITY ACTIONS ----------

  create_task: async (supabase, userId, _actorId, params) => {
    // DB columns: current_status (not status), task_type enum: one_time|recurring_scheduled|recurring_as_needed,
    // category enum: cleaning|maintenance|admin|inventory|it|kitchen|workshop|logistics|other,
    // priority enum: low|normal|high|urgent (not medium — map 'medium' defensively)
    const rawPriority = (params.priority as string) || 'normal';
    const priority = rawPriority === 'medium' ? 'normal' : rawPriority;
    // Accept both `description` and `notes` — system prompt documents `notes`
    const description = (params.description as string | null) || (params.notes as string | null) || null;

    const { data, error } = await supabase
      .from(DATABASE_TABLES.TASKS)
      .insert({
        created_by: userId,
        title: params.title,
        description,
        priority,
        task_type: 'one_time',
        category: 'other',
        current_status: 'idle',
        due_date: (params.due_date as string | null) || null,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data };
  },

  set_reminder: async (supabase, userId, _actorId, params) => {
    // System prompt documents: title, due_date (ISO or natural language), notes
    // Handler also accepts legacy aliases: message (→title), when (→due_date)
    const title = (params.title as string | undefined) || (params.message as string | undefined) || '';
    const when = (params.due_date as string | undefined) || (params.when as string | undefined) || '';
    const notes = (params.notes as string | undefined) || null;

    if (!title) {
      return { success: false, error: 'title is required for set_reminder' };
    }

    // Parse natural-language or ISO "when" into a stored ISO timestamp.
    // Supports: "in N minutes/hours/days", "tomorrow", "next week", specific ISO strings.
    const dueDate = parseReminderDate(when);

    const description = notes
      ? `Reminder set by My Cat\nNotes: ${notes}`
      : `Reminder set by My Cat`;

    const { data, error } = await supabase
      .from(DATABASE_TABLES.TASKS)
      .insert({
        created_by: userId,
        title,
        description,
        priority: 'normal',
        task_type: 'one_time',
        category: 'other',
        current_status: 'idle',
        is_reminder: true,
        due_date: dueDate,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const dueDateDisplay = dueDate
      ? new Date(dueDate).toLocaleString('en-CH', { dateStyle: 'medium', timeStyle: 'short' })
      : when || 'no date set';

    return {
      success: true,
      data: {
        ...data,
        displayMessage: `Reminder set for ${dueDateDisplay}: "${title}"`,
      },
    };
  },

  complete_task: async (supabase, userId, _actorId, params) => {
    const taskId = params.task_id as string;
    const notes = (params.notes as string | null) || null;

    // First fetch the task to confirm it belongs to this user and isn't already completed
    const { data: task, error: taskError } = await supabase
      .from(DATABASE_TABLES.TASKS)
      .select('id, title, task_type, is_completed, created_by')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return { success: false, error: 'Task not found' };
    }

    if (task.created_by !== userId) {
      return { success: false, error: 'You can only complete your own tasks' };
    }

    if (task.is_completed && task.task_type === 'one_time') {
      return { success: false, error: `Task "${task.title}" is already completed` };
    }

    // Insert into task_completions — the DB trigger handles status reset and one-time completion
    const { error: completionError } = await supabase
      .from(DATABASE_TABLES.TASK_COMPLETIONS)
      .insert({
        task_id: taskId,
        completed_by: userId,
        completed_at: new Date().toISOString(),
        notes,
        duration_minutes: null,
      });

    if (completionError) {
      return { success: false, error: completionError.message };
    }

    return {
      success: true,
      data: {
        task_id: taskId,
        title: task.title,
        displayMessage: `✅ Marked "${task.title}" as completed`,
      },
    };
  },

  update_task: async (supabase, userId, _actorId, params) => {
    // Update mutable fields of a task/reminder. Ownership is verified via created_by.
    // Accepts natural-language due_date (same parser as set_reminder).
    const taskId = params.task_id as string;

    // Fetch to verify ownership and get current title for display
    const { data: task, error: fetchError } = await supabase
      .from(DATABASE_TABLES.TASKS)
      .select('id, title, created_by')
      .eq('id', taskId)
      .single();

    if (fetchError || !task) {
      return { success: false, error: 'Task not found' };
    }

    if (task.created_by !== userId) {
      return { success: false, error: 'You can only update your own tasks' };
    }

    // Build the update payload — only include fields the caller explicitly provided
    const updates: Record<string, unknown> = {};

    if (params.title !== undefined) {
      updates.title = params.title as string;
    }
    if (params.notes !== undefined) {
      updates.description = params.notes as string;
    }
    if (params.priority !== undefined) {
      const rawPriority = params.priority as string;
      updates.priority = rawPriority === 'medium' ? 'normal' : rawPriority;
    }
    if (params.due_date !== undefined) {
      const parsed = parseReminderDate(params.due_date as string);
      updates.due_date = parsed; // null if unparseable — stored as timeless
    }

    if (Object.keys(updates).length === 0) {
      return { success: false, error: 'No fields to update — provide at least one of: title, notes, due_date, priority' };
    }

    const { data, error } = await supabase
      .from(DATABASE_TABLES.TASKS)
      .update(updates)
      .eq('id', taskId)
      .eq('created_by', userId)
      .select('id, title, due_date, priority')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const updatedTitle = (data as Record<string, unknown>)?.title as string ?? task.title as string;
    const dueDateDisplay = updates.due_date
      ? new Date(updates.due_date as string).toLocaleString('en-CH', { dateStyle: 'medium', timeStyle: 'short' })
      : null;
    const displayMessage = dueDateDisplay
      ? `📅 Updated "${updatedTitle}" — now due ${dueDateDisplay}`
      : `✏️ Updated "${updatedTitle}"`;

    return { success: true, data: { ...data, displayMessage } };
  },

  create_wishlist: async (supabase, _userId, actorId, params) => {
    const { data, error } = await supabase
      .from(ENTITY_REGISTRY.wishlist.tableName)
      .insert({
        actor_id: actorId,
        title: params.title,
        description: (params.description as string | null) || null,
        type: (params.type as string) || 'general',
        visibility: (params.visibility as string) || 'public',
        is_active: true,
        event_date: (params.event_date as string | null) || null,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data };
  },

  create_research: async (supabase, userId, _actorId, params) => {
    // research_entities uses user_id (references profiles), NOT actor_id
    // Many NOT NULL fields require sensible defaults when the Cat caller omits them.
    const fundingGoalBtc =
      (params.funding_goal_btc as number | null) ?? (params.funding_goal as number | null) ?? 0.001;

    const { data, error } = await supabase
      .from(ENTITY_REGISTRY.research.tableName)
      .insert({
        user_id: userId,
        title: params.title,
        description: params.description || null,
        field: (params.field as string) || 'other',
        methodology: (params.methodology as string) || 'experimental',
        expected_outcome: (params.expected_outcome as string) || (params.description as string) || '',
        timeline: (params.timeline as string) || 'medium_term',
        funding_goal_btc: fundingGoalBtc,
        funding_raised_btc: 0,
        funding_model: (params.funding_model as string) || 'donation',
        wallet_address: null,
        lead_researcher: (params.lead_researcher as string) || '',
        team_members: [],
        open_collaboration: true,
        resource_needs: [],
        progress_frequency: (params.progress_frequency as string) || 'monthly',
        transparency_level: (params.transparency_level as string) || 'progress',
        voting_enabled: true,
        impact_areas: [],
        target_audience: [],
        sdg_alignment: [],
        status: 'draft',
        is_public: true,
        is_featured: false,
        completion_percentage: 0,
        days_active: 0,
        funding_velocity: 0,
        follower_count: 0,
        share_count: 0,
        citation_count: 0,
        total_votes: 0,
        total_contributors: 0,
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
    // groups table has: name, slug (UNIQUE NOT NULL), label (not type), created_by
    // label enum: circle|family|dao|company|nonprofit|cooperative|guild|network_state
    const name = params.name as string;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60)
      + '-' + Math.random().toString(36).slice(2, 7);

    // Create the group (organization)
    const { data: group, error: groupError } = await supabase
      .from(ENTITY_REGISTRY.group.tableName)
      .insert({
        name,
        slug,
        description: params.description || null,
        label: (params.label as string | null) ?? (params.type as string | null) ?? 'circle',
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

  // ---------- PAYMENT ACTIONS ----------

  send_payment: async (supabase, userId, _actorId, params) => {
    const amountBtc = params.amount_btc as number;
    const recipient = params.recipient as string;
    const memo = (params.memo as string) || 'Payment via My Cat';

    if (!amountBtc || amountBtc <= 0) {
      return { success: false, error: 'Amount must be positive' };
    }

    // 1. Get sender's NWC wallet (user can only read their own wallets via RLS)
    const { data: senderWallets } = await supabase
      .from(DATABASE_TABLES.WALLETS)
      .select('nwc_connection_uri')
      .eq('profile_id', userId)
      .eq('is_active', true)
      .not('nwc_connection_uri', 'is', null)
      .order('is_primary', { ascending: false })
      .limit(1);

    if (!senderWallets || senderWallets.length === 0 || !senderWallets[0].nwc_connection_uri) {
      return { success: false, error: 'No Lightning wallet (NWC) connected. Add one in Settings → Wallet to enable automatic payments.' };
    }

    let senderNwcUri: string;
    try {
      senderNwcUri = decrypt(senderWallets[0].nwc_connection_uri);
    } catch {
      return { success: false, error: 'Wallet connection is corrupted. Please reconnect your wallet in Settings.' };
    }

    // 2. Resolve recipient's lightning address
    const trimmedRecipient = recipient.trim();
    let lightningAddress: string;

    if (trimmedRecipient.includes('@') && !trimmedRecipient.startsWith('@')) {
      // Direct lightning address: alice@getalby.com
      lightningAddress = trimmedRecipient;
    } else {
      // Username lookup: @alice or alice
      const username = trimmedRecipient.startsWith('@') ? trimmedRecipient.slice(1) : trimmedRecipient;
      const admin = getAdminClient() as unknown as SupabaseClient;

      const { data: profile } = await admin
        .from(DATABASE_TABLES.PROFILES)
        .select('id')
        .eq('username', username)
        .single();

      if (!profile) {
        return { success: false, error: `User @${username} not found` };
      }

      const { data: recipientWallets } = await admin
        .from(DATABASE_TABLES.WALLETS)
        .select('lightning_address')
        .eq('profile_id', profile.id)
        .eq('is_active', true)
        .not('lightning_address', 'is', null)
        .order('is_primary', { ascending: false })
        .limit(1);

      if (!recipientWallets || recipientWallets.length === 0 || !recipientWallets[0].lightning_address) {
        return { success: false, error: `@${username} has no Lightning address configured. Ask them to add one in their settings.` };
      }

      lightningAddress = recipientWallets[0].lightning_address;
    }

    // 3. Generate invoice from recipient's lightning address
    const recipientWallet: ResolvedWallet = {
      method: 'lightning_address',
      wallet_id: 'recipient',
      lightning_address: lightningAddress,
    };

    let invoice;
    try {
      invoice = await generateInvoice(recipientWallet, amountBtc, memo);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: `Could not reach ${lightningAddress}: ${msg}` };
    }

    if (!invoice.bolt11) {
      return { success: false, error: 'Failed to get a Lightning invoice from the recipient' };
    }

    // 4. Pay invoice from sender's NWC wallet
    const sendNwcClient = new NWCClient(senderNwcUri);
    try {
      await sendNwcClient.connect();
      const payResult = await sendNwcClient.payInvoice(invoice.bolt11);
      const displayMemo = memo !== 'Payment via My Cat' ? ` — "${memo}"` : '';
      return {
        success: true,
        data: {
          payment_hash: payResult.payment_hash,
          amount_btc: amountBtc,
          recipient: lightningAddress,
          memo,
          status: 'paid',
          displayMessage: `Sent ${amountBtc} BTC to ${lightningAddress}${displayMemo}`,
        },
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: `Lightning payment failed: ${msg}. Check your wallet has sufficient balance.` };
    } finally {
      sendNwcClient.disconnect();
    }
  },

  fund_project: async (supabase, userId, _actorId, params) => {
    const projectId = params.project_id as string;
    const amountBtc = params.amount_btc as number;
    const message = (params.message as string | undefined) || null;

    if (!amountBtc || amountBtc <= 0) {
      return { success: false, error: 'Amount must be positive' };
    }

    // 1. Get sender's NWC wallet
    const { data: senderWallets } = await supabase
      .from(DATABASE_TABLES.WALLETS)
      .select('nwc_connection_uri')
      .eq('profile_id', userId)
      .eq('is_active', true)
      .not('nwc_connection_uri', 'is', null)
      .order('is_primary', { ascending: false })
      .limit(1);

    if (!senderWallets || senderWallets.length === 0 || !senderWallets[0].nwc_connection_uri) {
      return { success: false, error: 'No Lightning wallet (NWC) connected. Add one in Settings → Wallet to fund projects automatically.' };
    }

    let senderNwcUri: string;
    try {
      senderNwcUri = decrypt(senderWallets[0].nwc_connection_uri);
    } catch {
      return { success: false, error: 'Wallet connection is corrupted. Please reconnect your wallet in Settings.' };
    }

    // 2. Resolve project owner's payment method (uses admin internally for cross-user lookup)
    const projectWallet = await resolveSellerWallet(
      supabase as unknown as SupabaseClient,
      'project',
      projectId
    );

    if (!projectWallet) {
      return { success: false, error: 'This project has no payment method configured. The project creator needs to add a wallet first.' };
    }

    if (projectWallet.method === 'onchain') {
      return { success: false, error: 'This project only accepts on-chain Bitcoin. Use the Fund button on the project page to get the payment address.' };
    }

    // 3. Fetch project title for invoice description
    const admin = getAdminClient() as unknown as SupabaseClient;
    const { data: project } = await admin
      .from(ENTITY_REGISTRY.project.tableName)
      .select('title')
      .eq('id', projectId)
      .single();

    const description = `Project: ${project?.title ?? projectId}`;

    // 4. Generate invoice from project owner's wallet
    let invoice;
    try {
      invoice = await generateInvoice(projectWallet, amountBtc, description);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: `Could not generate invoice for this project: ${msg}` };
    }

    if (!invoice.bolt11) {
      return { success: false, error: 'Failed to generate a Lightning invoice for this project' };
    }

    // 5. Pay invoice from sender's NWC wallet
    const fundNwcClient = new NWCClient(senderNwcUri);
    try {
      await fundNwcClient.connect();
      const payResult = await fundNwcClient.payInvoice(invoice.bolt11);

      // 6. Resolve seller user_id for DB record
      const sellerId = await getSellerUserId(
        supabase as unknown as SupabaseClient,
        'project',
        projectId
      );

      // 7. Record payment intent as paid
      const { data: pi } = await supabase
        .from(DATABASE_TABLES.PAYMENT_INTENTS)
        .insert({
          buyer_id: userId,
          seller_id: sellerId ?? userId,
          entity_type: 'project',
          entity_id: projectId,
          amount_btc: amountBtc,
          payment_method: projectWallet.method,
          bolt11: invoice.bolt11,
          payment_hash: payResult.payment_hash ?? null,
          onchain_address: null,
          status: 'paid',
          description,
          paid_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      // 8. Record contribution (fire-and-forget; payment is already confirmed)
      if (pi) {
        await supabase
          .from(DATABASE_TABLES.CONTRIBUTIONS)
          .insert({
            payment_intent_id: pi.id,
            contributor_id: userId,
            entity_type: 'project',
            entity_id: projectId,
            amount_btc: amountBtc,
            message: message ?? null,
            is_anonymous: false,
          });
      }

      const projectTitle = project?.title ?? 'the project';
      return {
        success: true,
        data: {
          payment_hash: payResult.payment_hash,
          amount_btc: amountBtc,
          project_id: projectId,
          project_title: projectTitle,
          message,
          status: 'paid',
          displayMessage: `Funded "${projectTitle}" with ${amountBtc} BTC via Lightning!${message ? ` Message: "${message}"` : ''}`,
        },
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: `Lightning payment failed: ${msg}. Check your wallet has sufficient balance.` };
    } finally {
      fundNwcClient.disconnect();
    }
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
        amount_btc: this.extractBtcAmount(action, parameters),
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
        if (parameters.title) parts.push(`rename to "${parameters.title}"`);
        if (parameters.due_date) parts.push(`reschedule to ${parameters.due_date}`);
        if (parameters.priority) parts.push(`priority → ${parameters.priority}`);
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
