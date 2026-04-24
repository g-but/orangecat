/**
 * Cat Provider Resolver
 *
 * Determines which AI provider (Groq / OpenRouter) and model to use,
 * resolves BYOK keys, enforces platform usage limits, and returns a
 * ready-to-use AI service pair with all metadata the route needs.
 */

import { createApiKeyService } from '@/services/ai/api-key-service';
import {
  createOpenRouterService,
  createOpenRouterServiceWithByok,
  createGroqService,
  createGroqServiceWithByok,
  isGroqAvailable,
  DEFAULT_GROQ_MODEL,
} from '@/services/ai';
import {
  isModelFree,
  getModelMetadata,
  getFreeModels,
  DEFAULT_FREE_MODEL_ID,
} from '@/config/ai-models';
import { createAutoRouter } from '@/services/ai/auto-router';
import { OPENROUTER_KEY_HEADER } from '@/config/http-headers';
import { ROUTES } from '@/config/routes';
import type { AnySupabaseClient } from '@/lib/supabase/types';

const GROQ_KEY_HEADER = 'x-groq-api-key';

export type AIProvider = 'groq' | 'openrouter';

/** Minimal interface both Groq and OpenRouter services satisfy */
export interface AiService {
  streamChatCompletion(opts: {
    model: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: any[];
    temperature: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): AsyncIterable<{ content?: string; usage?: any; done?: boolean }>;
  chatCompletion(opts: {
    model: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: any[];
    temperature: number;
  }): Promise<{
    content: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    isFreeModel: boolean;
    usedByok: boolean;
    costBtc?: number;
  }>;
}

export interface ResolvedProvider {
  provider: AIProvider;
  hasByok: boolean;
  modelToUse: string;
  aiService: AiService;
  platformUsage: { daily_limit: number; requests_remaining: number } | null;
  keyService: ReturnType<typeof createApiKeyService>;
  userGroqKey: string | null;
}

/**
 * Resolves provider, keys, model, and platform limits for a Cat chat request.
 * Returns `ResolvedProvider` on success, or a `Response` to return directly on failure.
 */
export async function resolveProvider(
  supabase: AnySupabaseClient,
  userId: string,
  requestHeaders: Headers,
  opts: { requestedModel?: string; message: string }
): Promise<ResolvedProvider | Response> {
  const { requestedModel, message } = opts;
  const keyService = createApiKeyService(supabase);

  // Resolve BYOK keys (header takes priority over stored)
  const clientOpenRouterKey = requestHeaders.get(OPENROUTER_KEY_HEADER);
  const clientGroqKey = requestHeaders.get(GROQ_KEY_HEADER);
  const storedOpenRouterKey = clientOpenRouterKey
    ? null
    : await keyService.getDecryptedKey(userId, 'openrouter');
  const storedGroqKey = clientGroqKey
    ? null
    : await keyService.getDecryptedKey(userId, 'groq');

  const userOpenRouterKey = clientOpenRouterKey || storedOpenRouterKey;
  const userGroqKey = clientGroqKey || storedGroqKey;

  // Provider priority: User Groq key > User OpenRouter key > Platform Groq > Platform OpenRouter
  let provider: AIProvider;
  let hasByok = false;

  if (userGroqKey) {
    provider = 'groq';
    hasByok = true;
  } else if (userOpenRouterKey) {
    provider = 'openrouter';
    hasByok = true;
  } else if (isGroqAvailable()) {
    provider = 'groq';
  } else if (process.env.OPENROUTER_API_KEY) {
    provider = 'openrouter';
  } else {
    return Response.json(
      {
        success: false,
        error: 'AI chat not configured',
        code: 'NO_API_KEY',
        message:
          'To use My Cat AI chat, you need to add your own API key in Settings → API Keys. Get a free Groq key at console.groq.com/keys',
        hasByok: false,
        helpUrl: `${ROUTES.DASHBOARD.SETTINGS}?tab=api-keys`,
      },
      { status: 503 }
    );
  }

  // Platform usage check (non-BYOK only)
  let platformUsage: { daily_limit: number; requests_remaining: number } | null = null;
  if (!hasByok) {
    const usage = await keyService.checkPlatformUsage(userId);
    if (!usage.can_use_platform) {
      return Response.json(
        { success: false, error: 'Daily limit reached', retryAfter: 86400 },
        { status: 429 }
      );
    }
    platformUsage = { daily_limit: usage.daily_limit, requests_remaining: usage.requests_remaining };
  }

  // Model selection
  let modelToUse: string;
  if (provider === 'groq') {
    // Groq: use requested model only if it's a known Groq model family
    modelToUse =
      requestedModel?.startsWith('llama') ||
      requestedModel?.startsWith('mixtral') ||
      requestedModel?.startsWith('gemma')
        ? requestedModel
        : DEFAULT_GROQ_MODEL;
  } else {
    // OpenRouter: route through auto-router for free/BYOK users
    modelToUse = requestedModel || DEFAULT_FREE_MODEL_ID;
    const auto = createAutoRouter();
    if (!hasByok) {
      if (modelToUse === 'auto' || modelToUse === 'any' || !isModelFree(modelToUse)) {
        const freeModelIds = getFreeModels().map(m => m.id);
        modelToUse = auto.selectModel({ message, conversationHistory: [], allowedModels: freeModelIds }).model;
      }
    } else if (modelToUse === 'auto' || modelToUse === 'any') {
      modelToUse = auto.selectModel({ message, conversationHistory: [] }).model;
    }
    if (!getModelMetadata(modelToUse)) {
      modelToUse = DEFAULT_FREE_MODEL_ID;
    }
  }

  // Instantiate the AI service
  const aiService: AiService =
    provider === 'groq'
      ? (hasByok ? createGroqServiceWithByok(userGroqKey as string) : createGroqService())
      : (hasByok ? createOpenRouterServiceWithByok(userOpenRouterKey as string) : createOpenRouterService());

  return { provider, hasByok, modelToUse, aiService, platformUsage, keyService, userGroqKey };
}
