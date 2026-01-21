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
import { z } from 'zod';
import {
  createOpenRouterService,
  createOpenRouterServiceWithByok,
  type OpenRouterMessage,
} from '@/services/ai';
import {
  isModelFree,
  getModelMetadata,
  getFreeModels,
  DEFAULT_FREE_MODEL_ID,
} from '@/config/ai-models';
import { createAutoRouter } from '@/services/ai/auto-router';
import { createApiKeyService } from '@/services/ai/api-key-service';
import { fetchDocumentsForCat, buildDocumentContextString } from '@/services/ai/document-context';
import { applyRateLimitHeaders, type RateLimitResult } from '@/lib/rate-limit';
import { enforceUserWriteLimit, RateLimitError } from '@/lib/api/rateLimiting';
import { OPENROUTER_KEY_HEADER } from '@/config/http-headers';

const bodySchema = z.object({
  message: z.string().min(1).max(10000),
  model: z.string().optional(), // 'auto' | model id
  stream: z.boolean().optional(),
});

/**
 * System prompt for My Cat - OrangeCat's personal AI agent
 * Concise with few-shot examples for better model compliance
 */
const SYSTEM_PROMPT = `You are My Cat, OrangeCat's AI assistant. OrangeCat is a Bitcoin-powered platform where users create Products, Services, Projects (crowdfunding), Causes, and Events. Payments use Bitcoin/Lightning in satoshis.

CRITICAL RULES:
- Help users do things HERE on OrangeCat - never recommend other platforms
- Never cite external websites (no investopedia, indiegogo, etc.)
- Ask clarifying questions to understand what they really need
- Give specific, actionable guidance - not generic advice
- Think from first principles`;

/**
 * Few-shot examples to demonstrate desired behavior
 * These are more effective than instructions for smaller models
 */
const FEW_SHOT_EXAMPLES: OpenRouterMessage[] = [
  {
    role: 'user',
    content: 'I want to start a crowdfunding campaign for my podcast',
  },
  {
    role: 'assistant',
    content: `Great! Let's create a Project on OrangeCat for your podcast.

First, help me understand:
1. What's your podcast about?
2. What do you need funding for - equipment, production costs, or ongoing support?
3. Do you have a funding goal in mind (in sats or USD equivalent)?

Once I understand these, I'll help you craft a compelling Project that resonates with potential supporters.`,
  },
  {
    role: 'user',
    content: 'How do I price my digital products?',
  },
  {
    role: 'assistant',
    content: `Let's think through pricing from first principles.

Key questions:
1. What's the product? (ebook, course, template, software?)
2. Who's your target buyer - Bitcoiners, general audience, professionals?
3. What problem does it solve for them?

Pricing on OrangeCat is in sats. Common ranges:
- Small digital goods: 5,000-50,000 sats ($2-20)
- Courses/premium content: 100,000-500,000 sats ($40-200)

What are you selling? I'll help you think through the right price point.`,
  },
];

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

    // Check BYOK: prefer client-provided key in header (not stored)
    const clientProvidedKey = request.headers.get(OPENROUTER_KEY_HEADER);
    const keyService = createApiKeyService(supabase);
    const storedApiKey = clientProvidedKey
      ? null
      : await keyService.getDecryptedKey(user.id, 'openrouter');
    const userApiKey = clientProvidedKey || storedApiKey;
    const hasByok = !!userApiKey;

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
                'You have reached your daily free message limit. Add your own OpenRouter API key for unlimited usage.',
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

    // Choose model - ALWAYS default to free for simplicity
    let modelToUse = requestedModel || DEFAULT_FREE_MODEL_ID; // Default to free model immediately

    if (!hasByok) {
      // Non-technical users: restrict to free models only
      if (modelToUse === 'auto' || modelToUse === 'any' || !isModelFree(modelToUse)) {
        // Auto-select best free model
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

    // Fetch user's documents for personalized context
    const userDocuments = await fetchDocumentsForCat(supabase, user.id);
    const documentContext = buildDocumentContextString(userDocuments);

    // Build system prompt with document context if available
    const systemPromptWithContext = documentContext
      ? `${SYSTEM_PROMPT}\n\n${documentContext}`
      : SYSTEM_PROMPT;

    // Build request with system prompt + few-shot examples for better compliance
    const messages: OpenRouterMessage[] = [
      { role: 'system', content: systemPromptWithContext },
      ...FEW_SHOT_EXAMPLES,
      { role: 'user', content: message },
    ];

    // Check if we can create the OpenRouter service
    let openrouter;
    try {
      openrouter = hasByok
        ? createOpenRouterServiceWithByok(userApiKey as string)
        : createOpenRouterService();
    } catch (_error) {
      // No platform API key configured and user doesn't have BYOK
      return NextResponse.json(
        {
          error: 'AI chat not configured',
          code: 'NO_API_KEY',
          details: {
            message:
              'To use My Cat AI chat, you need to add your own OpenRouter API key in Settings → API Keys. Get a free key at openrouter.ai',
            hasByok: false,
            helpUrl: '/dashboard/settings?tab=api-keys',
          },
        },
        { status: 503 }
      );
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
            // Send model info at the start of the stream
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ model: modelToUse })}\n\n`)
            );
            for await (const chunk of openrouter.streamChatCompletion({
              model: modelToUse,
              messages,
              temperature: 0.7,
            })) {
              if (chunk.usage) {
                usage = chunk.usage;
              }
              if (chunk.content) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ content: chunk.content })}\n\n`)
                );
              }
              if (chunk.done) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ done: true, usage, model: modelToUse })}\n\n`
                  )
                );
                break;
              }
            }
            // Track platform usage (non-BYOK) best-effort with usage tokens
            if (!hasByok && usage?.totalTokens) {
              await keyService.incrementPlatformUsage(user.id, 1, usage.totalTokens);
            }
          } catch (_err) {
            controller.enqueue(encoder.encode(`event: error\n`));
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: 'stream_error' })}\n\n`)
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
    const ai = await openrouter.chatCompletion({
      model: modelToUse,
      messages,
      temperature: 0.7,
    });

    // Track platform usage (non-BYOK)
    if (!hasByok) {
      await keyService.incrementPlatformUsage(user.id, 1, ai.totalTokens);
    }

    const responseJson = NextResponse.json({
      success: true,
      data: {
        message: ai.content,
        modelUsed: ai.model,
        usage: {
          inputTokens: ai.inputTokens,
          outputTokens: ai.outputTokens,
          totalTokens: ai.totalTokens,
          apiCostSats: ai.costSats,
          isFreeModel: ai.isFreeModel,
          usedByok: ai.usedByok,
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
