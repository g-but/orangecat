/**
 * Shared platform-LLM call for structured (JSON) Cat features. Mirrors the
 * provider selection the offer-engine established (Groq preferred for short/fast
 * work, OpenRouter free pool for long-form) and returns the raw model content
 * string, or null on any failure so callers degrade gracefully.
 *
 * Free-pool only — needs GROQ_API_KEY and/or OPENROUTER_API_KEY on the box
 * (already set; platform Cat runs on them). Never touches Cat Credits / NWC.
 */

import { logger } from '@/utils/logger';
import { PROVIDER_BASE_URLS } from '@/config/ai-provider-runtime';
import { DEFAULT_FREE_MODEL_ID } from '@/config/ai-models';

// Capable, JSON-reliable defaults. Groq is fast + cheap for short work; the
// registry's free OpenRouter default is the fallback. Free model ids rot —
// the pinned llama-4-maverick:free this file once carried 404'd too. The
// registry is now the one place ids live, guarded by the free-model catalog
// probe (health-probes.ts), so drift is detected there instead of re-pinned
// here.
/**
 * Groq's general-purpose model.
 *
 * `llama-3.3-70b-versatile` was pinned here and STOPPED BEING SERVED. Groq
 * answered 404 for it, every callPlatformJson caller returned null, and because
 * the failure was logged at warn and swallowed by callers that "degrade
 * gracefully", eight features degraded gracefully into doing nothing: the offer
 * engine, both writing engines, prompt suggestions, platform feedback, image
 * suggestions, the voice intent router, and the Cat's replies. Verified against
 * the live API on 2026-08-26 — Groq served 14 models and that was not among
 * them.
 *
 * Model ids rot. This is the fifth time in this fleet, and the comment below
 * already said so about OpenRouter. The durable answer is not a better id, it
 * is the failover underneath and `npm run check:ai-models`, which asks each
 * provider whether it still serves what we pinned.
 */
const GROQ_MODEL = 'openai/gpt-oss-120b';
const OPENROUTER_MODEL = DEFAULT_FREE_MODEL_ID;

export interface PlatformJsonOpts {
  temperature?: number;
  maxTokens?: number;
  /** Long-form (article bodies): prefer OpenRouter for a larger output budget. */
  longform?: boolean;
  /**
   * Abort after this many ms. Set it on anything a user is waiting behind — the
   * free pool has no latency guarantee, and callers here all degrade gracefully
   * to a null return. Omitted = wait indefinitely (background/batch callers).
   */
  timeoutMs?: number;
}

interface Provider {
  url: string;
  model: string;
  apiKey: string;
  isOpenRouter: boolean;
}

/**
 * Providers to try, in order.
 *
 * Groq first — fast, and handles long-form JSON inside the free TPM budget.
 * OpenRouter after it, and that ORDERING IS NOT THE POINT: what matters is that
 * there is a second entry at all. This used to return the FIRST provider whose
 * key existed and stop, so when Groq's pinned model stopped being served there
 * was no path out — a dead id took every platform-LLM feature down with it and
 * OpenRouter sat there configured and unused.
 */
function resolveProviders(): Provider[] {
  const providers: Provider[] = [];
  const groqKey = process.env.GROQ_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  if (groqKey) {
    providers.push({
      url: `${PROVIDER_BASE_URLS.groq}/chat/completions`,
      model: GROQ_MODEL,
      apiKey: groqKey,
      isOpenRouter: false,
    });
  }
  if (openRouterKey) {
    providers.push(openRouter(openRouterKey, OPENROUTER_MODEL));
  }
  return providers;
}

function openRouter(apiKey: string, model: string): Provider {
  return {
    url: `${PROVIDER_BASE_URLS.openrouter}/chat/completions`,
    model,
    apiKey,
    isOpenRouter: true,
  };
}

/**
 * Call the platform LLM with a system+user prompt and JSON response mode.
 * Returns the raw content string (expected to be JSON) or null.
 */
export async function callPlatformJson(
  system: string,
  user: string,
  opts: PlatformJsonOpts = {}
): Promise<string | null> {
  const providers = resolveProviders();
  if (providers.length === 0) {
    logger.warn('platform-llm: no platform AI key configured', {}, 'PlatformLLM');
    return null;
  }

  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
  const maxTokens = opts.maxTokens ?? (opts.longform ? 3000 : 1400);
  const temperature = opts.temperature ?? 0.6;

  let lastStatus: number | null = null;

  for (const provider of providers) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.apiKey}`,
    };
    if (provider.isOpenRouter) {
      headers['HTTP-Referer'] = process.env.NEXT_PUBLIC_APP_URL || 'https://orangecat.ch';
    }

    const call = (jsonMode: boolean) =>
      fetch(provider.url, {
        method: 'POST',
        headers,
        ...(opts.timeoutMs ? { signal: AbortSignal.timeout(opts.timeoutMs) } : {}),
        body: JSON.stringify({
          model: provider.model,
          messages,
          temperature,
          max_tokens: maxTokens,
          ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
        }),
      });

    try {
      // Some free models 400 on response_format — retry once without it and lean
      // on parseJsonLoose (the system prompt already demands JSON-only output).
      let response = await call(true);
      if (!response.ok) {
        response = await call(false);
      }

      if (response.ok) {
        const json = (await response.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        return json.choices?.[0]?.message?.content ?? null;
      }

      lastStatus = response.status;
      // 404 means the model id no longer exists, which is a CONFIGURATION fault
      // rather than a hiccup: it will fail identically until someone changes the
      // constant. warn was too quiet — it degraded eight features to silence for
      // as long as nobody read the logs.
      if (response.status === 404) {
        logger.error(
          'platform-llm: model no longer served — the pinned id has rotted',
          { model: provider.model, provider: provider.isOpenRouter ? 'openrouter' : 'groq' },
          'PlatformLLM'
        );
      } else {
        logger.warn(
          'platform-llm: model call failed',
          { status: response.status, model: provider.model },
          'PlatformLLM'
        );
      }
    } catch (err) {
      logger.warn(
        'platform-llm: model call threw',
        { err: String(err), model: provider.model },
        'PlatformLLM'
      );
    }
    // Fall through to the next provider.
  }

  logger.error(
    'platform-llm: every provider failed',
    { providers: providers.length, lastStatus },
    'PlatformLLM'
  );
  return null;
}

/**
 * Defensive JSON parse for model output: tolerates ```json fences and leading
 * prose by extracting the first balanced object/array. Returns null on failure.
 */
export function parseJsonLoose<T = unknown>(raw: string | null): T | null {
  if (!raw) {
    return null;
  }
  const cleaned = raw
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Fall back to the first {...} or [...] span.
    const match = cleaned.match(/[[{][\s\S]*[\]}]/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        /* fall through */
      }
    }
    return null;
  }
}
