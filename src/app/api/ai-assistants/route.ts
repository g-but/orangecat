/**
 * AI Assistants API - List and Create
 *
 * GET  /api/ai-assistants - List public or user's AI assistants
 * POST /api/ai-assistants - Create a new AI assistant
 */

import { NextRequest } from 'next/server';
import { aiAssistantSchema } from '@/lib/validation';
import { apiSuccess, apiBadRequest, handleApiError, apiRateLimited } from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import { withAuth, withOptionalAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { STATUS } from '@/config/database-constants';
import { getPagination, getString } from '@/lib/api/query';
import {  applyRateLimitHeaders, rateLimitWriteAsync , retryAfterSeconds } from '@/lib/rate-limit';
import { getCacheControl, calculatePage } from '@/lib/api/helpers';
import { getTableName } from '@/config/entity-registry';
import { getOrCreateUserActor } from '@/services/actors/getOrCreateUserActor';

function applySortOrder(query: any, sortBy: string) {
  switch (sortBy) {
    case 'rating': return query.order('average_rating', { ascending: false, nullsFirst: false });
    case 'recent': return query.order('created_at', { ascending: false });
    case 'price_low': return query.order('price_per_message', { ascending: true, nullsFirst: false });
    case 'price_high': return query.order('price_per_message', { ascending: false, nullsFirst: false });
    default: return query.order('total_conversations', { ascending: false, nullsFirst: false });
  }
}

export const GET = withOptionalAuth(async (request) => {
  try {
    const { user, supabase } = request;
    const { limit, offset } = getPagination(request.url, { defaultLimit: 20, maxLimit: 100 });
    const category = getString(request.url, 'category');
    const userId = getString(request.url, 'user_id');
    const searchQuery = getString(request.url, 'q');
    const sortBy = getString(request.url, 'sort') || 'popular';

    const includeOwnDrafts = Boolean(userId && user && userId === user.id);
    const tableName = getTableName('ai_assistant');

    let itemsQuery = supabase.from(tableName)
      .select('*, user:profiles!ai_assistants_user_id_fkey(id, username, name, avatar_url)')
      .range(offset, offset + limit - 1);
    let countQuery = supabase.from(tableName).select('*', { count: 'exact', head: true });

    let actorId: string | null = null;
    if (userId) {actorId = (await getOrCreateUserActor(userId)).id;}

    if (userId && includeOwnDrafts && actorId) {
      itemsQuery = itemsQuery.eq('actor_id', actorId);
      countQuery = countQuery.eq('actor_id', actorId);
    } else {
      itemsQuery = itemsQuery.eq('status', STATUS.AI_ASSISTANTS.ACTIVE).eq('is_public', true);
      countQuery = countQuery.eq('status', STATUS.AI_ASSISTANTS.ACTIVE).eq('is_public', true);
      if (actorId) { itemsQuery = itemsQuery.eq('actor_id', actorId); countQuery = countQuery.eq('actor_id', actorId); }
      if (category) { itemsQuery = itemsQuery.eq('category', category); countQuery = countQuery.eq('category', category); }
    }

    if (searchQuery) {
      const escaped = searchQuery.replace(/[%_]/g, '\\$&');
      const filter = `title.ilike.%${escaped}%,description.ilike.%${escaped}%`;
      itemsQuery = itemsQuery.or(filter);
      countQuery = countQuery.or(filter);
    }

    itemsQuery = applySortOrder(itemsQuery, sortBy);

    const [{ data: items, error: itemsError }, { count, error: countError }] = await Promise.all([itemsQuery, countQuery]);
    if (itemsError) {throw itemsError;}
    if (countError) {throw countError;}

    return apiSuccess(items || [], {
      page: calculatePage(offset, limit),
      limit,
      total: count || 0,
      headers: { 'Cache-Control': getCacheControl(Boolean(userId)) },
    });
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  const { user, supabase } = request;
  try {
    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) { return apiRateLimited('Too many creation requests. Please slow down.', retryAfterSeconds(rl)); }

    const body = await (request as NextRequest).json();
    const parsed = aiAssistantSchema.safeParse(body);
    if (!parsed.success) {return apiBadRequest(parsed.error.errors[0]?.message || 'Invalid request data');}
    const d = parsed.data;

    const actor = await getOrCreateUserActor(user.id);

    const { data: assistant, error } = await supabase.from(getTableName('ai_assistant'))
      .insert({
        user_id: user.id, actor_id: actor.id,
        title: d.title, description: d.description, category: d.category,
        tags: d.tags || [], avatar_url: d.avatar_url, system_prompt: d.system_prompt,
        welcome_message: d.welcome_message, personality_traits: d.personality_traits || [],
        knowledge_base_urls: d.knowledge_base_urls || [],
        model_preference: d.model_preference || 'any',
        max_tokens_per_response: d.max_tokens_per_response || 1000,
        temperature: d.temperature || 0.7,
        compute_provider_type: d.compute_provider_type || 'api',
        compute_provider_id: d.compute_provider_id, api_provider: d.api_provider,
        pricing_model: d.pricing_model || 'per_message',
        price_per_message: d.price_per_message || 0,
        price_per_1k_tokens: d.price_per_1k_tokens || 0,
        subscription_price: d.subscription_price || 0,
        free_messages_per_day: d.free_messages_per_day || 0,
        status: 'draft', is_public: false, is_featured: false,
        lightning_address: d.lightning_address, bitcoin_address: d.bitcoin_address,
      })
      .select().single();

    if (error) {
      logger.error('AI Assistant creation failed', { userId: user.id, error: error.message });
      throw error;
    }

    logger.info('AI Assistant created successfully', { assistantId: assistant.id, userId: user.id });
    return applyRateLimitHeaders(apiSuccess(assistant, { status: 201 }), rl);
  } catch (error) {
    return handleApiError(error);
  }
});
