#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * check-ai-models.mjs — every pinned model id must still be served.
 *
 * A model id is a string in a constant. Nothing type-checks it, nothing tests
 * it, and providers retire models on their own schedule — so the id keeps
 * compiling long after it stops existing, and the only symptom is a 404 inside
 * a caller written to "degrade gracefully".
 *
 * That is not hypothetical and it is not the first time. On 2026-08-26 Groq had
 * stopped serving `llama-3.3-70b-versatile`, which platform-llm.ts pinned. Every
 * callPlatformJson caller returned null: the offer engine, both writing engines,
 * prompt suggestions, platform feedback, image suggestions, the voice intent
 * router, and the Cat's replies. Eight features degraded gracefully into doing
 * nothing at all, and the log line for it was a `warn`.
 *
 * WHY THIS IS NOT IN `verify`
 * It needs the network and a provider key, and a gate that goes red when an API
 * hiccups is a gate that gets disabled. Run it where the keys live:
 *
 *   npm run check:ai-models          # uses .env.local / the environment
 *
 * With no key for a provider it SKIPS that provider and says so — loudly enough
 * that a skip cannot be mistaken for a pass, which is the failure mode this
 * whole class of check keeps falling into.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;

/** Read an env var, falling back to .env.local so this runs from a worktree. */
function env(key) {
  if (process.env[key]) {
    return process.env[key];
  }
  try {
    const text = readFileSync(join(ROOT, '.env.local'), 'utf8');
    return text.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1]?.trim();
  } catch {
    return undefined;
  }
}

const GROQ = { keyName: 'GROQ_API_KEY', url: 'https://api.groq.com/openai/v1/models' };
const OPENROUTER = { keyName: 'OPENROUTER_API_KEY', url: 'https://openrouter.ai/api/v1/models' };

/**
 * Pinned ids, read from source so this file cannot drift from the constant.
 *
 * It CAN still drift from the repo, and did. This function used to read exactly
 * two ids — the platform-llm Groq pin and the OpenRouter free default — and
 * reported "every pinned model is still served" while
 * `src/services/ai/groq.ts` held a registry whose every entry was retired,
 * including `DEFAULT_GROQ_MODEL` itself. A green check on a two-item list reads
 * exactly like a green check on the whole repo.
 *
 * So the registry is read as a whole rather than by naming one constant: the
 * keys of GROQ_MODELS are every Groq id this codebase can select, and a model
 * added there is covered without touching this file.
 */
function pinnedModels() {
  const llm = readFileSync(join(ROOT, 'src/services/cat/platform-llm.ts'), 'utf8');
  const groq = llm.match(/const GROQ_MODEL = '([^']+)'/)?.[1];

  const models = readFileSync(join(ROOT, 'src/config/ai-models.ts'), 'utf8');
  const openRouter = models.match(/export const DEFAULT_FREE_MODEL_ID = '([^']+)'/)?.[1];

  // Every id in the selectable Groq registry, not just the default. The block
  // is bounded so a later `as const` object in the same file cannot leak in.
  const groqSource = readFileSync(join(ROOT, 'src/services/ai/groq.ts'), 'utf8');
  const registry = groqSource.match(/const GROQ_MODELS = \{([\s\S]*?)\n\} as const;/)?.[1] ?? '';
  const registryIds = [...registry.matchAll(/^\s*'([^']+)':\s*\{/gm)].map((m) => m[1]);

  const entries = [
    { provider: 'groq', id: groq, ...GROQ },
    { provider: 'openrouter', id: openRouter, ...OPENROUTER },
    ...registryIds.map((id) => ({ provider: 'groq', id, ...GROQ })),
  ];

  if (registryIds.length === 0) {
    // Silence here would be indistinguishable from a clean registry, and this
    // check exists precisely because a narrower version of it was silent.
    entries.push({ provider: 'groq', id: undefined, ...GROQ });
  }

  // One id may be pinned in more than one place; ask the vendor once.
  const seen = new Set();
  return entries.filter((e) => {
    const key = `${e.provider}:${e.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function servedIds(url, key) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
  if (!res.ok) {
    throw new Error(`${res.status} from ${url}`);
  }
  const json = await res.json();
  return new Set((json.data ?? []).map(m => m.id));
}

const pinned = pinnedModels();
const missing = [];
const skipped = [];

for (const entry of pinned) {
  if (!entry.id) {
    missing.push(`${entry.provider}: could not read the pinned id from source`);
    continue;
  }
  const key = env(entry.keyName);
  if (!key) {
    skipped.push(`${entry.provider} (${entry.id}) — no ${entry.keyName}`);
    continue;
  }
  try {
    const served = await servedIds(entry.url, key);
    if (served.has(entry.id)) {
      console.log(`[check-ai-models] ${entry.provider}: ${entry.id} — served (${served.size} models)`);
    } else {
      missing.push(`${entry.provider}: '${entry.id}' is NOT served (${served.size} models available)`);
    }
  } catch (error) {
    skipped.push(`${entry.provider} (${entry.id}) — could not ask: ${error.message}`);
  }
}

// A skip is not a pass. Say so on its own line so it cannot be skimmed past.
for (const line of skipped) {
  console.log(`[check-ai-models] SKIPPED — ${line}`);
}

if (missing.length > 0) {
  console.error(
    `\n[check-ai-models] FAIL: ${missing.length} pinned model(s) no longer exist:\n` +
      missing.map(m => `  ${m}`).join('\n') +
      '\n\n  Every callPlatformJson caller returns null against a retired id, and\n' +
      '  each one is written to degrade gracefully — so the symptom is features\n' +
      '  quietly doing nothing. Update the constant and redeploy.\n'
  );
  process.exit(1);
}

if (skipped.length === pinned.length) {
  console.error('\n[check-ai-models] nothing was checked — no provider keys available.\n');
  process.exit(1);
}

console.log('[check-ai-models] OK — every pinned model is still served.');
