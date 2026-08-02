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
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const OPENROUTER_MODEL = DEFAULT_FREE_MODEL_ID;

export interface PlatformJsonOpts {
  temperature?: number;
  maxTokens?: number;
  /** Long-form (article bodies): prefer OpenRouter for a larger output budget. */
  longform?: boolean;
}

interface Provider {
  url: string;
  model: string;
  apiKey: string;
  isOpenRouter: boolean;
}

function resolveProvider(_longform: boolean): Provider | null {
  const groqKey = process.env.GROQ_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  // Prefer Groq — it's the verified-working provider on the box (fast, handles
  // long-form JSON within the free TPM budget). OpenRouter is a fallback only:
  // its free model IDs rot and 404 (both gpt-oss-120b:free and llama-4-maverick:free
  // returned 404 in prod), so never route to it when Groq is available.
  if (groqKey) {
    return {
      url: `${PROVIDER_BASE_URLS.groq}/chat/completions`,
      model: GROQ_MODEL,
      apiKey: groqKey,
      isOpenRouter: false,
    };
  }
  if (openRouterKey) {
    return openRouter(openRouterKey, OPENROUTER_MODEL);
  }
  return null;
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
  const provider = resolveProvider(!!opts.longform);
  if (!provider) {
    logger.warn('platform-llm: no platform AI key configured', {}, 'PlatformLLM');
    return null;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${provider.apiKey}`,
  };
  if (provider.isOpenRouter) {
    headers['HTTP-Referer'] = process.env.NEXT_PUBLIC_APP_URL || 'https://orangecat.ch';
  }

  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
  const maxTokens = opts.maxTokens ?? (opts.longform ? 3000 : 1400);
  const temperature = opts.temperature ?? 0.6;

  const call = (jsonMode: boolean) =>
    fetch(provider.url, {
      method: 'POST',
      headers,
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
      logger.warn(
        'platform-llm: json-mode call failed, retrying without response_format',
        { status: response.status, model: provider.model },
        'PlatformLLM'
      );
      response = await call(false);
    }
    if (!response.ok) {
      logger.warn('platform-llm: model call failed', { status: response.status }, 'PlatformLLM');
      return null;
    }
    const json = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    return json.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    logger.warn('platform-llm: model call threw', { err: String(err) }, 'PlatformLLM');
    return null;
  }
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
