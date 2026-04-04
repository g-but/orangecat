/**
 * AI Conversation Messages API
 *
 * POST /api/ai-assistants/[id]/conversations/[convId]/messages - Send a message
 *
 * This endpoint:
 * 1. Checks user's BYOK status or platform limits
 * 2. Stores the user's message
 * 3. Generates AI response via OpenRouter
 * 4. Charges user for the interaction (if applicable)
 * 5. Records earnings for assistant creator
 * 6. Returns both messages
 *
 * BYOK Flow:
 * - User has API key: Use their key, any model allowed
 * - No API key: Use platform key, free models only, daily limit
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiUnauthorized,
  apiBadRequest,
  apiNotFound,
  apiInternalError,
  apiServiceUnavailable,
  apiRateLimited,
  apiError,
} from '@/lib/api/standardResponse';
import { DATABASE_TABLES } from '@/config/database-tables';
import { STATUS } from '@/config/database-constants';
import { createAIPaymentService } from '@/services/ai-payments';
import { logger } from '@/utils/logger';
import {
  createOpenRouterService,
  createOpenRouterServiceWithByok,
  createGroqService,
  isGroqAvailable,
  DEFAULT_GROQ_MODEL,
  createApiKeyService,
  type OpenRouterMessage,
  type GroqMessage,
} from '@/services/ai';
import {
  DEFAULT_FREE_MODEL_ID,
  isModelFree,
  getModelMetadata,
  getFreeModels,
} from '@/config/ai-models';
import { createAutoRouter } from '@/services/ai/auto-router';
import { applyRateLimitHeaders, type RateLimitResult } from '@/lib/rate-limit';
import { enforceUserWriteLimit, RateLimitError } from '@/lib/api/rateLimiting';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string; convId: string }>;
}

const sendMessageSchema = z.object({
  content: z.string().min(1).max(10000),
  model: z.string().optional(), // Optional model selection
});

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: assistantId, convId } = await params;
    const supabase = await createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return apiUnauthorized();
    }

    // Rate limit AI message requests (30 per minute per user)
    let rateLimitResult: RateLimitResult;
    try {
      rateLimitResult = await enforceUserWriteLimit(user.id);
    } catch (e) {
      if (e instanceof RateLimitError) {
        const retryAfter = e.details?.retryAfter || 60;
        const rateLimitResponse = apiRateLimited('Rate limit exceeded', retryAfter);
        const limit = e.details?.limit || 30;
        const resetTime = Date.now() + retryAfter * 1000;
        rateLimitResponse.headers.set('X-RateLimit-Limit', String(limit));
        rateLimitResponse.headers.set('X-RateLimit-Remaining', '0');
        rateLimitResponse.headers.set('X-RateLimit-Reset', String(resetTime));
        return rateLimitResponse;
      }
      throw e;
    }

    const body = await request.json();
    const result = sendMessageSchema.safeParse(body);

    if (!result.success) {
      return apiBadRequest('Validation failed', result.error.flatten());
    }

    const { content, model: requestedModel } = result.data;

    // Verify conversation exists and belongs to user
    const { data: conversationData, error: convError } = await (
      supabase.from(DATABASE_TABLES.AI_CONVERSATIONS) as any
    )
      .select('id, assistant_id, user_id, status')
      .eq('id', convId)
      .eq('assistant_id', assistantId)
      .eq('user_id', user.id)
      .single();
    const conversation = conversationData as any;

    if (convError || !conversation) {
      return apiNotFound('Conversation not found');
    }

    if (conversation.status !== STATUS.AI_ASSISTANTS.ACTIVE) {
      return apiBadRequest('Conversation is archived');
    }

    // Get assistant details including all configuration
    const { data: assistantData, error: assistantError } = await (
      supabase.from(DATABASE_TABLES.AI_ASSISTANTS) as any
    )
      .select(
        'id, title, system_prompt, welcome_message, pricing_model, price_per_message, price_per_1k_tokens, user_id, model_preference, allowed_models, min_model_tier, temperature, max_tokens_per_response, free_messages_per_day'
      )
      .eq('id', assistantId)
      .single();
    const assistant = assistantData as any;

    if (assistantError || !assistant) {
      return apiNotFound('Assistant not found');
    }

    // Check BYOK status — try OpenRouter first, then Groq
    const keyService = createApiKeyService(supabase);
    const userOpenRouterKey = await keyService.getDecryptedKey(user.id, 'openrouter');
    const hasByok = !!userOpenRouterKey;

    // Determine provider: OpenRouter BYOK → Platform OpenRouter → Platform Groq → error
    type AIProvider = 'openrouter' | 'groq';
    let provider: AIProvider;

    if (userOpenRouterKey) {
      provider = 'openrouter';
    } else if (process.env.OPENROUTER_API_KEY) {
      provider = 'openrouter';
    } else if (isGroqAvailable()) {
      provider = 'groq';
    } else {
      return apiServiceUnavailable('AI service not configured');
    }

    // For non-BYOK users, check platform limits
    if (!hasByok) {
      const platformUsage = await keyService.checkPlatformUsage(user.id);
      if (!platformUsage.can_use_platform) {
        return apiRateLimited(
          'Daily limit reached. Add your own OpenRouter API key for unlimited usage.'
        );
      }
    }

    // Get conversation history for context (used by auto-router and AI call)
    const { data: historyData } = await (supabase.from(DATABASE_TABLES.AI_MESSAGES) as any)
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(20);
    const history = historyData as any[] | null;

    // Determine which model to use
    let modelToUse: string;

    if (provider === 'groq') {
      // Groq: use default Groq model (ignores OpenRouter model selection)
      modelToUse = DEFAULT_GROQ_MODEL;
    } else {
      // OpenRouter: centralized auto-router logic
      modelToUse = requestedModel || assistant.model_preference || 'auto';

      if (!hasByok) {
        if (modelToUse === 'auto' || modelToUse === 'any' || !isModelFree(modelToUse)) {
          const freeModelIds = getFreeModels().map(m => m.id);
          const autoRouter = createAutoRouter();
          const routingResult = autoRouter.selectModel({
            message: content,
            conversationHistory: (history || []).map(m => ({ role: m.role, content: m.content })),
            allowedModels: freeModelIds,
          });
          modelToUse = routingResult.model;
        }
      } else if (modelToUse === 'auto' || modelToUse === 'any') {
        const autoRouter = createAutoRouter();
        const allowedModels = assistant.allowed_models?.length
          ? assistant.allowed_models
          : undefined;
        const routingResult = autoRouter.selectModel({
          message: content,
          conversationHistory: (history || []).map(m => ({ role: m.role, content: m.content })),
          allowedModels,
        });
        modelToUse = routingResult.model;
      }

      // Validate model exists (safety fallback)
      const modelMeta = getModelMetadata(modelToUse);
      if (!modelMeta) {
        modelToUse = DEFAULT_FREE_MODEL_ID;
      }
    }

    // Initialize payment service for creator payments
    const paymentService = createAIPaymentService(supabase);

    // Check per-assistant free message limits (for paid assistants with free tier)
    const freeMessagesPerDay = assistant.free_messages_per_day || 0;
    const baseCreatorCharge =
      assistant.pricing_model === 'per_message' ? assistant.price_per_message || 0 : 0;

    // Determine if user still has free messages for this assistant today
    let usesFreeMessage = false;
    let freeMessagesRemaining = 0;

    if (freeMessagesPerDay > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all user's conversations with this assistant
      const { data: userConvosData } = await (
        supabase.from(DATABASE_TABLES.AI_CONVERSATIONS) as any
      )
        .select('id')
        .eq('assistant_id', assistantId)
        .eq('user_id', user.id);
      const userConvos = userConvosData as any[] | null;

      const convoIds = userConvos?.map((c: any) => c.id) || [];

      if (convoIds.length > 0) {
        // Count user messages to this assistant today (across all conversations)
        const { count: todayMessageCount } = await (
          supabase.from(DATABASE_TABLES.AI_MESSAGES) as any
        )
          .select('id', { count: 'exact', head: true })
          .in('conversation_id', convoIds)
          .eq('role', 'user')
          .gte('created_at', today.toISOString());

        const messagesUsedToday = todayMessageCount || 0;
        freeMessagesRemaining = Math.max(0, freeMessagesPerDay - messagesUsedToday);
        usesFreeMessage = freeMessagesRemaining > 0;
      } else {
        // No previous conversations, all free messages available
        freeMessagesRemaining = freeMessagesPerDay;
        usesFreeMessage = true;
      }
    }

    // If user has free messages, don't charge creator fee
    const creatorCharge = usesFreeMessage ? 0 : baseCreatorCharge;

    if (creatorCharge > 0) {
      const balanceCheck = await paymentService.checkBalance(user.id, assistantId);
      if (!balanceCheck.hasBalance) {
        return apiError('Insufficient credits', 'INSUFFICIENT_CREDITS', 402, {
          currentBalance: balanceCheck.currentBalance,
          requiredAmount: balanceCheck.requiredAmount,
          shortfall: balanceCheck.shortfall,
        });
      }
    }

    // Store user message first
    const { data: userMessageData, error: userMsgError } = await (
      supabase.from(DATABASE_TABLES.AI_MESSAGES) as any
    )
      .insert({
        conversation_id: convId,
        role: 'user',
        content,
        tokens_used: Math.ceil(content.length / 4),
        cost_btc: 0,
      })
      .select()
      .single();
    const userMessage = userMessageData as any;

    if (userMsgError) {
      logger.error('Error storing user message', userMsgError, 'AIMessagesAPI');
      return apiInternalError('Failed to store message');
    }

    // Build messages array
    const messages: (OpenRouterMessage | GroqMessage)[] = [
      ...(history || []).map(m => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
      { role: 'user' as const, content },
    ];

    // Generate AI response using creator's settings
    let aiResponse: {
      content: string;
      model: string;
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
      isFreeModel: boolean;
      costBtc: number;
    };

    try {
      if (provider === 'groq') {
        const groq = createGroqService();
        const result = await groq.chatCompletion({
          model: modelToUse,
          messages: messages as GroqMessage[],
          systemPrompt: assistant.system_prompt || undefined,
          temperature: assistant.temperature ?? 0.7,
          maxTokens: assistant.max_tokens_per_response || undefined,
        });
        aiResponse = {
          content: result.content,
          model: result.model,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          totalTokens: result.totalTokens,
          isFreeModel: result.isFreeModel,
          costBtc: 0,
        };
      } else {
        const openRouter = hasByok
          ? createOpenRouterServiceWithByok(userOpenRouterKey!)
          : createOpenRouterService();
        const result = await openRouter.chatCompletion({
          model: modelToUse,
          messages: messages as OpenRouterMessage[],
          systemPrompt: assistant.system_prompt || undefined,
          temperature: assistant.temperature ?? 0.7,
          maxTokens: assistant.max_tokens_per_response || undefined,
        });
        aiResponse = {
          content: result.content,
          model: result.model,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          totalTokens: result.totalTokens,
          isFreeModel: result.isFreeModel,
          costBtc: result.costBtc,
        };
      }
    } catch (aiError: unknown) {
      logger.error('AI API error', aiError, 'AIMessagesAPI');

      // Clean up user message on AI failure
      await (supabase.from(DATABASE_TABLES.AI_MESSAGES) as any).delete().eq('id', userMessage.id);

      const errorMessage = aiError instanceof Error ? aiError.message : 'AI service error';
      return apiError('Failed to generate AI response', 'AI_ERROR', 502, { message: errorMessage });
    }

    // Calculate costs
    const apiCostBtc = aiResponse.costBtc; // 0 for free/Groq models
    const creatorMarkupBtc = creatorCharge;
    const totalCostBtc = apiCostBtc + creatorMarkupBtc;

    // Store AI response
    const { data: assistantMessageData, error: aiMsgError } = await (
      supabase.from(DATABASE_TABLES.AI_MESSAGES) as any
    )
      .insert({
        conversation_id: convId,
        role: 'assistant',
        content: aiResponse.content,
        tokens_used: aiResponse.totalTokens,
        cost_btc: totalCostBtc,
        api_cost_btc: apiCostBtc,
        creator_markup_btc: creatorMarkupBtc,
        model_used: aiResponse.model,
        metadata: {
          pricing_model: assistant.pricing_model,
          used_byok: hasByok,
          is_free_model: aiResponse.isFreeModel,
          input_tokens: aiResponse.inputTokens,
          output_tokens: aiResponse.outputTokens,
        },
      })
      .select()
      .single();
    const assistantMessage = assistantMessageData as any;

    if (aiMsgError) {
      logger.error('Error storing AI message', aiMsgError, 'AIMessagesAPI');
      return apiInternalError('Failed to store AI response');
    }

    // Handle payments
    let paymentResult = null;

    // 1. Charge user for creator markup (if any)
    if (creatorMarkupBtc > 0) {
      paymentResult = await paymentService.chargeForMessage({
        userId: user.id,
        assistantId,
        conversationId: convId,
        messageId: assistantMessage.id,
        tokenCount: aiResponse.totalTokens,
      });

      if (!paymentResult.success) {
        logger.warn('Payment failed after message stored', paymentResult.error, 'AIMessagesAPI');
      }
    }

    // 2. Track platform usage for non-BYOK users
    if (!hasByok) {
      await keyService.incrementPlatformUsage(user.id, 1, aiResponse.totalTokens);
    }

    // 3. Update conversation stats
    await (supabase.from(DATABASE_TABLES.AI_CONVERSATIONS) as any)
      .update({
        last_message_at: new Date().toISOString(),
      })
      .eq('id', convId);

    const response = apiSuccess({
      userMessage,
      assistantMessage: {
        ...assistantMessage,
        // Add helpful metadata for frontend
        model_name:
          (provider === 'openrouter' ? getModelMetadata(modelToUse)?.name : null) || modelToUse,
        is_free_model: aiResponse.isFreeModel,
        used_byok: hasByok,
      },
      payment: paymentResult
        ? {
            charged: paymentResult.amountCharged,
            balanceRemaining: paymentResult.balanceRemaining,
          }
        : null,
      usage: {
        inputTokens: aiResponse.inputTokens,
        outputTokens: aiResponse.outputTokens,
        totalTokens: aiResponse.totalTokens,
        apiCostBtc,
        creatorMarkupBtc,
        totalCostBtc,
      },
      // User status info for UI
      userStatus: {
        hasByok,
        usedFreeMessage: usesFreeMessage,
        freeMessagesRemaining: usesFreeMessage ? freeMessagesRemaining - 1 : freeMessagesRemaining,
        freeMessagesPerDay: freeMessagesPerDay,
      },
    });
    return applyRateLimitHeaders(response, rateLimitResult);
  } catch (error) {
    logger.error('Send message error', error, 'AIMessagesAPI');
    return apiInternalError();
  }
}
