/**
 * My Cat - Private Chat API
 *
 * POST /api/cat/chat - Ephemeral AI response with model selection
 * - Uses OpenRouter with BYOK if available; otherwise platform key
 * - For non-BYOK users, restricts to free models and checks daily platform usage
 * - Does not persist any conversation content
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { ROUTES } from '@/config/routes';
import { z } from 'zod';
import {
  createOpenRouterService,
  createOpenRouterServiceWithByok,
  createGroqService,
  createGroqServiceWithByok,
  isGroqAvailable,
  DEFAULT_GROQ_MODEL,
  type OpenRouterMessage,
  type GroqMessage,
} from '@/services/ai';
import {
  isModelFree,
  getModelMetadata,
  getFreeModels,
  DEFAULT_FREE_MODEL_ID,
} from '@/config/ai-models';
import { createAutoRouter } from '@/services/ai/auto-router';
import { createApiKeyService } from '@/services/ai/api-key-service';
import { fetchFullContextForCat, buildFullContextString } from '@/services/ai/document-context';
import { applyRateLimitHeaders, type RateLimitResult } from '@/lib/rate-limit';
import { enforceUserWriteLimit, RateLimitError } from '@/lib/api/rateLimiting';
import { OPENROUTER_KEY_HEADER } from '@/config/http-headers';
import { buildCatSystemPrompt } from '@/services/cat/system-prompt';
import { getCatFewShotExamples } from '@/services/cat/few-shot-examples';
import { parseActionsFromResponse } from '@/services/cat/response-parser';

// Header for Groq API key (BYOK)
const GROQ_KEY_HEADER = 'x-groq-api-key';

// Supported AI providers
type AIProvider = 'groq' | 'openrouter';

const bodySchema = z.object({
  message: z.string().min(1).max(10000),
  model: z.string().optional(), // 'auto' | model id
  stream: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit per user (write-tier limits reused for chat to prevent abuse)
    let rl: RateLimitResult;
    try {
      rl = await enforceUserWriteLimit(user.id);
    } catch (e) {
      if (e instanceof RateLimitError) {
        const retryAfter = e.details?.retryAfter || 60;
        const limit = e.details?.limit || 30;
        const resetTime = Date.now() + retryAfter * 1000;
        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
            limit,
            remaining: 0,
            resetTime,
            resetDate: new Date(resetTime).toUTCString(),
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': String(limit),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(resetTime),
              'Retry-After': String(retryAfter),
            },
          }
        );
      }
      throw e;
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { message, model: requestedModel, stream } = parsed.data;

    // Check BYOK for both providers
    const clientOpenRouterKey = request.headers.get(OPENROUTER_KEY_HEADER);
    const clientGroqKey = request.headers.get(GROQ_KEY_HEADER);
    const keyService = createApiKeyService(supabase);

    // Get stored keys if no client-provided keys
    const storedOpenRouterKey = clientOpenRouterKey
      ? null
      : await keyService.getDecryptedKey(user.id, 'openrouter');
    const storedGroqKey = clientGroqKey ? null : await keyService.getDecryptedKey(user.id, 'groq');

    const userOpenRouterKey = clientOpenRouterKey || storedOpenRouterKey;
    const userGroqKey = clientGroqKey || storedGroqKey;

    // Determine which provider to use
    // Priority: User's Groq key > User's OpenRouter key > Platform Groq > Platform OpenRouter
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
      // No AI provider available
      return NextResponse.json(
        {
          error: 'AI chat not configured',
          code: 'NO_API_KEY',
          details: {
            message:
              'To use My Cat AI chat, you need to add your own API key in Settings → API Keys. Get a free Groq key at console.groq.com/keys',
            hasByok: false,
            helpUrl: `${ROUTES.DASHBOARD.SETTINGS}?tab=api-keys`,
          },
        },
        { status: 503 }
      );
    }

    // Platform usage for non-BYOK
    let platformUsage: { daily_limit: number; requests_remaining: number } | null = null;
    if (!hasByok) {
      const usage = await keyService.checkPlatformUsage(user.id);
      if (!usage.can_use_platform) {
        return NextResponse.json(
          {
            error: 'Daily limit reached',
            details: {
              message:
                'You have reached your daily free message limit. Add your own API key for unlimited usage.',
              dailyLimit: usage.daily_limit,
              used: usage.daily_requests,
            },
          },
          { status: 429 }
        );
      }
      platformUsage = {
        daily_limit: usage.daily_limit,
        requests_remaining: usage.requests_remaining,
      };
    }

    // Choose model based on provider
    let modelToUse: string;

    if (provider === 'groq') {
      // Groq uses its own model names
      modelToUse =
        requestedModel?.startsWith('llama') ||
        requestedModel?.startsWith('mixtral') ||
        requestedModel?.startsWith('gemma')
          ? requestedModel
          : DEFAULT_GROQ_MODEL;
    } else {
      // OpenRouter model selection
      modelToUse = requestedModel || DEFAULT_FREE_MODEL_ID;

      if (!hasByok) {
        // Non-technical users: restrict to free models only
        if (modelToUse === 'auto' || modelToUse === 'any' || !isModelFree(modelToUse)) {
          const freeModelIds = getFreeModels().map(m => m.id);
          const auto = createAutoRouter();
          const route = auto.selectModel({
            message,
            conversationHistory: [],
            allowedModels: freeModelIds,
          });
          modelToUse = route.model;
        }
      } else {
        // Power users with BYOK: can use any model
        if (modelToUse === 'auto' || modelToUse === 'any') {
          const auto = createAutoRouter();
          const route = auto.selectModel({ message, conversationHistory: [] });
          modelToUse = route.model;
        }
      }

      // Safety: ensure model exists, fallback to free default
      const meta = getModelMetadata(modelToUse);
      if (!meta) {
        modelToUse = DEFAULT_FREE_MODEL_ID;
      }
    }

    // Fetch comprehensive user context for personalized advice
    const userContext = await fetchFullContextForCat(supabase, user.id);
    const contextString = buildFullContextString(userContext);

    // Build system prompt with full user context if available
    const systemPromptWithContext = buildCatSystemPrompt({
      userContext: contextString || undefined,
    });

    // Build request with system prompt + few-shot examples for better compliance
    const messages: (OpenRouterMessage | GroqMessage)[] = [
      { role: 'system', content: systemPromptWithContext },
      ...getCatFewShotExamples(),
      { role: 'user', content: message },
    ];

    // Create the appropriate service based on provider
    let aiService: {
      provider: AIProvider;
      groq?: ReturnType<typeof createGroqService>;
      openrouter?: ReturnType<typeof createOpenRouterService>;
    };

    if (provider === 'groq') {
      const groq = hasByok ? createGroqServiceWithByok(userGroqKey as string) : createGroqService();
      aiService = { provider: 'groq', groq };
    } else {
      const openrouter = hasByok
        ? createOpenRouterServiceWithByok(userOpenRouterKey as string)
        : createOpenRouterService();
      aiService = { provider: 'openrouter', openrouter };
    }

    // Streaming mode (SSE)
    if (stream) {
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            let usage:
              | { inputTokens?: number; outputTokens?: number; totalTokens?: number }
              | undefined;
            let fullContent = ''; // Accumulate for action parsing

            // Send model and provider info at the start of the stream
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ model: modelToUse, provider })}\n\n`)
            );

            // Use the appropriate streaming method based on provider
            if (aiService.provider === 'groq' && aiService.groq) {
              for await (const chunk of aiService.groq.streamChatCompletion({
                model: modelToUse,
                messages: messages as GroqMessage[],
                temperature: 0.7,
              })) {
                if (chunk.usage) {
                  usage = chunk.usage;
                }
                if (chunk.content) {
                  fullContent += chunk.content;
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ content: chunk.content })}\n\n`)
                  );
                }
                if (chunk.done) {
                  const { actions } = parseActionsFromResponse(fullContent);
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        done: true,
                        usage,
                        model: modelToUse,
                        provider,
                        actions: actions.length > 0 ? actions : undefined,
                      })}\n\n`
                    )
                  );
                  break;
                }
              }
            } else if (aiService.provider === 'openrouter' && aiService.openrouter) {
              for await (const chunk of aiService.openrouter.streamChatCompletion({
                model: modelToUse,
                messages: messages as OpenRouterMessage[],
                temperature: 0.7,
              })) {
                if (chunk.usage) {
                  usage = chunk.usage;
                }
                if (chunk.content) {
                  fullContent += chunk.content;
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ content: chunk.content })}\n\n`)
                  );
                }
                if (chunk.done) {
                  const { actions } = parseActionsFromResponse(fullContent);
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        done: true,
                        usage,
                        model: modelToUse,
                        provider,
                        actions: actions.length > 0 ? actions : undefined,
                      })}\n\n`
                    )
                  );
                  break;
                }
              }
            }

            // Track platform usage (non-BYOK) best-effort with usage tokens
            if (!hasByok && usage?.totalTokens) {
              await keyService.incrementPlatformUsage(user.id, 1, usage.totalTokens);
            }
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'stream_error';
            controller.enqueue(encoder.encode(`event: error\n`));
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
            );
          } finally {
            controller.close();
          }
        },
      });

      const resp = new Response(readable, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      });
      // Apply rate limit headers for observability
      return applyRateLimitHeaders(resp, rl);
    }

    // Non-streaming
    let aiResult: {
      content: string;
      model: string;
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
      isFreeModel: boolean;
      usedByok: boolean;
      costSats?: number;
    };

    if (aiService.provider === 'groq' && aiService.groq) {
      const result = await aiService.groq.chatCompletion({
        model: modelToUse,
        messages: messages as GroqMessage[],
        temperature: 0.7,
      });
      aiResult = {
        content: result.content,
        model: result.model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        totalTokens: result.totalTokens,
        isFreeModel: result.isFreeModel,
        usedByok: result.usedByok,
        costSats: 0, // Groq is free
      };
    } else if (aiService.provider === 'openrouter' && aiService.openrouter) {
      const result = await aiService.openrouter.chatCompletion({
        model: modelToUse,
        messages: messages as OpenRouterMessage[],
        temperature: 0.7,
      });
      aiResult = {
        content: result.content,
        model: result.model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        totalTokens: result.totalTokens,
        isFreeModel: result.isFreeModel,
        usedByok: result.usedByok,
        costSats: result.costSats,
      };
    } else {
      return NextResponse.json({ error: 'No AI service available' }, { status: 500 });
    }

    // Track platform usage (non-BYOK)
    if (!hasByok) {
      await keyService.incrementPlatformUsage(user.id, 1, aiResult.totalTokens);
    }

    // Parse actions from AI response
    const { message: cleanedMessage, actions } = parseActionsFromResponse(aiResult.content);

    const responseJson = NextResponse.json({
      success: true,
      data: {
        message: cleanedMessage,
        actions: actions.length > 0 ? actions : undefined,
        modelUsed: aiResult.model,
        provider,
        usage: {
          inputTokens: aiResult.inputTokens,
          outputTokens: aiResult.outputTokens,
          totalTokens: aiResult.totalTokens,
          apiCostSats: aiResult.costSats || 0,
          isFreeModel: aiResult.isFreeModel,
          usedByok: aiResult.usedByok,
        },
        userStatus: {
          hasByok,
          freeMessagesPerDay: platformUsage?.daily_limit ?? 0,
          freeMessagesRemaining: platformUsage?.requests_remaining ?? 0,
        },
      },
    });
    return applyRateLimitHeaders(responseJson, rl);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
