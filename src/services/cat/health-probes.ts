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
    'https://api.groq.com/openai/v1/chat/completions',
    'llama-3.1-8b-instant'
  );
}

export function probeOpenRouter(): Promise<ProbeResult> {
  return probeProvider(
    'openrouter',
    'OPENROUTER_API_KEY',
    'https://openrouter.ai/api/v1/chat/completions',
    'meta-llama/llama-3.3-70b-instruct:free'
  );
}

/** Probe both providers and summarize. */
export async function runCatHealthProbes(): Promise<CatHealthReport> {
  const [groq, openrouter] = await Promise.all([probeGroq(), probeOpenRouter()]);
  return {
    probes: { groq, openrouter },
    catCanAnswer: groq.class === 'ok' || openrouter.class === 'ok',
    summary:
      groq.class === 'ok'
        ? `Cat is healthy: ${groq.provider} probe returned OK.`
        : openrouter.class === 'ok'
          ? `Primary (${groq.provider}) is degraded (${groq.class}); fallback (${openrouter.provider}) is healthy.`
          : `Both providers are degraded: groq=${groq.class}, openrouter=${openrouter.class}.`,
  };
}
