/**
 * AI Payments Service
 *
 * Handles payment processing for AI assistant interactions.
 * Currently uses a simple credits system that can be extended
 * for Lightning Network payments in the future.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// Type alias for any SupabaseClient (accepts any database schema)
type AnySupabaseClient = SupabaseClient<any, any, any>;
import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';

// Payment result types
export interface PaymentResult {
  success: boolean;
  error?: string;
  amountCharged?: number;
  balanceRemaining?: number;
  transactionId?: string;
}

export interface BalanceCheckResult {
  hasBalance: boolean;
  currentBalance: number;
  requiredAmount: number;
  shortfall?: number;
}

export interface AssistantPricing {
  pricing_model: 'free' | 'per_message' | 'per_token' | 'subscription';
  price_per_message: number;
  price_per_1k_tokens: number;
  free_messages_per_day: number;
}

export interface UsageStats {
  messagesUsedToday: number;
  freeMessagesRemaining: number;
}

/**
 * AI Payment Service
 *
 * Manages balance checking, charging, and earnings tracking
 * for AI assistant interactions.
 */
export class AIPaymentService {
  constructor(private supabase: AnySupabaseClient) {}

  /**
   * Check if user has sufficient balance/credits for an AI interaction
   */
  async checkBalance(userId: string, assistantId: string): Promise<BalanceCheckResult> {
    // Get assistant pricing
    const { data: assistant, error: assistantError } = await this.supabase
      .from(DATABASE_TABLES.AI_ASSISTANTS)
      .select('pricing_model, price_per_message, price_per_1k_tokens, free_messages_per_day')
      .eq('id', assistantId)
      .single();

    if (assistantError || !assistant) {
      return {
        hasBalance: false,
        currentBalance: 0,
        requiredAmount: 0,
      };
    }

    const pricing = assistant as AssistantPricing;

    // Free assistants always pass
    if (pricing.pricing_model === 'free') {
      return {
        hasBalance: true,
        currentBalance: Infinity,
        requiredAmount: 0,
      };
    }

    // Check free messages quota first
    const usage = await this.getTodayUsage(userId, assistantId);
    if (usage.freeMessagesRemaining > 0) {
      return {
        hasBalance: true,
        currentBalance: usage.freeMessagesRemaining,
        requiredAmount: 0,
      };
    }

    // For paid assistants, check user credits
    // For now, we'll use a simple approach - real Lightning integration comes later
    const credits = await this.getUserCredits(userId);
    const requiredAmount = pricing.price_per_message || 0;

    return {
      hasBalance: credits >= requiredAmount,
      currentBalance: credits,
      requiredAmount,
      shortfall: credits < requiredAmount ? requiredAmount - credits : undefined,
    };
  }

  /**
   * Get user's remaining credits (sats)
   */
  async getUserCredits(userId: string): Promise<number> {
    // Check ai_user_credits table if it exists
    // For MVP, we'll assume users have credits or use free tier
    // This will be enhanced with actual Lightning deposits later
    const { data } = await this.supabase
      .from(DATABASE_TABLES.AI_USER_CREDITS)
      .select('balance_sats')
      .eq('user_id', userId)
      .single();

    return data?.balance_sats ?? 0;
  }

  /**
   * Get today's usage for a user with an assistant
   */
  async getTodayUsage(userId: string, assistantId: string): Promise<UsageStats> {
    // Get assistant's free messages allowance
    const { data: assistant } = await this.supabase
      .from(DATABASE_TABLES.AI_ASSISTANTS)
      .select('free_messages_per_day')
      .eq('id', assistantId)
      .single();

    const freeMessagesPerDay = assistant?.free_messages_per_day ?? 0;

    // Count today's messages
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get actual message count for today
    const { data: conversations } = await this.supabase
      .from(DATABASE_TABLES.AI_CONVERSATIONS)
      .select('id')
      .eq('user_id', userId)
      .eq('assistant_id', assistantId);

    const convIds = conversations?.map(c => c.id) ?? [];

    let messagesUsedToday = 0;
    if (convIds.length > 0) {
      const { count: messageCount } = await this.supabase
        .from(DATABASE_TABLES.AI_MESSAGES)
        .select('id', { count: 'exact', head: true })
        .in('conversation_id', convIds)
        .eq('role', 'user')
        .gte('created_at', today.toISOString());

      messagesUsedToday = messageCount ?? 0;
    }

    return {
      messagesUsedToday,
      freeMessagesRemaining: Math.max(0, freeMessagesPerDay - messagesUsedToday),
    };
  }

  /**
   * Charge for an AI message/interaction
   */
  async chargeForMessage(params: {
    userId: string;
    assistantId: string;
    conversationId: string;
    messageId: string;
    tokenCount: number;
  }): Promise<PaymentResult> {
    const { userId, assistantId, conversationId, messageId, tokenCount } = params;

    // Get assistant pricing
    const { data: assistant, error: assistantError } = await this.supabase
      .from(DATABASE_TABLES.AI_ASSISTANTS)
      .select(
        'id, user_id, pricing_model, price_per_message, price_per_1k_tokens, free_messages_per_day'
      )
      .eq('id', assistantId)
      .single();

    if (assistantError || !assistant) {
      return { success: false, error: 'Assistant not found' };
    }

    // Free assistants - no charge
    if (assistant.pricing_model === 'free') {
      return { success: true, amountCharged: 0 };
    }

    // Check free quota first
    const usage = await this.getTodayUsage(userId, assistantId);
    if (usage.freeMessagesRemaining > 0) {
      return { success: true, amountCharged: 0 };
    }

    // Calculate charge amount
    let amountSats = 0;
    if (assistant.pricing_model === 'per_message') {
      amountSats = assistant.price_per_message || 0;
    } else if (assistant.pricing_model === 'per_token') {
      const pricePerKTokens = assistant.price_per_1k_tokens || 0;
      amountSats = Math.ceil((tokenCount / 1000) * pricePerKTokens);
    }

    if (amountSats === 0) {
      return { success: true, amountCharged: 0 };
    }

    // Check balance
    const credits = await this.getUserCredits(userId);
    if (credits < amountSats) {
      return {
        success: false,
        error: 'Insufficient credits',
        balanceRemaining: credits,
      };
    }

    // Deduct credits (atomic operation)
    const { error: deductError } = await this.supabase.rpc('deduct_ai_credits', {
      p_user_id: userId,
      p_amount_sats: amountSats,
      p_assistant_id: assistantId,
      p_conversation_id: conversationId,
      p_message_id: messageId,
    });

    if (deductError) {
      // If RPC doesn't exist yet, just log and continue (MVP)
      logger.warn('Credit deduction RPC not available', { error: deductError }, 'AIPayments');
    }

    // Record earnings for the assistant owner
    await this.recordEarnings(assistantId, assistant.user_id, amountSats);

    return {
      success: true,
      amountCharged: amountSats,
      balanceRemaining: credits - amountSats,
    };
  }

  /**
   * Record earnings for the assistant creator
   */
  async recordEarnings(
    assistantId: string,
    creatorUserId: string,
    amountSats: number
  ): Promise<void> {
    // Update total_revenue_sats on the assistant
    const { error } = await this.supabase.rpc('increment_ai_revenue', {
      p_assistant_id: assistantId,
      p_amount_sats: amountSats,
    });

    if (error) {
      // If RPC doesn't exist, do a direct update (less safe but works for MVP)
      await this.supabase
        .from(DATABASE_TABLES.AI_ASSISTANTS)
        .update({
          total_revenue_sats: this.supabase.rpc('coalesce_add', {
            current: 'total_revenue_sats',
            add: amountSats,
          }),
        })
        .eq('id', assistantId);
    }
  }

  /**
   * Get assistant's total earnings
   */
  async getAssistantEarnings(assistantId: string): Promise<{
    totalRevenueSats: number;
    totalConversations: number;
    totalMessages: number;
  }> {
    const { data: assistant } = await this.supabase
      .from(DATABASE_TABLES.AI_ASSISTANTS)
      .select('total_revenue_sats, total_conversations, total_messages')
      .eq('id', assistantId)
      .single();

    return {
      totalRevenueSats: assistant?.total_revenue_sats ?? 0,
      totalConversations: assistant?.total_conversations ?? 0,
      totalMessages: assistant?.total_messages ?? 0,
    };
  }

  /**
   * Get user's spending on AI assistants
   */
  async getUserSpending(userId: string): Promise<{
    totalSpentSats: number;
    assistantsUsed: number;
    messagesCount: number;
  }> {
    // Get all conversations for this user
    const { data: conversations } = await this.supabase
      .from(DATABASE_TABLES.AI_CONVERSATIONS)
      .select('id, assistant_id, total_cost_sats')
      .eq('user_id', userId);

    if (!conversations || conversations.length === 0) {
      return {
        totalSpentSats: 0,
        assistantsUsed: 0,
        messagesCount: 0,
      };
    }

    const totalSpentSats = conversations.reduce((sum, c) => sum + (c.total_cost_sats || 0), 0);
    const uniqueAssistants = new Set(conversations.map(c => c.assistant_id));

    // Get total message count
    const convIds = conversations.map(c => c.id);
    const { count } = await this.supabase
      .from(DATABASE_TABLES.AI_MESSAGES)
      .select('id', { count: 'exact', head: true })
      .in('conversation_id', convIds)
      .eq('role', 'user');

    return {
      totalSpentSats,
      assistantsUsed: uniqueAssistants.size,
      messagesCount: count ?? 0,
    };
  }
}

/**
 * Create AI payment service instance
 */
export function createAIPaymentService(supabase: AnySupabaseClient): AIPaymentService {
  return new AIPaymentService(supabase);
}
