/**
 * Cat health probes — live "is the AI layer up?" checks.
 *
 * Hits each configured provider with a minimal ping and classifies the result.
 * Shared by the GET /api/cat/diagnose route AND the Cat's own check_cat_health
 * tool, so the Cat can answer "why isn't my Cat working?" / "what does this
 * provider-failure notification mean?" with live data instead of pointing the
 * user at server logs.
 *
 * No keys, no auth headers, no Bearer strings are ever echoed back — every
 * result is safe to surface to an authenticated user (and to the model).
 */

import { PROVIDER_BASE_URLS } from '@/config/ai-provider-runtime';
import { DEFAULT_FREE_MODEL_ID, getFreeModels } from '@/config/ai-models';

export type ProbeClass =
  | 'ok'
  | 'rate_limit'
  | 'auth'
  | 'no_key'
  | 'invalid_key'
  | 'upstream_err'
  | 'no_response';

export interface ProbeResult {
  provider: 'groq' | 'openrouter';
  configured: boolean;
  status: number | null;
  class: ProbeClass;
  /** Short text from the upstream error, safe to display. */
  message: string | null;
  /** Header-safe: did the key contain whitespace or control chars (paste artifact)? */
  keyHadJunkChars: boolean;
}

export interface CatHealthReport {
  probes: { groq: ProbeResult; openrouter: ProbeResult };
  /**
   * Registry free-model ids missing from the live OpenRouter catalog
   * (model rot). Empty = no drift; null = catalog check unavailable.
   */
  missingFreeModels: string[] | null;
  catCanAnswer: boolean;
  summary: string;
}

function sanitizeApiKey(key: string): { clean: string; hadJunk: boolean } {
  const clean = key.replace(/[\s\x00-\x1f\x7f]+/g, '');
  return { clean, hadJunk: clean !== key };
}

async function probeProvider(
  provider: 'groq' | 'openrouter',
  envVar: string,
  endpoint: string,
  model: string
): Promise<ProbeResult> {
  const raw = process.env[envVar];
  if (!raw) {
    return {
      provider,
      configured: false,
      status: null,
      class: 'no_key',
      message: `${envVar} env var not set`,
      keyHadJunkChars: false,
    };
  }
  const { clean, hadJunk } = sanitizeApiKey(raw);
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${clean}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5,
        temperature: 0,
      }),
    });
    if (res.ok) {
      return {
        provider,
        configured: true,
        status: res.status,
        class: 'ok',
        message: null,
        keyHadJunkChars: hadJunk,
      };
    }
    const body = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    const upstreamMessage = body?.error?.message ?? `HTTP ${res.status}`;
    let cls: ProbeClass = 'upstream_err';
    if (res.status === 429) {
      cls = 'rate_limit';
    } else if (res.status === 401 || res.status === 403) {
      cls = 'auth';
    }
    return {
      provider,
      configured: true,
      status: res.status,
      class: cls,
      message: upstreamMessage,
      keyHadJunkChars: hadJunk,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'fetch failed';
    // Treat header-construction errors as invalid_key — these are the
    // paste-artifact bugs (newline / weird trailing char in the env var).
    const cls: ProbeClass = errMsg.includes('Headers.append') ? 'invalid_key' : 'no_response';
    return {
      provider,
      configured: true,
      status: null,
      class: cls,
      message: cls === 'invalid_key' ? 'Authorization header is malformed' : errMsg,
      keyHadJunkChars: hadJunk,
    };
  }
}

export function probeGroq(): Promise<ProbeResult> {
  return probeProvider(
    'groq',
    'GROQ_API_KEY',
    `${PROVIDER_BASE_URLS.groq}/chat/completions`,
    'llama-3.1-8b-instant'
  );
}

export function probeOpenRouter(): Promise<ProbeResult> {
  // Probe with the registry's platform default — a hardcoded id here once
  // drifted from the registry and kept "passing" while chat 404'd (and later
  // kept "failing" after the registry was fixed).
  return probeProvider(
    'openrouter',
    'OPENROUTER_API_KEY',
    `${PROVIDER_BASE_URLS.openrouter}/chat/completions`,
    DEFAULT_FREE_MODEL_ID
  );
}

/**
 * Registry-vs-catalog drift check. OpenRouter retires free models without
 * notice; a registry entry pointing at a retired id makes chat 404 mid-chain.
 * This has bitten prod three times (gpt-oss-120b:free, llama-4-maverick:free,
 * then llama-3.3-70b-instruct:free + llama-4-scout:free on 2026-08-02) —
 * hence a standing probe instead of a fourth manual fix. Uses the public
 * /models endpoint (no key needed). Returns the registry free-model ids that
 * no longer exist upstream; empty array = no drift; null = catalog fetch
 * failed (unknown, not necessarily broken).
 */
export async function probeFreeModelCatalog(): Promise<string[] | null> {
  try {
    const res = await fetch(`${PROVIDER_BASE_URLS.openrouter}/models`);
    if (!res.ok) {
      return null;
    }
    const body = (await res.json()) as { data?: Array<{ id?: string }> };
    const live = new Set((body.data ?? []).map(m => m.id));
    if (live.size === 0) {
      return null;
    }
    return getFreeModels()
      .map(m => m.id)
      .filter(id => !live.has(id));
  } catch {
    return null;
  }
}

/** Probe both providers and summarize. */
export async function runCatHealthProbes(): Promise<CatHealthReport> {
  const [groq, openrouter, missingFreeModels] = await Promise.all([
    probeGroq(),
    probeOpenRouter(),
    probeFreeModelCatalog(),
  ]);
  const drift =
    missingFreeModels && missingFreeModels.length > 0
      ? ` ⚠️ Registry free models no longer on OpenRouter: ${missingFreeModels.join(', ')} — update src/config/ai-models.ts.`
      : '';
  return {
    probes: { groq, openrouter },
    missingFreeModels,
    catCanAnswer: groq.class === 'ok' || openrouter.class === 'ok',
    summary:
      (groq.class === 'ok'
        ? `Cat is healthy: ${groq.provider} probe returned OK.`
        : openrouter.class === 'ok'
          ? `Primary (${groq.provider}) is degraded (${groq.class}); fallback (${openrouter.provider}) is healthy.`
          : `Both providers are degraded: groq=${groq.class}, openrouter=${openrouter.class}.`) +
      drift,
  };
}
