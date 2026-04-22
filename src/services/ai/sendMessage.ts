/**
 * AI Message Send Service
 *
 * Core business logic for the AI conversation message flow:
 * validate access → select model → call AI → store messages → charge/track.
 * Extracted from /api/ai-assistants/[id]/conversations/[convId]/messages.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
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

// ── Types ─────────────────────────────────────────────────────────────────────

type AIProvider = 'openrouter' | 'groq';

interface AssistantRecord {
  id: string;
  title: string;
  system_prompt: string | null;
  welcome_message: string | null;
  pricing_model: string;
  price_per_message: number | null;
  price_per_1k_tokens: number | null;
  user_id: string;
  model_preference: string | null;
  allowed_models: string[] | null;
  min_model_tier: string | null;
  temperature: number | null;
  max_tokens_per_response: number | null;
  free_messages_per_day: number | null;
}

export interface SendMessageResult {
  userMessage: Record<string, unknown>;
  assistantMessage: Record<string, unknown>;
  payment: { charged: number; balanceRemaining: number } | null;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    apiCostBtc: number;
    creatorMarkupBtc: number;
    totalCostBtc: number;
  };
  userStatus: {
    hasByok: boolean;
    usedFreeMessage: boolean;
    freeMessagesRemaining: number;
    freeMessagesPerDay: number;
  };
}

export type SendMessageError =
  | { code: 'NOT_FOUND'; message: string }
  | { code: 'ARCHIVED' }
  | { code: 'RATE_LIMITED'; message: string }
  | { code: 'SERVICE_UNAVAILABLE' }
  | { code: 'INSUFFICIENT_CREDITS'; currentBalance: number; requiredAmount: number; shortfall: number }
  | { code: 'AI_ERROR'; message: string }
  | { code: 'DB_ERROR'; message: string };

// ── Exported entry point ──────────────────────────────────────────────────────

export async function sendAiMessage(
  supabase: SupabaseClient,
  userId: string,
  assistantId: string,
  convId: string,
  content: string,
  requestedModel?: string
): Promise<SendMessageResult | SendMessageError> {
  // 1. Verify conversation
  const convResult = await verifyConversation(supabase, convId, assistantId, userId);
  if ('error' in convResult) return convResult.error;

  // 2. Fetch assistant
  const assistantResult = await fetchAssistant(supabase, assistantId);
  if ('error' in assistantResult) return assistantResult.error;
  const assistant = assistantResult.assistant;

  // 3. Determine provider + BYOK
  const keyService = createApiKeyService(supabase);
  const userOpenRouterKey = await keyService.getDecryptedKey(userId, 'openrouter');
  const hasByok = !!userOpenRouterKey;

  const provider = resolveProvider(hasByok, userOpenRouterKey);
  if (!provider) return { code: 'SERVICE_UNAVAILABLE' };

  // 4. Check platform usage limits (non-BYOK users)
  if (!hasByok) {
    const platformUsage = await keyService.checkPlatformUsage(userId);
    if (!platformUsage.can_use_platform) {
      return {
        code: 'RATE_LIMITED',
        message: 'Daily limit reached. Add your own OpenRouter API key for unlimited usage.',
      };
    }
  }

  // 5. Get conversation history
  const { data: historyData } = await supabase
    .from(DATABASE_TABLES.AI_MESSAGES)
    .select('role, content')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: true })
    .limit(20);
  const history = (historyData || []) as { role: string; content: string }[];

  // 6. Select model
  const modelToUse = selectModel(provider, hasByok, requestedModel, assistant, history, content);

  // 7. Free message check
  const freeMessagesPerDay = assistant.free_messages_per_day || 0;
  const { usesFreeMessage, freeMessagesRemaining } = await checkFreeMessageUsage(
    supabase,
    userId,
    assistantId,
    freeMessagesPerDay
  );

  // 8. Creator charge + balance check
  const baseCreatorCharge =
    assistant.pricing_model === 'per_message' ? assistant.price_per_message || 0 : 0;
  const creatorCharge = usesFreeMessage ? 0 : baseCreatorCharge;

  if (creatorCharge > 0) {
    const paymentService = createAIPaymentService(supabase);
    const balanceCheck = await paymentService.checkBalance(userId, assistantId);
    if (!balanceCheck.hasBalance) {
      return {
        code: 'INSUFFICIENT_CREDITS',
        currentBalance: balanceCheck.currentBalance,
        requiredAmount: balanceCheck.requiredAmount,
        shortfall: balanceCheck.shortfall ?? 0,
      };
    }
  }

  // 9. Store user message
  const userMsgResult = await storeUserMessage(supabase, convId, content);
  if ('error' in userMsgResult) return userMsgResult.error;
  const userMessage = userMsgResult.message;

  // 10. Generate AI response
  const messages = buildMessageHistory(history, content);
  const aiResult = await callAi(provider, hasByok, userOpenRouterKey, modelToUse, messages, assistant);
  if ('error' in aiResult) {
    // Clean up user message on AI failure
    await supabase.from(DATABASE_TABLES.AI_MESSAGES).delete().eq('id', (userMessage as { id: string }).id);
    return aiResult.error;
  }
  const aiResponse = aiResult.response;

  // 11. Store AI response
  const apiCostBtc = aiResponse.costBtc;
  const totalCostBtc = apiCostBtc + creatorCharge;
  const aiMsgResult = await storeAssistantMessage(supabase, convId, aiResponse, assistant, creatorCharge, apiCostBtc, hasByok);
  if ('error' in aiMsgResult) return aiMsgResult.error;
  const assistantMessage = aiMsgResult.message;

  // 12. Post-message side effects
  const paymentService = createAIPaymentService(supabase);
  let paymentResult = null;

  if (creatorCharge > 0) {
    paymentResult = await paymentService.chargeForMessage({
      userId,
      assistantId,
      conversationId: convId,
      messageId: (assistantMessage as { id: string }).id,
      tokenCount: aiResponse.totalTokens,
    });
    if (!paymentResult.success) {
      logger.warn('Payment failed after message stored', paymentResult.error, 'AIMessagesService');
    }
  }

  if (!hasByok) {
    await keyService.incrementPlatformUsage(userId, 1, aiResponse.totalTokens);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from(DATABASE_TABLES.AI_CONVERSATIONS) as any)
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', convId);

  return {
    userMessage,
    assistantMessage: {
      ...assistantMessage,
      model_name: (provider === 'openrouter' ? getModelMetadata(modelToUse)?.name : null) || modelToUse,
      is_free_model: aiResponse.isFreeModel,
      used_byok: hasByok,
    },
    payment: paymentResult
      ? { charged: paymentResult.amountCharged ?? 0, balanceRemaining: paymentResult.balanceRemaining ?? 0 }
      : null,
    usage: {
      inputTokens: aiResponse.inputTokens,
      outputTokens: aiResponse.outputTokens,
      totalTokens: aiResponse.totalTokens,
      apiCostBtc,
      creatorMarkupBtc: creatorCharge,
      totalCostBtc,
    },
    userStatus: {
      hasByok,
      usedFreeMessage: usesFreeMessage,
      freeMessagesRemaining: usesFreeMessage ? freeMessagesRemaining - 1 : freeMessagesRemaining,
      freeMessagesPerDay,
    },
  };
}

// ── Internal helpers ──────────────────────────────────────────────────────────

async function verifyConversation(
  supabase: SupabaseClient,
  convId: string,
  assistantId: string,
  userId: string
): Promise<{ ok: true } | { error: SendMessageError }> {
  const { data, error } = await supabase
    .from(DATABASE_TABLES.AI_CONVERSATIONS)
    .select('id, status')
    .eq('id', convId)
    .eq('assistant_id', assistantId)
    .eq('user_id', userId)
    .single();

  if (error || !data) return { error: { code: 'NOT_FOUND', message: 'Conversation not found' } };
  const conv = data as { id: string; status: string };
  if (conv.status !== STATUS.AI_ASSISTANTS.ACTIVE) return { error: { code: 'ARCHIVED' } };
  return { ok: true };
}

async function fetchAssistant(
  supabase: SupabaseClient,
  assistantId: string
): Promise<{ assistant: AssistantRecord } | { error: SendMessageError }> {
  const { data, error } = await supabase
    .from(DATABASE_TABLES.AI_ASSISTANTS)
    .select('id, title, system_prompt, welcome_message, pricing_model, price_per_message, price_per_1k_tokens, user_id, model_preference, allowed_models, min_model_tier, temperature, max_tokens_per_response, free_messages_per_day')
    .eq('id', assistantId)
    .single();

  if (error || !data) return { error: { code: 'NOT_FOUND', message: 'Assistant not found' } };
  return { assistant: data as AssistantRecord };
}

function resolveProvider(hasByok: boolean, userKey: string | null): AIProvider | null {
  if (userKey) return 'openrouter';
  if (process.env.OPENROUTER_API_KEY) return 'openrouter';
  if (isGroqAvailable()) return 'groq';
  return null;
}

function selectModel(
  provider: AIProvider,
  hasByok: boolean,
  requestedModel: string | undefined,
  assistant: AssistantRecord,
  history: { role: string; content: string }[],
  content: string
): string {
  if (provider === 'groq') return DEFAULT_GROQ_MODEL;

  let modelToUse = requestedModel || assistant.model_preference || 'auto';
  const historyMapped = history.map(m => ({ role: m.role, content: m.content }));

  if (!hasByok) {
    if (modelToUse === 'auto' || modelToUse === 'any' || !isModelFree(modelToUse)) {
      const freeModelIds = getFreeModels().map(m => m.id);
      modelToUse = createAutoRouter().selectModel({ message: content, conversationHistory: historyMapped, allowedModels: freeModelIds }).model;
    }
  } else if (modelToUse === 'auto' || modelToUse === 'any') {
    const allowedModels = assistant.allowed_models?.length ? assistant.allowed_models : undefined;
    modelToUse = createAutoRouter().selectModel({ message: content, conversationHistory: historyMapped, allowedModels }).model;
  }

  return getModelMetadata(modelToUse) ? modelToUse : DEFAULT_FREE_MODEL_ID;
}

async function checkFreeMessageUsage(
  supabase: SupabaseClient,
  userId: string,
  assistantId: string,
  freeMessagesPerDay: number
): Promise<{ usesFreeMessage: boolean; freeMessagesRemaining: number }> {
  if (freeMessagesPerDay <= 0) return { usesFreeMessage: false, freeMessagesRemaining: 0 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: userConvosData } = await supabase
    .from(DATABASE_TABLES.AI_CONVERSATIONS)
    .select('id')
    .eq('assistant_id', assistantId)
    .eq('user_id', userId);
  const convoIds = (userConvosData as { id: string }[] | null)?.map(c => c.id) || [];

  if (convoIds.length === 0) {
    return { usesFreeMessage: true, freeMessagesRemaining: freeMessagesPerDay };
  }

  const { count: todayCount } = await supabase
    .from(DATABASE_TABLES.AI_MESSAGES)
    .select('id', { count: 'exact', head: true })
    .in('conversation_id', convoIds)
    .eq('role', 'user')
    .gte('created_at', today.toISOString());

  const remaining = Math.max(0, freeMessagesPerDay - (todayCount || 0));
  return { usesFreeMessage: remaining > 0, freeMessagesRemaining: remaining };
}

function buildMessageHistory(history: { role: string; content: string }[], content: string) {
  return [
    ...history.map(m => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content })),
    { role: 'user' as const, content },
  ];
}

async function callAi(
  provider: AIProvider,
  hasByok: boolean,
  userKey: string | null,
  modelToUse: string,
  messages: (OpenRouterMessage | GroqMessage)[],
  assistant: AssistantRecord
): Promise<
  | { response: { content: string; model: string; inputTokens: number; outputTokens: number; totalTokens: number; isFreeModel: boolean; costBtc: number } }
  | { error: SendMessageError }
> {
  try {
    if (provider === 'groq') {
      const result = await createGroqService().chatCompletion({
        model: modelToUse,
        messages: messages as GroqMessage[],
        systemPrompt: assistant.system_prompt || undefined,
        temperature: assistant.temperature ?? 0.7,
        maxTokens: assistant.max_tokens_per_response || undefined,
      });
      return { response: { ...result, costBtc: 0 } };
    } else {
      const openRouter = hasByok
        ? createOpenRouterServiceWithByok(userKey!)
        : createOpenRouterService();
      const result = await openRouter.chatCompletion({
        model: modelToUse,
        messages: messages as OpenRouterMessage[],
        systemPrompt: assistant.system_prompt || undefined,
        temperature: assistant.temperature ?? 0.7,
        maxTokens: assistant.max_tokens_per_response || undefined,
      });
      return { response: result };
    }
  } catch (aiError: unknown) {
    logger.error('AI API error', aiError, 'AIMessagesService');
    const message = aiError instanceof Error ? aiError.message : 'AI service error';
    return { error: { code: 'AI_ERROR', message } };
  }
}

async function storeUserMessage(
  supabase: SupabaseClient,
  convId: string,
  content: string
): Promise<{ message: Record<string, unknown> } | { error: SendMessageError }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from(DATABASE_TABLES.AI_MESSAGES) as any)
    .insert({ conversation_id: convId, role: 'user', content, tokens_used: Math.ceil(content.length / 4), cost_btc: 0 })
    .select()
    .single();

  if (error) {
    logger.error('Error storing user message', error, 'AIMessagesService');
    return { error: { code: 'DB_ERROR', message: 'Failed to store message' } };
  }
  return { message: data as Record<string, unknown> };
}

async function storeAssistantMessage(
  supabase: SupabaseClient,
  convId: string,
  aiResponse: { content: string; model: string; inputTokens: number; outputTokens: number; totalTokens: number; isFreeModel: boolean; costBtc: number },
  assistant: AssistantRecord,
  creatorMarkupBtc: number,
  apiCostBtc: number,
  hasByok: boolean
): Promise<{ message: Record<string, unknown> } | { error: SendMessageError }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from(DATABASE_TABLES.AI_MESSAGES) as any)
    .insert({
      conversation_id: convId,
      role: 'assistant',
      content: aiResponse.content,
      tokens_used: aiResponse.totalTokens,
      cost_btc: apiCostBtc + creatorMarkupBtc,
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

  if (error) {
    logger.error('Error storing AI message', error, 'AIMessagesService');
    return { error: { code: 'DB_ERROR', message: 'Failed to store AI response' } };
  }
  return { message: data as Record<string, unknown> };
}
