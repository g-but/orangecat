/**
 * AI Assistants API - List and Create
 *
 * GET  /api/ai-assistants - List public or user's AI assistants
 * POST /api/ai-assistants - Create a new AI assistant
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { aiAssistantSchema } from '@/lib/validation';
import {
  apiSuccess,
  apiUnauthorized,
  apiRateLimited,
  handleApiError,
} from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import { compose } from '@/lib/api/compose';
import { withZodBody } from '@/lib/api/withZod';
import { withRateLimit } from '@/lib/api/withRateLimit';
import { withRequestId } from '@/lib/api/withRequestId';
import { getPagination, getString } from '@/lib/api/query';
import { rateLimitWrite } from '@/lib/rate-limit';
import { getCacheControl, calculatePage } from '@/lib/api/helpers';
import { getTableName } from '@/config/entity-registry';

// GET /api/ai-assistants - List AI assistants
export const GET = compose(
  withRequestId(),
  withRateLimit('read')
)(async (request: NextRequest) => {
  try {
    const supabase = await createServerClient();
    const { limit, offset } = getPagination(request.url, { defaultLimit: 20, maxLimit: 100 });
    const category = getString(request.url, 'category');
    const userId = getString(request.url, 'user_id');
    const searchQuery = getString(request.url, 'q');
    const sortBy = getString(request.url, 'sort') || 'popular';

    // Check auth for showing drafts
    const { data: { user } } = await supabase.auth.getUser();
    const includeOwnDrafts = Boolean(userId && user && userId === user.id);

    // Build query with user info for discovery page
    const tableName = getTableName('ai_assistant');
    let itemsQuery = supabase
      .from(tableName)
      .select(`
        *,
        user:profiles!ai_assistants_user_id_fkey(
          id,
          username,
          name,
          avatar_url
        )
      `)
      .range(offset, offset + limit - 1);

    let countQuery = supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (userId && includeOwnDrafts) {
      // Show all user's assistants including drafts
      itemsQuery = itemsQuery.eq('user_id', userId);
      countQuery = countQuery.eq('user_id', userId);
    } else {
      // Public listing: only active, public assistants
      itemsQuery = itemsQuery.eq('status', 'active').eq('is_public', true);
      countQuery = countQuery.eq('status', 'active').eq('is_public', true);
      if (userId) {
        itemsQuery = itemsQuery.eq('user_id', userId);
        countQuery = countQuery.eq('user_id', userId);
      }
      if (category) {
        itemsQuery = itemsQuery.eq('category', category);
        countQuery = countQuery.eq('category', category);
      }
    }

    // Apply search filter
    if (searchQuery) {
      const searchFilter = `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`;
      itemsQuery = itemsQuery.or(searchFilter);
      countQuery = countQuery.or(searchFilter);
    }

    // Apply sorting
    switch (sortBy) {
      case 'rating':
        itemsQuery = itemsQuery.order('average_rating', { ascending: false, nullsFirst: false });
        break;
      case 'recent':
        itemsQuery = itemsQuery.order('created_at', { ascending: false });
        break;
      case 'price_low':
        itemsQuery = itemsQuery.order('price_per_message', { ascending: true, nullsFirst: false });
        break;
      case 'price_high':
        itemsQuery = itemsQuery.order('price_per_message', { ascending: false, nullsFirst: false });
        break;
      case 'popular':
      default:
        itemsQuery = itemsQuery.order('total_conversations', { ascending: false, nullsFirst: false });
        break;
    }

    const [{ data: items, error: itemsError }, { count, error: countError }] = await Promise.all([
      itemsQuery,
      countQuery,
    ]);

    if (itemsError) {throw itemsError;}
    if (countError) {throw countError;}

    // Cache control based on query type
    const cacheControl = getCacheControl(Boolean(userId));

    return apiSuccess(items || [], {
      page: calculatePage(offset, limit),
      limit,
      total: count || 0,
      headers: { 'Cache-Control': cacheControl },
    });
  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/ai-assistants - Create new AI assistant
export const POST = compose(
  withRequestId(),
  withZodBody(aiAssistantSchema)
)(async (request: NextRequest, ctx) => {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
    }

    // Rate limit check
    const rl = rateLimitWrite(user.id);
    if (!rl.success) {
      const retryAfter = Math.ceil((rl.resetTime - Date.now()) / 1000);
      logger.warn('AI Assistant creation rate limit exceeded', { userId: user.id });
      return apiRateLimited('Too many creation requests. Please slow down.', retryAfter);
    }

    const validatedData = ctx.body;

    // Create the AI assistant
    const tableName = getTableName('ai_assistant');
    const { data: assistant, error } = await supabase
      .from(tableName)
      .insert({
        user_id: user.id,
        title: validatedData.title,
        description: validatedData.description,
        category: validatedData.category,
        tags: validatedData.tags || [],
        avatar_url: validatedData.avatar_url,
        system_prompt: validatedData.system_prompt,
        welcome_message: validatedData.welcome_message,
        personality_traits: validatedData.personality_traits || [],
        knowledge_base_urls: validatedData.knowledge_base_urls || [],
        model_preference: validatedData.model_preference || 'any',
        max_tokens_per_response: validatedData.max_tokens_per_response || 1000,
        temperature: validatedData.temperature || 0.7,
        compute_provider_type: validatedData.compute_provider_type || 'api',
        compute_provider_id: validatedData.compute_provider_id,
        api_provider: validatedData.api_provider,
        pricing_model: validatedData.pricing_model || 'per_message',
        price_per_message: validatedData.price_per_message || 0,
        price_per_1k_tokens: validatedData.price_per_1k_tokens || 0,
        subscription_price: validatedData.subscription_price || 0,
        free_messages_per_day: validatedData.free_messages_per_day || 0,
        status: 'draft', // Always start as draft
        is_public: false, // Start as private
        is_featured: false,
        lightning_address: validatedData.lightning_address,
        bitcoin_address: validatedData.bitcoin_address,
      })
      .select()
      .single();

    if (error) {
      logger.error('AI Assistant creation failed', { userId: user.id, error: error.message });
      throw error;
    }

    logger.info('AI Assistant created successfully', { assistantId: assistant.id, userId: user.id });
    return apiSuccess(assistant, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});

