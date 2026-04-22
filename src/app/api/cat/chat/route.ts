/**
 * My Cat - Private Chat API
 *
 * POST /api/cat/chat - Ephemeral AI response with model selection
 * - Uses OpenRouter with BYOK if available; otherwise platform key
 * - For non-BYOK users, restricts to free models and checks daily platform usage
 * - Does not persist any conversation content
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest } from 'next/server';
import { logger } from '@/utils/logger';
import {
  apiBadRequest,
  apiError,
  apiSuccess,
  apiInternalError,
} from '@/lib/api/standardResponse';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { z } from 'zod';
import { GroqAPIError } from '@/services/ai';
import { applyRateLimitHeaders, type RateLimitResult } from '@/lib/rate-limit';
import { enforceUserWriteLimit, RateLimitError } from '@/lib/api/rateLimiting';
import { buildCatSystemPrompt } from '@/services/cat/system-prompt';
import { getCatFewShotExamples } from '@/services/cat/few-shot-examples';
import { parseActionsFromResponse } from '@/services/cat/response-parser';
import {
  getOrCreateDefaultConversation,
  getMessagesForContext,
  saveMessages,
} from '@/services/cat/conversation-history';
import { resolveProvider } from '@/services/cat/provider-resolver';
import { maybeEnrichWithSearchResults } from '@/services/cat/tool-use';
import { fetchFullContextForCat, buildFullContextString } from '@/services/ai/document-context';

const bodySchema = z.object({
  message: z.string().min(1).max(10000),
  model: z.string().optional(),
  stream: z.boolean().optional(),
});

function isAiRateLimitError(error: unknown): boolean {
  if (error instanceof GroqAPIError) {
    if (error.type === 'rate_limit' || error.statusCode === 429) {return true;}
    const msg = error.message.toLowerCase();
    if (msg.includes('request too large') || msg.includes('rate limit') || msg.includes('tokens per minute')) {return true;}
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('request too large') || msg.includes('rate limit') || msg.includes('tokens per minute')) {return true;}
  }
  return false;
}

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  const { user, supabase } = request;
  try {
    // Rate limit (write-tier reused for chat to prevent abuse)
    let rl: RateLimitResult;
    try {
      rl = await enforceUserWriteLimit(user.id);
    } catch (e) {
      if (e instanceof RateLimitError) {
        const retryAfter = e.details?.retryAfter || 60;
        const limit = e.details?.limit || 30;
        const resetTime = Date.now() + retryAfter * 1000;
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded', code: 'RATE_LIMIT_EXCEEDED', limit, remaining: 0, resetTime, resetDate: new Date(resetTime).toUTCString() }),
          { status: 429, headers: { 'Content-Type': 'application/json', 'X-RateLimit-Limit': String(limit), 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': String(resetTime), 'Retry-After': String(retryAfter) } }
        );
      }
      throw e;
    }

    const body = await (request as NextRequest).json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {return apiBadRequest('Invalid request', parsed.error.flatten());}

    const { message, model: requestedModel, stream } = parsed.data;

    // Resolve provider, BYOK keys, model, and platform limits
    const resolved = await resolveProvider(supabase, user.id, request.headers, { requestedModel, message });
    if (resolved instanceof Response) {return resolved;}
    const { provider, hasByok, modelToUse, aiService, platformUsage, keyService, userGroqKey } = resolved;

    // Build context + history
    const userContext = await fetchFullContextForCat(supabase, user.id);
    const contextString = buildFullContextString(userContext);
    const systemPrompt = buildCatSystemPrompt({ userContext: contextString || undefined });

    let conversationId: string | null = null;
    let historyMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    try {
      conversationId = await getOrCreateDefaultConversation(supabase, user.id);
      historyMessages = await getMessagesForContext(supabase, user.id);
    } catch { /* Non-fatal — continue without history */ }

    // Build message array: system + few-shots + history + user message
    let messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...getCatFewShotExamples(),
      ...historyMessages,
      { role: 'user', content: message },
    ];

    // Tool use: optionally enrich with platform search results (Groq only)
    messages = await maybeEnrichWithSearchResults(supabase, messages, message, provider, userGroqKey, modelToUse);

    // ── Streaming ──────────────────────────────────────────────────────────────
    if (stream) {
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            let usage: { inputTokens?: number; outputTokens?: number; totalTokens?: number } | undefined;
            let fullContent = '';
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ model: modelToUse, provider })}\n\n`));

            for await (const chunk of aiService.streamChatCompletion({ model: modelToUse, messages, temperature: 0.7 })) {
              if (chunk.usage) {usage = chunk.usage;}
              if (chunk.content) {
                fullContent += chunk.content;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk.content })}\n\n`));
              }
              if (chunk.done) {
                const { actions } = parseActionsFromResponse(fullContent);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, usage, model: modelToUse, provider, actions: actions.length > 0 ? actions : undefined })}\n\n`));
                break;
              }
            }

            if (conversationId && fullContent) {
              saveMessages(supabase, conversationId, user.id, [
                { role: 'user', content: message },
                { role: 'assistant', content: fullContent, model_used: modelToUse, provider, token_count: usage?.totalTokens },
              ]).catch((err: unknown) => { logger.error('Failed to persist streaming messages', { err }, 'cat/chat'); });
            }
            if (!hasByok && usage?.totalTokens) {
              await keyService.incrementPlatformUsage(user.id, 1, usage.totalTokens);
            }
          } catch (err) {
            const errPayload = isAiRateLimitError(err)
              ? { error: 'AI is temporarily busy. Please try again in a minute.', code: 'AI_RATE_LIMITED' }
              : { error: err instanceof Error ? err.message : 'stream_error' };
            controller.enqueue(encoder.encode(`event: error\n`));
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(errPayload)}\n\n`));
          } finally {
            controller.close();
          }
        },
      });
      return applyRateLimitHeaders(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        new Response(readable, { status: 200, headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' } }) as any,
        rl
      );
    }

    // ── Non-streaming ──────────────────────────────────────────────────────────
    const result = await aiService.chatCompletion({ model: modelToUse, messages, temperature: 0.7 });

    if (!hasByok) {
      await keyService.incrementPlatformUsage(user.id, 1, result.totalTokens);
    }

    const { message: cleanedMessage, actions } = parseActionsFromResponse(result.content);

    if (conversationId) {
      saveMessages(supabase, conversationId, user.id, [
        { role: 'user', content: message },
        { role: 'assistant', content: cleanedMessage, model_used: result.model, provider, token_count: result.totalTokens },
      ]).catch((err: unknown) => { logger.error('Failed to persist messages', { err }, 'cat/chat'); });
    }

    return applyRateLimitHeaders(
      apiSuccess({
        message: cleanedMessage,
        actions: actions.length > 0 ? actions : undefined,
        modelUsed: result.model,
        provider,
        usage: { inputTokens: result.inputTokens, outputTokens: result.outputTokens, totalTokens: result.totalTokens, apiCostBtc: result.costBtc || 0, isFreeModel: result.isFreeModel, usedByok: result.usedByok },
        userStatus: { hasByok, freeMessagesPerDay: platformUsage?.daily_limit ?? 0, freeMessagesRemaining: platformUsage?.requests_remaining ?? 0 },
      }),
      rl
    );
  } catch (error) {
    if (isAiRateLimitError(error)) {
      return apiError('AI is temporarily busy. Please try again in a minute.', 'AI_RATE_LIMITED', 429);
    }
    logger.error('Cat chat unhandled error', error, 'CatChatAPI');
    return apiInternalError('An unexpected error occurred. Please try again.');
  }
});
