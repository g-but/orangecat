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

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { DATABASE_TABLES } from '@/config/database-tables';
import { createAIPaymentService } from '@/services/ai-payments';
import {
  createOpenRouterService,
  createOpenRouterServiceWithByok,
  createApiKeyService,
  type OpenRouterMessage,
} from '@/services/ai';
import { DEFAULT_FREE_MODEL_ID, isModelFree, getModelMetadata } from '@/config/ai-models';
import { createAutoRouter } from '@/services/ai/auto-router';
import { rateLimitWriteAsync, createRateLimitResponse } from '@/lib/rate-limit';
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit AI message requests (30 per minute per user)
    const rateLimitResult = await rateLimitWriteAsync(user.id);
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const body = await request.json();
    const result = sendMessageSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { content, model: requestedModel } = result.data;

    // Verify conversation exists and belongs to user
    const { data: conversation, error: convError } = await supabase
      .from(DATABASE_TABLES.AI_CONVERSATIONS)
      .select('id, assistant_id, user_id, status')
      .eq('id', convId)
      .eq('assistant_id', assistantId)
      .eq('user_id', user.id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (conversation.status !== 'active') {
      return NextResponse.json({ error: 'Conversation is archived' }, { status: 400 });
    }

    // Get assistant details including all configuration
    const { data: assistant, error: assistantError } = await supabase
      .from(DATABASE_TABLES.AI_ASSISTANTS)
      .select(
        'id, title, system_prompt, welcome_message, pricing_model, price_per_message, price_per_1k_tokens, user_id, model_preference, allowed_models, min_model_tier, temperature, max_tokens_per_response, free_messages_per_day'
      )
      .eq('id', assistantId)
      .single();

    if (assistantError || !assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    // Check BYOK status
    const keyService = createApiKeyService(supabase);
    const userApiKey = await keyService.getDecryptedKey(user.id, 'openrouter');
    const hasByok = !!userApiKey;

    // For non-BYOK users, check platform limits
    if (!hasByok) {
      const platformUsage = await keyService.checkPlatformUsage(user.id);
      if (!platformUsage.can_use_platform) {
        return NextResponse.json(
          {
            error: 'Daily limit reached',
            details: {
              message:
                'You have reached your daily free message limit. Add your own OpenRouter API key for unlimited usage.',
              dailyLimit: platformUsage.daily_limit,
              used: platformUsage.daily_requests,
            },
          },
          { status: 429 }
        );
      }
    }

    // Get conversation history for context (used by auto-router and AI call)
    const { data: history } = await supabase
      .from(DATABASE_TABLES.AI_MESSAGES)
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(20);

    // Determine which model to use using centralized auto-router logic
    let modelToUse = requestedModel || assistant.model_preference || 'auto';

    // For non-BYOK users, enforce free models only
    if (!hasByok) {
      if (modelToUse === 'auto' || modelToUse === 'any' || !isModelFree(modelToUse)) {
        // Use auto-router but restrict to free models
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
      // BYOK users with 'auto': use intelligent model selection based on complexity
      const autoRouter = createAutoRouter();
      const allowedModels = assistant.allowed_models?.length ? assistant.allowed_models : undefined;
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
      const { data: userConvos } = await supabase
        .from(DATABASE_TABLES.AI_CONVERSATIONS)
        .select('id')
        .eq('assistant_id', assistantId)
        .eq('user_id', user.id);

      const convoIds = userConvos?.map(c => c.id) || [];

      if (convoIds.length > 0) {
        // Count user messages to this assistant today (across all conversations)
        const { count: todayMessageCount } = await supabase
          .from(DATABASE_TABLES.AI_MESSAGES)
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
        return NextResponse.json(
          {
            error: 'Insufficient credits',
            details: {
              currentBalance: balanceCheck.currentBalance,
              requiredAmount: balanceCheck.requiredAmount,
              shortfall: balanceCheck.shortfall,
            },
          },
          { status: 402 }
        );
      }
    }

    // Store user message first
    const { data: userMessage, error: userMsgError } = await supabase
      .from(DATABASE_TABLES.AI_MESSAGES)
      .insert({
        conversation_id: convId,
        role: 'user',
        content,
        tokens_used: Math.ceil(content.length / 4),
        cost_sats: 0,
      })
      .select()
      .single();

    if (userMsgError) {
      console.error('Error storing user message:', userMsgError);
      return NextResponse.json({ error: 'Failed to store message' }, { status: 500 });
    }

    // Create OpenRouter service (BYOK or platform)
    const openRouter = hasByok
      ? createOpenRouterServiceWithByok(userApiKey)
      : createOpenRouterService();

    // Build messages array for OpenRouter
    const messages: OpenRouterMessage[] = [
      ...(history || []).map(m => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
      { role: 'user' as const, content },
    ];

    // Generate AI response using creator's settings
    let aiResponse;
    try {
      aiResponse = await openRouter.chatCompletion({
        model: modelToUse,
        messages,
        systemPrompt: assistant.system_prompt || undefined,
        temperature: assistant.temperature ?? 0.7,
        maxTokens: assistant.max_tokens_per_response || undefined,
      });
    } catch (aiError: unknown) {
      console.error('OpenRouter API error:', aiError);

      // Clean up user message on AI failure
      await supabase.from(DATABASE_TABLES.AI_MESSAGES).delete().eq('id', userMessage.id);

      const errorMessage = aiError instanceof Error ? aiError.message : 'AI service error';
      return NextResponse.json(
        {
          error: 'Failed to generate AI response',
          details: { message: errorMessage },
        },
        { status: 502 }
      );
    }

    // Calculate costs
    const apiCostSats = aiResponse.costSats; // 0 for free models
    const creatorMarkupSats = creatorCharge;
    const totalCostSats = apiCostSats + creatorMarkupSats;

    // Store AI response
    const { data: assistantMessage, error: aiMsgError } = await supabase
      .from(DATABASE_TABLES.AI_MESSAGES)
      .insert({
        conversation_id: convId,
        role: 'assistant',
        content: aiResponse.content,
        tokens_used: aiResponse.totalTokens,
        cost_sats: totalCostSats,
        api_cost_sats: apiCostSats,
        creator_markup_sats: creatorMarkupSats,
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

    if (aiMsgError) {
      console.error('Error storing AI message:', aiMsgError);
      return NextResponse.json({ error: 'Failed to store AI response' }, { status: 500 });
    }

    // Handle payments
    let paymentResult = null;

    // 1. Charge user for creator markup (if any)
    if (creatorMarkupSats > 0) {
      paymentResult = await paymentService.chargeForMessage({
        userId: user.id,
        assistantId,
        conversationId: convId,
        messageId: assistantMessage.id,
        tokenCount: aiResponse.totalTokens,
      });

      if (!paymentResult.success) {
        console.warn('Payment failed after message stored:', paymentResult.error);
      }
    }

    // 2. Track platform usage for non-BYOK users
    if (!hasByok) {
      await keyService.incrementPlatformUsage(user.id, 1, aiResponse.totalTokens);
    }

    // 3. Update conversation stats
    await supabase
      .from(DATABASE_TABLES.AI_CONVERSATIONS)
      .update({
        last_message_at: new Date().toISOString(),
      })
      .eq('id', convId);

    return NextResponse.json({
      success: true,
      data: {
        userMessage,
        assistantMessage: {
          ...assistantMessage,
          // Add helpful metadata for frontend
          model_name: modelMeta?.name || modelToUse,
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
          apiCostSats,
          creatorMarkupSats,
          totalCostSats,
        },
        // User status info for UI
        userStatus: {
          hasByok,
          usedFreeMessage: usesFreeMessage,
          freeMessagesRemaining: usesFreeMessage
            ? freeMessagesRemaining - 1
            : freeMessagesRemaining,
          freeMessagesPerDay: freeMessagesPerDay,
        },
      },
    });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
