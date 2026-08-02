/**
 * Cat Chat Orchestrator
 *
 * Owns the orchestration for POST /api/cat/chat so the route stays a thin
 * wrapper. Handles provider resolution, context fetching, memory recall,
 * prompt building, the tool/search pass, the model call with rate-limit
 * fallback chain, the streaming vs non-streaming responses, persistence, and
 * the detached memory-extraction step.
 *
 * Behavior is identical to the previous inline handler — streaming semantics
 * and the fire-and-forget `extractAndStoreMemories` detachment are preserved.
 */

import { z } from 'zod';
import { logger } from '@/utils/logger';
import { apiSuccess } from '@/lib/api/standardResponse';
import type { AuthenticatedRequest } from '@/lib/api/withAuth';
import { applyRateLimitHeaders, type RateLimitResult } from '@/lib/rate-limit';
import { buildCatSystemPrompt } from '@/services/cat/system-prompt';
import { getCustomInstructions } from '@/services/cat/custom-instructions';
import { buildReplyLanguageDirective } from '@/services/cat/reply-language';
import { getCatFewShotExamplesText } from '@/services/cat/few-shot-examples';
import { parseActionsFromResponse } from '@/services/cat/response-parser';
import {
  resolveConversationIdOrDefault,
  getMessagesForContext,
  saveMessages,
} from '@/services/cat/conversation-history';
import { resolveProvider, type FallbackProvider } from '@/services/cat/provider-resolver';
import { meterCreditUsage } from '@/services/cat/credit-metering';
import { getAdminClient } from '@/lib/supabase/admin';
import { recallMemories, extractAndStoreMemories } from '@/services/cat/memory';
import { extractAndStoreEconomicProfile } from '@/services/cat/economic-profile';
import {
  maybeEnrichWithSearchResults,
  messageMightNeedTools,
  type ToolAugmentedMessage,
  type ToolCallEvent,
  type PrefillProposal,
} from '@/services/cat/tool-use';
import { isAgenticModel } from '@/config/model-capability';
import { fetchFullContextForCat, buildFullContextString } from '@/services/ai/document-context';
import { createActionExecutor } from '@/services/cat';
import { getUserActorId } from '@/domain/actors';
import type { ExecAction, CatAction, ExecActionResult } from '@/types/cat';
import { AI_MESSAGE_MAX_CHARS } from '@/lib/validation/ai';
import { PAGE_EXCERPT_MAX_CHARS } from '@/config/cat-page-context';
import { markLinkDown } from '@/services/ai/link-health';

export const catChatBodySchema = z.object({
  message: z.string().min(1).max(AI_MESSAGE_MAX_CHARS),
  model: z.string().optional(),
  stream: z.boolean().optional(),
  /** Target conversation. Omitted → the user's default conversation. */
  conversationId: z.string().uuid().optional(),
  /**
   * Runtime session hints from the client. Optional and untrusted — the server
   * validates each field. Drive Cat's locale, price quoting, and recent-page
   * awareness. See RuntimeContext in document-context-types.ts.
   */
  preferredCurrency: z.string().max(8).optional(),
  locale: z.string().max(20).optional(),
  lastVisitedPath: z.string().max(200).optional(),
  /** The page the user is on right now (global Cat overlay), + its entity if any. */
  currentPath: z.string().max(200).optional(),
  currentEntity: z.object({ type: z.string().max(32), ref: z.string().max(120) }).optional(),
  /**
   * Verbatim excerpt of what's visible on the current page (client-captured,
   * capped at PAGE_EXCERPT_MAX_CHARS + ellipsis). Grounds "help me with this
   * page" in the real page instead of a guessed one.
   */
  pageExcerpt: z
    .string()
    .max(PAGE_EXCERPT_MAX_CHARS + 1)
    .optional(),
});

export type CatChatBody = z.infer<typeof catChatBodySchema>;

/**
 * Shown when the model finishes without producing ANY content. The client
 * renders an empty last assistant message as eternal typing dots (no error,
 * no reply — a "hang" to the user), so the stream must always deliver at
 * least one honest sentence.
 */
export const EMPTY_REPLY_FALLBACK =
  "I couldn't put together a reply to that. Could you rephrase or add a bit more detail?";

/**
 * Provider-agnostic rate-limit detection. Every AI provider error class we ship
 * (GroqAPIError, OpenRouterAPIError, OpenAICompatibleAPIError) carries a
 * `statusCode` field — 429 means rate limit, full stop. Some providers also
 * surface a `type: 'rate_limit'` discriminator. Check both first because
 * they're cheap and unambiguous; fall back to message-pattern matching.
 */
export function isAiRateLimitError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null) {
    const e = error as { statusCode?: number; type?: string };
    if (e.statusCode === 429) {
      return true;
    }
    if (e.type === 'rate_limit') {
      return true;
    }
  }

  // Message-pattern fallback. Different providers phrase rate-limit
  // messages differently — Groq says "rate limit" or "tokens per minute,"
  // OpenRouter says "rate-limited upstream," Together says "too many
  // requests" or "rate limit exceeded." Match all common variants.
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes('rate limit') ||
      msg.includes('rate-limit') ||
      msg.includes('ratelimit') ||
      msg.includes('tokens per minute') ||
      msg.includes('request too large') ||
      msg.includes('too many requests') ||
      msg.includes('429')
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Execute all exec_action blocks parsed from an AI response.
 * Actions with requiresConfirmation=true create pending actions in the DB.
 * Actions without confirmation run immediately.
 * Results are returned alongside the chat response for the client.
 */
async function runExecActions(
  supabase: AuthenticatedRequest['supabase'],
  userId: string,
  actorId: string | null,
  actions: CatAction[]
): Promise<ExecActionResult[]> {
  const execActions = actions.filter((a): a is ExecAction => a.type === 'exec_action');
  if (execActions.length === 0) {
    return [];
  }
  if (!actorId) {
    return execActions.map(a => ({
      actionId: a.actionId,
      status: 'failed' as const,
      error: 'User has no actor record',
    }));
  }

  const executor = createActionExecutor(supabase);
  const results: ExecActionResult[] = [];

  for (const action of execActions) {
    try {
      const result = await executor.executeAction(userId, actorId, {
        actionId: action.actionId,
        parameters: action.parameters,
      });
      // Extract displayMessage from handler data (handlers attach it as data.displayMessage)
      const handlerData = result.data as Record<string, unknown> | undefined;
      const displayMessage =
        typeof handlerData?.displayMessage === 'string' ? handlerData.displayMessage : undefined;
      results.push({
        actionId: action.actionId,
        status:
          result.status === 'completed'
            ? 'completed'
            : result.status === 'pending_confirmation'
              ? 'pending_confirmation'
              : 'failed',
        data: result.data,
        displayMessage,
        error: result.error,
        pendingActionId: result.pendingActionId,
      });
    } catch (err) {
      results.push({
        actionId: action.actionId,
        status: 'failed',
        error: err instanceof Error ? err.message : 'Execution error',
      });
    }
  }

  return results;
}

/**
 * Orchestrate a single Cat chat exchange and return the HTTP Response.
 *
 * The caller (route) has already authenticated, applied the rate limit, and
 * validated the body. This function runs the full pipeline and returns either
 * a streaming SSE Response or a buffered JSON Response — both with rate-limit
 * headers applied. The non-streaming path may throw; the route's outer catch
 * turns those into the appropriate error responses.
 */
export async function orchestrateCatChat(
  request: AuthenticatedRequest,
  body: CatChatBody,
  rl: RateLimitResult
): Promise<Response> {
  const { user, supabase } = request;
  const {
    message,
    model: requestedModel,
    stream,
    preferredCurrency,
    locale,
    lastVisitedPath,
    currentPath,
    currentEntity,
    pageExcerpt,
    conversationId: requestedConversationId,
  } = body;

  // Resolve provider, BYOK keys, model, and platform limits
  const resolved = await resolveProvider(supabase, user.id, request.headers, {
    requestedModel,
    message,
  });
  if (resolved instanceof Response) {
    return resolved;
  }
  const {
    provider,
    hasByok,
    modelToUse,
    aiService,
    platformUsage,
    keyService,
    userGroqKey,
    metered,
    fallbacks,
  } = resolved;

  // One stable id per request — the ledger idempotency ref for a metered
  // (credit-paid frontier) exchange.
  const meterRef = metered ? `cat_chat_${crypto.randomUUID()}` : null;

  // Resolve actor ID for exec_action execution
  const actorId = await getUserActorId(supabase, user.id);

  // Build context + history. Runtime hints flow client→server so Cat knows
  // currency, locale, and recent-page state for THIS exchange.
  //
  // Memory recall (an embedding round-trip + pgvector query) is INDEPENDENT of the
  // context fetch, so run both concurrently — recall no longer adds its latency to
  // every turn, it just has to beat the (already parallel) context fetchers. Recall
  // is best-effort: [] if memory is unavailable. Folded in near the top of the
  // context so the budget always keeps the durable facts.
  const [userContext, memories, customInstructions] = await Promise.all([
    fetchFullContextForCat(supabase, user.id, {
      preferredCurrency,
      locale,
      lastVisitedPath,
      currentPath,
      currentEntity,
      pageExcerpt,
    }),
    recallMemories(supabase, user.id, message),
    getCustomInstructions(supabase, user.id),
  ]);
  userContext.memories = memories;
  const contextString = buildFullContextString(userContext);

  // Does this message want more than chat (discovery, creation, multi-step)?
  // If so AND the answering model isn't agentic (frontier), we flag the
  // response so the UI can gently suggest upgrading to a more powerful model.
  // Uses the same signal that gates tool use — one source of truth.
  const wantsAgentic = messageMightNeedTools(message);
  // Examples are appended as labeled text (not injected as fake conversation
  // turns) so weaker models can't mistake the example people for the real user.
  // The per-turn reply-language directive goes DEAD LAST: weak free models
  // weight the prompt tail most, and burying the language rule mid-prompt let
  // them default to the browser locale's language (English in → German out).
  const systemPrompt = `${buildCatSystemPrompt({ userContext: contextString || undefined, customInstructions })}\n\n${getCatFewShotExamplesText()}${buildReplyLanguageDirective(message)}`;

  let conversationId: string | null = null;
  let historyMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  try {
    conversationId = await resolveConversationIdOrDefault(
      supabase,
      user.id,
      requestedConversationId
    );
    historyMessages = await getMessagesForContext(supabase, user.id, conversationId);
  } catch {
    /* Non-fatal — continue without history */
  }

  // Build message array: system (now includes example dialogues as text) +
  // real history + the user's message. No fake example turns in the array.
  const baseMessages: ToolAugmentedMessage[] = [
    { role: 'system', content: systemPrompt },
    ...historyMessages,
    { role: 'user', content: message },
  ];

  // ── Streaming ──────────────────────────────────────────────────────────────
  if (stream) {
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        // Lifted outside the try block so the catch at the bottom can
        // tell whether the failover attempt was reached (and which
        // provider/model was active when the chain died). Block-scoped
        // `let` inside the try is invisible to the outer catch.
        let attemptedFallback = false;
        let activeProvider = provider;
        let activeModel = modelToUse;
        let activeService = aiService;
        let activeIsPlatform = !hasByok;
        try {
          let usage:
            | {
                inputTokens?: number;
                outputTokens?: number;
                totalTokens?: number;
                costBtc?: number;
              }
            | undefined;
          let fullContent = '';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ model: modelToUse, provider })}\n\n`)
          );

          // Tool use happens INSIDE the stream so we can surface each
          // lifecycle event ('running' → completed/no_results/failed) to
          // the user in real time as `tool_call` SSE events. Prefill
          // proposals (the prefill_entity_form tool) emit a second event
          // type carrying the structured draft so the UI can render a
          // PrefilledFormCard instead of narrating field values as prose.
          const messages = await maybeEnrichWithSearchResults(
            supabase,
            user.id,
            baseMessages,
            message,
            provider,
            userGroqKey,
            modelToUse,
            (event: ToolCallEvent) => {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ tool_call: event })}\n\n`)
              );
            },
            (proposal: PrefillProposal) => {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ prefill_proposal: proposal })}\n\n`)
              );
            }
          );

          // After any content has streamed it's too late to swap providers
          // cleanly without corrupting the response, so we only failover
          // when nothing has been sent to the user yet.
          let streamStarted = false;

          const emitDone = async () => {
            // Completion guarantee: a model that finishes without emitting any
            // content (e.g. it tried to "call a tool" the main completion
            // doesn't have) would leave the client's last assistant bubble
            // empty — rendered as typing dots forever. Always send at least
            // one honest sentence before closing.
            if (!fullContent.trim()) {
              fullContent = EMPTY_REPLY_FALLBACK;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: fullContent })}\n\n`)
              );
            }
            const { actions, quickReplies } = parseActionsFromResponse(fullContent);
            const execResults = await runExecActions(supabase, user.id, actorId, actions);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ done: true, usage, model: activeModel, provider: activeProvider, actions: actions.length > 0 ? actions : undefined, execResults: execResults.length > 0 ? execResults : undefined, quickReplies, suggestUpgrade: wantsAgentic && !isAgenticModel(activeModel) })}\n\n`
              )
            );
          };

          const consumeStream = async () => {
            let doneEmitted = false;
            for await (const chunk of activeService.streamChatCompletion({
              model: activeModel,
              messages,
              temperature: 0.7,
            })) {
              if (chunk.usage) {
                usage = chunk.usage;
              }
              if (chunk.content) {
                streamStarted = true;
                fullContent += chunk.content;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ content: chunk.content })}\n\n`)
                );
              }
              if (chunk.done) {
                await emitDone();
                doneEmitted = true;
                break;
              }
            }
            // Provider stream ended without a done chunk — still finalize so
            // the client never waits on a reply that will never come.
            if (!doneEmitted) {
              await emitDone();
            }
          };

          // Walk the fallback chain on ANY pre-stream failure — rate-limit,
          // retired model id (404), upstream 5xx. A single dead link must
          // never end the chat while a later link could serve it. Each
          // provider gets one attempt. We can only swap providers BEFORE any
          // content streams — otherwise the client sees half a response and
          // then a switch.
          let lastErr: unknown = null;
          try {
            await consumeStream();
          } catch (err) {
            lastErr = err;
          }
          let fallbackIndex = 0;
          while (lastErr && !streamStarted && fallbackIndex < fallbacks.length) {
            attemptedFallback = true;
            const reason = isAiRateLimitError(lastErr) ? 'rate_limit' : 'provider_error';
            // Remember the dead PLATFORM link so the next message's chain
            // skips it for a minute instead of paying the failed round-trip
            // again. BYOK links are never marked — the user's own key failing
            // must not sideline the platform's identical provider+model.
            if (activeIsPlatform) {
              markLinkDown(activeProvider, activeModel);
            }
            const next = fallbacks[fallbackIndex++];
            activeIsPlatform = !next.hasByok;
            logger.warn(
              'Cat chat: provider failed, trying next fallback',
              {
                from: { provider: activeProvider, model: activeModel },
                to: { provider: next.provider, model: next.modelToUse },
                reason,
                err: lastErr,
                attempt: fallbackIndex,
              },
              'cat/chat'
            );
            activeProvider = next.provider;
            activeModel = next.modelToUse;
            activeService = next.aiService;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ fallback: { from: provider, to: activeProvider, model: activeModel, reason } })}\n\n`
              )
            );
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ model: activeModel, provider: activeProvider })}\n\n`
              )
            );
            try {
              await consumeStream();
              lastErr = null;
            } catch (nextErr) {
              lastErr = nextErr;
            }
          }
          if (lastErr) {
            if (activeIsPlatform) {
              markLinkDown(activeProvider, activeModel);
            }
            throw lastErr;
          }

          if (conversationId && fullContent) {
            saveMessages(supabase, conversationId, user.id, [
              { role: 'user', content: message },
              {
                role: 'assistant',
                content: fullContent,
                model_used: activeModel,
                provider: activeProvider,
                token_count: usage?.totalTokens,
              },
            ]).catch((err: unknown) => {
              logger.error('Failed to persist streaming messages', { err }, 'cat/chat');
            });
            // Learn durable facts from this exchange for future turns. Fully
            // best-effort and detached — never blocks or fails the response.
            void extractAndStoreMemories(
              supabase,
              user.id,
              conversationId,
              message,
              fullContent,
              activeService,
              activeModel
            );
            // Reliably populate the economic-profile store from the same exchange —
            // deterministic, not dependent on the chat model emitting an action.
            void extractAndStoreEconomicProfile(
              supabase,
              user.id,
              message,
              fullContent,
              activeService,
              activeModel
            );
          }
          if (metered && meterRef && usage?.totalTokens && activeModel === modelToUse) {
            // Credit-paid frontier exchange: debit the ledger for the model
            // that actually served. If a rate-limit fallback answered instead
            // (activeModel changed), the user is NOT billed.
            await meterCreditUsage(getAdminClient() as never, user.id, {
              model: activeModel,
              inputTokens: usage.inputTokens ?? 0,
              outputTokens: usage.outputTokens ?? 0,
              rawCostBtc: usage.costBtc,
              ref: meterRef,
              conversationId,
            });
          } else if (!hasByok && usage?.totalTokens) {
            await keyService.incrementPlatformUsage(user.id, 1, usage.totalTokens);
          }
        } catch (err) {
          logger.error(
            'Cat chat stream error',
            { err, attemptedFallback, hasByok, provider: activeProvider, model: activeModel },
            'cat/chat'
          );
          // Honest error copy. Never echo raw err.message — it can contain
          // API keys (e.g. a malformed Authorization header leaks the
          // credential in the Headers.append error). Log server-side;
          // return a structured, actionable error to the client. Only claim
          // what we actually know — "providers are down" when the real cause
          // was a config bug erodes trust and sends users chasing outages.
          let errPayload: { error: string; code: string };
          if (isAiRateLimitError(err)) {
            errPayload = {
              error: hasByok
                ? 'Your provider returned a rate-limit. Try again in a moment.'
                : 'Free AI capacity is maxed out right now. Try again in a minute — or add your own free Groq key in Settings → API Keys for capacity that’s all yours.',
              code: 'AI_RATE_LIMITED',
            };
          } else if (attemptedFallback) {
            // The whole chain threw — quota exhaustion, retired model ids,
            // or a revoked platform key. From the user's side the action is
            // the same; the details are in the server log either way.
            errPayload = {
              error: hasByok
                ? 'None of your providers could answer just now. Check your keys in Settings → API Keys, then try again.'
                : 'Cat couldn’t reach an AI model just now — this is usually momentary. Try again; if it keeps happening, add your own free Groq key in Settings → API Keys.',
              code: 'ALL_PROVIDERS_DOWN',
            };
          } else {
            errPayload = {
              error:
                'Cat couldn’t generate a response. Try again, or add your own key in Settings → API Keys.',
              code: 'STREAM_ERROR',
            };
          }
          controller.enqueue(encoder.encode(`event: error\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errPayload)}\n\n`));
        } finally {
          controller.close();
        }
      },
    });
    return applyRateLimitHeaders(
      new Response(readable, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      }) as any,
      rl
    );
  }

  // ── Non-streaming ──────────────────────────────────────────────────────────
  // Buffer tool calls + prefill proposals so the JSON response can carry
  // them alongside the answer.
  const collectedToolCalls: ToolCallEvent[] = [];
  const collectedPrefillProposals: PrefillProposal[] = [];
  const messages = await maybeEnrichWithSearchResults(
    supabase,
    user.id,
    baseMessages,
    message,
    provider,
    userGroqKey,
    modelToUse,
    (event: ToolCallEvent) => {
      collectedToolCalls.push(event);
    },
    (proposal: PrefillProposal) => {
      collectedPrefillProposals.push(proposal);
    }
  );
  // Try primary; on ANY failure (rate-limit, retired model id, upstream
  // 5xx), walk the fallback chain. Non-streaming is even safer than
  // streaming because each attempt is atomic — no partial-content
  // corruption risk to worry about.
  let activeProvider = provider;
  let result;
  let fellBackTo: FallbackProvider | null = null;
  let lastErr: unknown = null;
  try {
    result = await aiService.chatCompletion({
      model: modelToUse,
      messages,
      temperature: 0.7,
    });
  } catch (err) {
    lastErr = err;
  }
  let fallbackIndex = 0;
  let lastTried = { provider: provider as string, model: modelToUse, platform: !hasByok };
  while (!result && lastErr && fallbackIndex < fallbacks.length) {
    if (lastTried.platform) {
      markLinkDown(lastTried.provider, lastTried.model);
    }
    const next = fallbacks[fallbackIndex++];
    lastTried = { provider: next.provider, model: next.modelToUse, platform: !next.hasByok };
    logger.warn(
      'Cat chat (non-streaming): provider failed, trying next fallback',
      {
        from: provider,
        to: next.provider,
        model: next.modelToUse,
        reason: isAiRateLimitError(lastErr) ? 'rate_limit' : 'provider_error',
        err: lastErr,
        attempt: fallbackIndex,
      },
      'cat/chat'
    );
    try {
      result = await next.aiService.chatCompletion({
        model: next.modelToUse,
        messages,
        temperature: 0.7,
      });
      fellBackTo = next;
      activeProvider = next.provider;
      lastErr = null;
    } catch (nextErr) {
      lastErr = nextErr;
    }
  }
  if (!result) {
    if (lastTried.platform) {
      markLinkDown(lastTried.provider, lastTried.model);
    }
    throw lastErr ?? new Error('Cat chat: no AI provider produced a response');
  }

  if (metered && meterRef && !fellBackTo) {
    // Credit-paid frontier exchange (non-streaming): debit only when the
    // metered primary served — a fallback answer is a free-tier answer.
    await meterCreditUsage(getAdminClient() as never, user.id, {
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      rawCostBtc: result.costBtc,
      ref: meterRef,
      conversationId,
    });
  } else if (!hasByok) {
    await keyService.incrementPlatformUsage(user.id, 1, result.totalTokens);
  }

  // Same completion guarantee as the streaming path: never hand the client an
  // empty reply (it renders as a hang, not as an answer).
  const rawContent = result.content?.trim() ? result.content : EMPTY_REPLY_FALLBACK;
  const { message: cleanedMessage, actions, quickReplies } = parseActionsFromResponse(rawContent);
  const execResults = await runExecActions(supabase, user.id, actorId, actions);

  if (conversationId) {
    saveMessages(supabase, conversationId, user.id, [
      { role: 'user', content: message },
      {
        role: 'assistant',
        content: cleanedMessage,
        model_used: result.model,
        provider: activeProvider,
        token_count: result.totalTokens,
      },
    ]).catch((err: unknown) => {
      logger.error('Failed to persist messages', { err }, 'cat/chat');
    });
    // Learn durable facts from this exchange (best-effort, detached).
    void extractAndStoreMemories(
      supabase,
      user.id,
      conversationId,
      message,
      cleanedMessage,
      fellBackTo?.aiService ?? aiService,
      fellBackTo?.modelToUse ?? modelToUse
    );
    void extractAndStoreEconomicProfile(
      supabase,
      user.id,
      message,
      cleanedMessage,
      fellBackTo?.aiService ?? aiService,
      fellBackTo?.modelToUse ?? modelToUse
    );
  }

  return applyRateLimitHeaders(
    apiSuccess({
      message: cleanedMessage,
      actions: actions.length > 0 ? actions : undefined,
      quickReplies,
      execResults: execResults.length > 0 ? execResults : undefined,
      toolCalls: collectedToolCalls.length > 0 ? collectedToolCalls : undefined,
      prefillProposals:
        collectedPrefillProposals.length > 0 ? collectedPrefillProposals : undefined,
      modelUsed: result.model,
      provider: activeProvider,
      suggestUpgrade: wantsAgentic && !isAgenticModel(fellBackTo?.modelToUse ?? modelToUse),
      fallback: fellBackTo
        ? {
            from: provider,
            to: fellBackTo.provider,
            model: fellBackTo.modelToUse,
            reason: 'rate_limit',
          }
        : undefined,
      usage: {
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        totalTokens: result.totalTokens,
        apiCostBtc: result.costBtc || 0,
        isFreeModel: result.isFreeModel,
        usedByok: result.usedByok,
      },
      userStatus: {
        hasByok,
        freeMessagesPerDay: platformUsage?.daily_limit ?? 0,
        freeMessagesRemaining: platformUsage?.requests_remaining ?? 0,
      },
    }),
    rl
  );
}
