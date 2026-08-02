/**
 * Browser-side client for local AI runtimes (Ollama / LM Studio).
 *
 * Runs in the USER's browser and talks to the runtime on THEIR machine at
 * localhost — inference never touches our server or any third-party
 * provider. The server still prepares Cat's context (via /api/cat/prepare)
 * and persists finished exchanges (via /api/cat/local-complete); only the
 * model call itself happens here.
 *
 * Client-only: every entry point no-ops safely during SSR.
 */

import { LOCAL_RUNTIMES, getLocalRuntime, type LocalRuntime } from '@/config/local-ai';

export interface LocalRuntimeStatus {
  runtime: LocalRuntime;
  reachable: boolean;
  /** Installed model ids, when reachable. */
  models: string[];
}

const PROBE_TIMEOUT_MS = 1500;

/** Probe one runtime: reachable + which models are installed. */
export async function probeLocalRuntime(runtime: LocalRuntime): Promise<LocalRuntimeStatus> {
  if (typeof window === 'undefined') {
    return { runtime, reachable: false, models: [] };
  }
  try {
    const res = await fetch(runtime.modelsUrl, {
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    if (!res.ok) {
      return { runtime, reachable: false, models: [] };
    }
    const body = (await res.json()) as { data?: Array<{ id?: string }> };
    const models = (body.data ?? [])
      .map(m => m.id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);
    return { runtime, reachable: true, models };
  } catch {
    return { runtime, reachable: false, models: [] };
  }
}

/** Probe all known runtimes concurrently. */
export function probeAllLocalRuntimes(): Promise<LocalRuntimeStatus[]> {
  return Promise.all(LOCAL_RUNTIMES.map(probeLocalRuntime));
}

// Chat panels open often; don't hammer localhost with probes on every open.
let probeCache: { at: number; statuses: LocalRuntimeStatus[] } | null = null;
const PROBE_CACHE_MS = 60_000;

export async function probeAllLocalRuntimesCached(): Promise<LocalRuntimeStatus[]> {
  if (probeCache && Date.now() - probeCache.at < PROBE_CACHE_MS) {
    return probeCache.statuses;
  }
  const statuses = await probeAllLocalRuntimes();
  probeCache = { at: Date.now(), statuses };
  return statuses;
}

export interface LocalChatParams {
  runtimeId: string;
  model: string;
  messages: Array<{ role: string; content: string }>;
  onChunk: (text: string) => void;
  signal?: AbortSignal;
}

/**
 * Stream a chat completion from the local runtime (OpenAI-compatible SSE).
 * Returns the full assistant reply. Throws on unreachable runtime — callers
 * surface that as a setup problem, not a Cat outage.
 */
export async function streamLocalChat({
  runtimeId,
  model,
  messages,
  onChunk,
  signal,
}: LocalChatParams): Promise<string> {
  const runtime = getLocalRuntime(runtimeId);
  if (!runtime) {
    throw new Error(`Unknown local runtime: ${runtimeId}`);
  }
  const res = await fetch(`${runtime.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: true }),
    signal,
  });
  if (!res.ok || !res.body) {
    throw new Error(`${runtime.name} returned HTTP ${res.status}`);
  }

  let full = '';
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) {
        continue;
      }
      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') {
        continue;
      }
      try {
        const json = JSON.parse(payload) as {
          choices?: Array<{ delta?: { content?: string } }>;
        };
        const chunk = json.choices?.[0]?.delta?.content;
        if (chunk) {
          full += chunk;
          onChunk(chunk);
        }
      } catch {
        // Partial/keepalive line — ignore.
      }
    }
  }
  return full;
}
