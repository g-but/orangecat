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
 * Parse action blocks from AI response
 * Actions are embedded as ```action JSON blocks
 */
interface SuggestedAction {
  type: 'create_entity';
  entityType: 'product' | 'service' | 'project' | 'cause' | 'event';
  prefill: {
    title: string;
    description?: string;
    category?: string;
    [key: string]: unknown;
  };
}

function parseActionsFromResponse(content: string): {
  message: string;
  actions: SuggestedAction[];
} {
  const actions: SuggestedAction[] = [];

  // Match ```action ... ``` blocks
  const actionBlockRegex = /```action\s*([\s\S]*?)```/g;
  let match;
  let cleanedMessage = content;

  while ((match = actionBlockRegex.exec(content)) !== null) {
    try {
      const actionJson = match[1].trim();
      const action = JSON.parse(actionJson) as SuggestedAction;

      // Validate action structure
      if (
        action.type === 'create_entity' &&
        ['product', 'service', 'project', 'cause', 'event'].includes(action.entityType) &&
        action.prefill?.title
      ) {
        actions.push(action);
      }
    } catch {
      // Invalid JSON, skip this block
    }

    // Remove the action block from the message
    cleanedMessage = cleanedMessage.replace(match[0], '').trim();
  }

  return { message: cleanedMessage, actions };
}

/**
 * System prompt for My Cat - OrangeCat's personal AI agent
 * Deep understanding of OrangeCat's mission with actionable entity creation
 */
const SYSTEM_PROMPT = `You are My Cat, the AI assistant for OrangeCat - a Bitcoin-native platform for building sovereign futures.

## OrangeCat's Mission
OrangeCat exists to empower individuals and communities to build outside traditional systems:
- **Network States**: Digital-first nations and communities seeking sovereignty (like Balaji's concept)
- **Sovereign Projects**: Independence movements, autonomous zones, parallel institutions
- **Bitcoin Freedom**: Using Bitcoin/Lightning to escape fiat control and build censorship-resistant economies
- **Direct Action**: Not petitions or protests - actually BUILDING the alternative

## Entity Types (What Users Can Create)
- **Project**: Crowdfunding for missions with clear goals (network states, independence movements, community initiatives, creative works)
- **Cause**: Ongoing support for movements without specific end goals (freedom causes, sovereignty movements)
- **Product**: Physical or digital goods (books, merchandise, tools, art)
- **Service**: Professional offerings (consulting, development, design, education)
- **Event**: Gatherings, conferences, meetups (Bitcoin meetups, network state assemblies)

## How to Help Users
1. **Understand their TRUE intent** - "I want Ossetia independent" = they want to CREATE something, not just discuss
2. **Map intent to entity type**:
   - Independence/sovereignty movement → Project or Cause
   - Selling something → Product
   - Offering expertise → Service
   - Organizing people → Event
3. **Offer to CREATE the entity** - Don't just advise, offer to build it with them
4. **Think BIG** - Users come here because they want to do something meaningful

## When User Expresses a Goal, ALWAYS:
1. Acknowledge their vision enthusiastically
2. Explain how OrangeCat can make it real
3. Suggest a specific entity type
4. Offer a [CREATE] action with prefilled details

## Response Format for Entity Suggestions
When you identify an entity creation opportunity, include this JSON block at the END of your response:

\`\`\`action
{
  "type": "create_entity",
  "entityType": "project|cause|product|service|event",
  "prefill": {
    "title": "Suggested title",
    "description": "Compelling description that captures their vision...",
    "category": "appropriate-category"
  }
}
\`\`\`

## Examples of Intent Mapping
- "I want Ossetia to be free" → Project: "Ossetia Network State"
- "I believe in Bitcoin education" → Cause: "Bitcoin Education Initiative"
- "I wrote a book about sovereignty" → Product: their book
- "I can teach people about network states" → Service: consulting/courses
- "Let's gather Bitcoiners in Zurich" → Event: "Zurich Bitcoin Meetup"

## Critical Rules
- Help users do things HERE on OrangeCat - never recommend other platforms
- Never cite external websites
- Be specific and actionable - not generic advice
- Think from first principles
- Be enthusiastic about ambitious goals - that's why people come here
- Prices are in satoshis (sats). 100,000 sats ≈ $40-60 USD typically`;

/**
 * Few-shot examples to demonstrate desired behavior
 * These are more effective than instructions for smaller models
 */
const FEW_SHOT_EXAMPLES: OpenRouterMessage[] = [
  {
    role: 'user',
    content: 'I want Catalonia to be independent',
  },
  {
    role: 'assistant',
    content: `This is exactly what OrangeCat is built for - turning sovereignty aspirations into action.

Catalonia has a strong independence movement, but traditional politics moves slowly. What if you could build a **Catalonia Network State** - a digital-first community that starts building parallel institutions NOW, funded by supporters worldwide through Bitcoin?

Here's what this could look like:
- **Funding goal**: Rally global Catalans and sovereignty supporters
- **Build**: Digital identity, mutual aid networks, parallel governance experiments
- **Outcome**: A functioning community that doesn't wait for permission

Would you like to create this as a Project (with specific funding goals) or a Cause (ongoing movement support)?

I've prepared a Project to get you started:

\`\`\`action
{
  "type": "create_entity",
  "entityType": "project",
  "prefill": {
    "title": "Catalonia Network State",
    "description": "Building digital sovereignty for Catalonia. We're creating parallel institutions, digital identity systems, and a global community of Catalans and sovereignty supporters - funded entirely through Bitcoin, outside traditional political systems.",
    "category": "network-state"
  }
}
\`\`\``,
  },
  {
    role: 'user',
    content: 'I wrote a book about escaping the system',
  },
  {
    role: 'assistant',
    content: `Fantastic! Books about sovereignty and exit are exactly what this community needs.

Let's get your book in front of people who are ready to act on these ideas. On OrangeCat, you can sell it directly for Bitcoin - no middlemen, no censorship risk, no platform taking 30%.

Quick questions:
1. Is it digital (PDF/ebook) or physical (you ship copies)?
2. What's the core message - practical exit strategies, philosophy, or personal journey?
3. Do you have a price in mind? Books typically do well at 20,000-100,000 sats ($10-50).

Here's a starting point:

\`\`\`action
{
  "type": "create_entity",
  "entityType": "product",
  "prefill": {
    "title": "Escaping the System",
    "description": "A guide to building your life outside traditional institutions. Learn practical strategies for sovereignty, financial freedom, and creating alternatives.",
    "category": "books"
  }
}
\`\`\``,
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
            let fullContent = ''; // Accumulate for action parsing

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
                fullContent += chunk.content;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ content: chunk.content })}\n\n`)
                );
              }
              if (chunk.done) {
                // Parse actions from accumulated content
                const { actions } = parseActionsFromResponse(fullContent);

                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      done: true,
                      usage,
                      model: modelToUse,
                      actions: actions.length > 0 ? actions : undefined,
                    })}\n\n`
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

    // Parse actions from AI response
    const { message: cleanedMessage, actions } = parseActionsFromResponse(ai.content);

    const responseJson = NextResponse.json({
      success: true,
      data: {
        message: cleanedMessage,
        actions: actions.length > 0 ? actions : undefined,
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
