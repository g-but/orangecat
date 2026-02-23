/**
 * AI Credits Revenue API
 *
 * GET /api/ai-credits/revenue - Get creator's revenue from their AI assistants
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { apiSuccess, apiUnauthorized, handleApiError } from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import { compose } from '@/lib/api/compose';
import { withRateLimit } from '@/lib/api/withRateLimit';
import { withRequestId } from '@/lib/api/withRequestId';
import { DATABASE_TABLES } from '@/config/database-tables';

interface AssistantRevenue {
  id: string;
  name: string;
  avatar_url: string | null;
  total_revenue_sats: number;
  total_conversations: number;
  total_messages: number;
  pricing_model: string;
  price_per_message: number;
}

/**
 * GET /api/ai-credits/revenue
 * Returns creator's total revenue and per-assistant breakdown
 */
export const GET = compose(
  withRequestId(),
  withRateLimit('read')
)(async (_request: NextRequest) => {
  try {
    const supabase = await createServerClient();
    const db = supabase as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiUnauthorized();
    }

    // Get all assistants owned by this user with revenue stats
    const { data: assistants, error: assistantsError } = await db
      .from(DATABASE_TABLES.AI_ASSISTANTS)
      .select(
        `
        id,
        name,
        avatar_url,
        total_revenue_sats,
        total_conversations,
        total_messages,
        pricing_model,
        price_per_message
      `
      )
      .eq('user_id', user.id)
      .order('total_revenue_sats', { ascending: false });

    if (assistantsError) {
      throw assistantsError;
    }

    // Calculate totals from assistants
    const assistantRows = (assistants || []) as any[];

    const totalRevenueSats = assistantRows.reduce(
      (sum: number, a: any) => sum + (a.total_revenue_sats || 0),
      0
    );

    const totalConversations = assistantRows.reduce(
      (sum: number, a: any) => sum + (a.total_conversations || 0),
      0
    );

    const totalMessages = assistantRows.reduce(
      (sum: number, a: any) => sum + (a.total_messages || 0),
      0
    );

    // Get creator earnings with withdrawal tracking
    const { data: earnings } = await db
      .from(DATABASE_TABLES.AI_CREATOR_EARNINGS)
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Calculate available balance (from earnings table if exists, otherwise total revenue)
    const availableBalanceSats = earnings?.available_balance_sats ?? totalRevenueSats;

    return apiSuccess({
      summary: {
        total_revenue_sats: totalRevenueSats,
        available_balance_sats: availableBalanceSats,
        total_conversations: totalConversations,
        total_messages: totalMessages,
        total_assistants: assistants?.length || 0,
      },
      assistants: assistantRows.map(
        (a: any): AssistantRevenue => ({
          id: a.id,
          name: a.name,
          avatar_url: a.avatar_url,
          total_revenue_sats: a.total_revenue_sats || 0,
          total_conversations: a.total_conversations || 0,
          total_messages: a.total_messages || 0,
          pricing_model: a.pricing_model || 'free',
          price_per_message: a.price_per_message || 0,
        })
      ),
    });
  } catch (error) {
    logger.error('Failed to get revenue', { error });
    return handleApiError(error);
  }
});
