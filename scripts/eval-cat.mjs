#!/usr/bin/env node
/**
 * Cat judgment eval — nightly regression gate.
 *
 * Runs the 8 canonical entity-type probes (established in PR #375) against the
 * PRODUCTION Cat chat pipeline (`POST /api/cat/chat`, streaming SSE — the
 * non-streaming path 500s at ~38s on tool-heavy messages, a known box issue)
 * and scores every reply on three axes:
 *
 *   1. right entity type   — a prefill draft card (or, as fallback, the reply
 *                            text) proposes the expected entity type
 *   2. why-explanation     — the reply explains WHY that type fits
 *   3. no duplicate drafts — never two draft cards of the same type in one turn
 *
 * Exit codes: 0 = pass · 1 = regression (type <7/8 or why <7/8) · 2 = harness error.
 *
 * Hygiene (lessons from the PR #375 ad-hoc harness):
 *   - Every probe runs in its OWN dedicated, non-default conversation and all
 *     of them are DELETED afterwards (cat_messages + run-window cat_memories
 *     too), so the test user's conversation rail stays clean AND probes can't
 *     contaminate each other via shared history or per-user memory recall.
 *   - The test user's daily platform_api_usage row is cleared before AND
 *     after the run, so the free-tier cap neither blocks the eval nor is
 *     consumed by it.
 *
 * On failure with CAT_EVAL_NOTIFY=1 (set by the systemd unit on the box), an
 * in-app notification is UPSERTED for the founder via the same schema the
 * NotificationDispatcher uses (notifications: user_id, type, message,
 * metadata{title,...}, is_read) and the failure is logged to stderr (journal).
 * Upserted, not inserted: a repeated nightly failure updates the existing
 * UNREAD row for the same title (bumping metadata.occurrences) instead of
 * stacking a duplicate every night. The notification's action_url deep-links
 * into the Cat chat with a prepared question, so the founder's first stop is
 * the Cat (which can run a live provider health check), not journalctl.
 *
 * Env (all read from process.env, with .env.local as local-dev fallback):
 *   NEXT_PUBLIC_SUPABASE_URL / SUPABASE_URL     GoTrue + PostgREST host
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY                   cleanup + cap reset + notify
 *   CAT_EVAL_BASE_URL      target app (default https://orangecat.ch)
 *   CAT_EVAL_PROVIDER      groq|openrouter (default: openrouter when
 *                           OPENROUTER_API_KEY is present, otherwise groq)
 *   CAT_EVAL_MODEL         pinned model (provider default unless overridden)
 *   CAT_EVAL_EMAIL         eval user (default the dedicated Lena test account)
 *   CAT_EVAL_PASSWORD      eval user password
 *   GROQ_API_KEY / OPENROUTER_API_KEY            optional; used only to choose
 *                           a default eval provider. The app serves the locked
 *                           request through its own platform provider config.
 *   CAT_EVAL_NOTIFY        "1" → notify founder in-app on failure
 *   CAT_EVAL_NOTIFY_USER_ID  recipient (default founder mao)
 *   CAT_EVAL_JSON_OUT      write full JSON report to this path
 *
 * Deploy path on the box: /opt/orangecat/scripts/eval-cat.mjs
 * (installed by scripts/deploy-selfhost.sh; run nightly by the
 *  orangecat-cat-eval.timer systemd unit at 04:30 UTC).
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';

// ---------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------

/** Minimal .env.local fallback for local runs (box uses EnvironmentFile). */
function loadLocalEnvFallback() {
  if (!existsSync('.env.local')) {return;}
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}
loadLocalEnvFallback();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BASE_URL = process.env.CAT_EVAL_BASE_URL || 'https://orangecat.ch';
// Dedicated eval account (test fixture, not a human user).
const EVAL_EMAIL = process.env.CAT_EVAL_EMAIL || 'lena.brunner.test@proton.me';
const EVAL_PASSWORD = process.env.CAT_EVAL_PASSWORD || 'Ceramica2026!';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const EVAL_PROVIDER =
  process.env.CAT_EVAL_PROVIDER || (OPENROUTER_API_KEY ? 'openrouter' : 'groq');
// Pin one provider/model for repeatability: the gate measures the Cat judgment
// pipeline (rubric, tools, prefill, why-line), not whichever free-model fallback
// is least congested tonight.
const EVAL_MODEL =
  process.env.CAT_EVAL_MODEL ||
  (EVAL_PROVIDER === 'groq' ? 'llama-3.3-70b-versatile' : 'openai/gpt-oss-120b:free');
const NOTIFY = process.env.CAT_EVAL_NOTIFY === '1';
const NOTIFY_USER_ID =
  process.env.CAT_EVAL_NOTIFY_USER_ID || 'cec88bc9-557f-452b-92f1-e093092fecd6'; // founder mao
const JSON_OUT =
  process.env.CAT_EVAL_JSON_OUT ||
  (process.argv.includes('--json') ? process.argv[process.argv.indexOf('--json') + 1] : null);

const PROBE_TIMEOUT_MS = 120_000; // tool phase ≤25s + free-model generation
const INTER_PROBE_DELAY_MS = 8_000; // be gentle to free-tier TPM
const MAX_ATTEMPTS = 3; // per probe, on transient failures only
const RETRY_BACKOFF_MS = [20_000, 45_000]; // free-tier 429s need a real pause
const PASS_THRESHOLD = 7; // per axis, out of 8

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
  console.error('eval-cat: missing SUPABASE_URL / ANON_KEY / SERVICE_ROLE_KEY in env');
  process.exit(2);
}

// ---------------------------------------------------------------------------
// The 8 canonical probes (PR #375)
// ---------------------------------------------------------------------------

const PROBES = [
  {
    id: 'a-haircuts',
    label: 'Haircuts at home → service',
    message: 'I offer haircuts at home in Zürich, 40 CHF per cut.',
    expect: { types: ['service'] },
  },
  {
    id: 'b-mugs',
    label: 'Handmade mugs → product',
    message: 'I hand-make ceramic mugs and want to sell them.',
    expect: { types: ['product'] },
  },
  {
    id: 'c-trees',
    label: 'Tree-planting fundraiser → cause/project',
    message:
      'I want to raise money to plant 1000 trees around my village next spring. People who chip in should see the progress.',
    expect: { types: ['cause', 'project'] },
  },
  {
    id: 'd-bike-loan',
    label: '500 CHF bike repair → loan',
    message:
      'I need 500 CHF to fix my bike so I can keep delivering food. I can pay it back from my delivery earnings within two months.',
    expect: { types: ['loan'] },
  },
  {
    id: 'e-linkedin-bio',
    label: 'LinkedIn-style bio → service + question',
    message:
      'Senior software engineer with 10 years in fintech. I design payment systems, lead teams of 5-10 engineers, and mentor juniors. Open to consulting engagements.',
    expect: { types: ['service'], question: true },
  },
  {
    id: 'f-meetup',
    label: 'Bitcoin meetup Basel → event',
    message: "I'm organizing a Bitcoin meetup next month in Basel.",
    expect: { types: ['event'] },
  },
  {
    id: 'g-bakery',
    label: 'Bare "we\'re a bakery" → clarifying question',
    message: "we're a bakery",
    expect: { question: true },
  },
  {
    id: 'h-charter',
    label: 'Community charter → group first',
    message:
      "A few of us have been meeting weekly as the Philosopher's Stone circle. We wrote a shared charter of values, and now we want to formalize our community, pool a small treasury, and eventually fund projects our members propose.",
    expect: { types: ['group', 'circle'], groupFirst: true },
  },
];

// ---------------------------------------------------------------------------
// Supabase REST helpers (service role)
// ---------------------------------------------------------------------------

const svcHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

async function rest(method, path, { body, prefer } = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: { ...svcHeaders, ...(prefer ? { Prefer: prefer } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error(`PostgREST ${method} ${path} → ${res.status}: ${await res.text()}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ---------------------------------------------------------------------------
// Auth: sign in via GoTrue REST, forge the @supabase/ssr auth cookie
// ---------------------------------------------------------------------------

async function signIn() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EVAL_EMAIL, password: EVAL_PASSWORD }),
  });
  if (!res.ok) {throw new Error(`GoTrue sign-in failed: ${res.status} ${await res.text()}`);}
  return res.json(); // { access_token, refresh_token, expires_at, user, ... }
}

/**
 * Rebuild the cookie @supabase/ssr expects: name `sb-<host-label>-auth-token`,
 * value `base64-<base64url(session JSON)>`, chunked into `.0`,`.1`,… pieces
 * at 3180 chars (MAX_CHUNK_SIZE in @supabase/ssr).
 */
function buildAuthCookie(session) {
  const name = `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`;
  const value = `base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`;
  const MAX = 3180;
  if (value.length <= MAX) {return `${name}=${value}`;}
  const parts = [];
  for (let i = 0; i * MAX < value.length; i++) {
    parts.push(`${name}.${i}=${value.slice(i * MAX, (i + 1) * MAX)}`);
  }
  return parts.join('; ');
}

// ---------------------------------------------------------------------------
// SSE probe runner
// ---------------------------------------------------------------------------

async function runProbe(probe, cookie, conversationId) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  const out = { content: '', proposals: [], toolCalls: 0, model: null, error: null, done: false };

  try {
    const res = await fetch(`${BASE_URL}/api/cat/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
        'x-cat-eval-lock-model': '1',
        'x-cat-eval-provider': EVAL_PROVIDER,
      },
      body: JSON.stringify({
        message: probe.message,
        model: EVAL_MODEL,
        stream: true,
        conversationId,
        locale: 'en',
        preferredCurrency: 'CHF',
      }),
      signal: controller.signal,
    });
    if (!res.ok || !res.body) {
      out.error = `HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`;
      return { ...out, ms: Date.now() - started };
    }

    const decoder = new TextDecoder();
    let buf = '';
    for await (const chunk of res.body) {
      buf += decoder.decode(chunk, { stream: true });
      let idx;
      while ((idx = buf.indexOf('\n\n')) !== -1) {
        const frame = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        const isError = /^event: ?error$/m.test(frame);
        const dataLine = frame.split('\n').find(l => l.startsWith('data: '));
        if (!dataLine) {continue;}
        let payload;
        try {
          payload = JSON.parse(dataLine.slice(6));
        } catch {
          continue;
        }
        if (isError) {
          out.error = payload.error || JSON.stringify(payload).slice(0, 300);
          continue;
        }
        if (typeof payload.content === 'string') {out.content += payload.content;}
        if (payload.prefill_proposal) {out.proposals.push(payload.prefill_proposal);}
        if (payload.tool_call) {out.toolCalls++;}
        if (payload.model) {out.model = payload.model;}
        if (payload.done) {out.done = true;}
      }
    }
  } catch (err) {
    out.error = err.name === 'AbortError' ? `timeout after ${PROBE_TIMEOUT_MS}ms` : String(err);
  } finally {
    clearTimeout(timer);
  }
  return { ...out, ms: Date.now() - started };
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function scoreProbe(probe, result) {
  const { expect } = probe;
  const proposalTypes = result.proposals.map(p => p.entityType);
  const content = result.content || '';

  // --- right entity type -------------------------------------------------
  let typeOk;
  if (expect.types) {
    const cardHit = proposalTypes.some(t => expect.types.includes(t));
    // Fallback for known free-model variance: the reply recommends the type
    // in prose without attaching the draft card (PR #375, probe c).
    const proseHit = expect.types.some(t => new RegExp(`\\b${t}\\b`, 'i').test(content));
    typeOk = cardHit || proseHit;
    if (expect.groupFirst) {
      // Group must lead: first card is group/circle, or (no cards) the prose
      // mentions group/circle before any project/product pitch.
      const firstCardOk = proposalTypes.length
        ? ['group', 'circle'].includes(proposalTypes[0])
        : null;
      const groupIdx = content.toLowerCase().search(/\bgroup\b|\bcircle\b/);
      const projIdx = content.toLowerCase().search(/\bproject\b|\bproduct\b/);
      const proseFirstOk = groupIdx !== -1 && (projIdx === -1 || groupIdx < projIdx);
      typeOk = firstCardOk !== null ? firstCardOk : proseFirstOk;
    }
  } else {
    // Thin input: pass = Cat interviews (asks a focused question) instead of
    // committing to an arbitrary draft.
    typeOk = /\?/.test(content);
  }

  // --- why-explanation present -------------------------------------------
  // Any explicit reasoning connective counts: the gate is "did Cat explain
  // itself", not "did it use the word because".
  const whyOk =
    /\bbecause\b|\bwhy (a|an|this|it)\b|\bfits\b|\bmatches\b|rather than|instead of|that way|perfect (for|if)|ideal (for|if)|best way|simple way|great way|lets (you|people)|so (you|people|supporters|members) can/i.test(
      content
    );

  // --- follow-up question when expected ----------------------------------
  const questionOk = expect.question ? /\?/.test(content) : true;

  // --- duplicate draft cards ----------------------------------------------
  const dup = proposalTypes.length !== new Set(proposalTypes).size;

  return {
    typeOk: Boolean(typeOk && questionOk),
    whyOk,
    dup,
    proposalTypes,
  };
}

// ---------------------------------------------------------------------------
// Hygiene: dedicated conversation + cap reset + cleanup
// ---------------------------------------------------------------------------

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

async function resetDailyCap(userId) {
  await rest(
    'DELETE',
    `platform_api_usage?user_id=eq.${userId}&usage_date=eq.${todayUTC()}`,
    { prefer: 'return=minimal' }
  );
}

async function createEvalConversation(userId, probeId) {
  const rows = await rest('POST', 'cat_conversations', {
    body: { user_id: userId, title: `[eval] ${probeId}`, is_default: false },
    prefer: 'return=representation',
  });
  return rows[0].id;
}

/**
 * Cat memories are recalled per USER (not per conversation), so facts
 * extracted from one probe would leak into the next even across separate
 * conversations — the exact contamination PR #375 flagged. Best-effort purge
 * of everything extracted since the run started, between probes and at the
 * end (extraction is detached server-side, so a late row can slip past an
 * intermediate purge; the final purge catches it).
 */
async function purgeRunMemories(userId, sinceIso) {
  await rest(
    'DELETE',
    `cat_memories?user_id=eq.${userId}&created_at=gte.${encodeURIComponent(sinceIso)}`,
    { prefer: 'return=minimal' }
  );
}

async function cleanupEvalArtifacts(userId, conversationIds, runStartIso) {
  await purgeRunMemories(userId, runStartIso);
  for (const id of conversationIds) {
    await rest('DELETE', `cat_messages?conversation_id=eq.${id}`, { prefer: 'return=minimal' });
    await rest('DELETE', `cat_conversations?id=eq.${id}&is_default=is.false`, {
      prefer: 'return=minimal',
    });
  }
  // Give the eval user their full daily cap back.
  await resetDailyCap(userId);
}

// ---------------------------------------------------------------------------
// Failure notification (mirrors NotificationDispatcher.createInAppNotification)
// ---------------------------------------------------------------------------

/**
 * Insert-or-update the founder's in-app alert for one failure class (keyed by
 * metadata title). Coalescing rule: if an UNREAD notification with the same
 * title from this script already exists, update it in place and bump
 * metadata.occurrences — never stack a duplicate row per night. action_url
 * opens the Cat chat with a prepared question so the Cat (which can run live
 * provider health probes) does the triage.
 */
async function upsertFounderNotification(title, message, extraMetadata = {}) {
  const question = `Help me with this notification: ${title} — "${message}" What does it mean and what should I do?`;
  const actionUrl = `/dashboard/cat?q=${encodeURIComponent(question)}`;
  const existing = await rest(
    'GET',
    `notifications?user_id=eq.${NOTIFY_USER_ID}&type=eq.system&is_read=eq.false` +
      `&metadata->>source=eq.eval-cat.mjs&metadata->>title=eq.${encodeURIComponent(title)}` +
      `&select=id,metadata&order=created_at.desc&limit=1`
  );
  const baseMetadata = {
    ...extraMetadata,
    title,
    source: 'eval-cat.mjs',
    ranAt: new Date().toISOString(),
  };
  if (Array.isArray(existing) && existing.length > 0) {
    const prev = existing[0];
    const occurrences = (Number(prev.metadata?.occurrences) || 1) + 1;
    await rest('PATCH', `notifications?id=eq.${prev.id}`, {
      body: { message, action_url: actionUrl, metadata: { ...baseMetadata, occurrences } },
      prefer: 'return=minimal',
    });
    return;
  }
  await rest('POST', 'notifications', {
    body: {
      user_id: NOTIFY_USER_ID,
      type: 'system',
      message,
      action_url: actionUrl,
      metadata: { ...baseMetadata, occurrences: 1 },
      is_read: false,
    },
    prefer: 'return=minimal',
  });
}

async function notifyFounder(summaryLine, report) {
  await upsertFounderNotification(
    'Cat eval regression',
    `Nightly Cat eval FAILED — ${summaryLine}. Tap to have your Cat look into it.`,
    {
      typeScore: report.scores.type,
      whyScore: report.scores.why,
      duplicateDrafts: report.scores.duplicates,
      failedProbes: report.probes.filter(p => !p.typeOk || !p.whyOk).map(p => p.id),
    }
  );
}

async function notifyFounderHarnessError(summaryLine) {
  await upsertFounderNotification(
    'Cat eval harness error',
    `Nightly Cat eval could not complete — ${summaryLine}. Tap to have your Cat diagnose the providers.`
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.error(
    `eval-cat: target=${BASE_URL} user=${EVAL_EMAIL} provider=${EVAL_PROVIDER} model=${EVAL_MODEL}`
  );
  const session = await signIn();
  const userId = session.user.id;
  const cookie = buildAuthCookie(session);

  await resetDailyCap(userId);

  const runStartIso = new Date().toISOString();
  const report = {
    timestamp: runStartIso,
    baseUrl: BASE_URL,
    probes: [],
    scores: { type: 0, why: 0, duplicates: 0, max: PROBES.length },
  };
  const conversationIds = [];

  try {
    for (const probe of PROBES) {
      // One fresh conversation PER probe: shared history made the model
      // answer a previous unanswered probe instead of the current one
      // (observed live: an empty-reply turn shifted every later reply one
      // probe back). Isolation keeps each score about its own input.
      const conversationId = await createEvalConversation(userId, probe.id);
      conversationIds.push(conversationId);
      console.error(`eval-cat: probe ${probe.id} (conversation ${conversationId}) …`);

      // Retry with real backoff on TRANSIENT failures (free-tier provider
      // 429s, transport errors, empty/fallback replies) — those measure
      // provider capacity, not Cat's judgment. Genuine replies are never
      // re-rolled: first real answer is the scored answer.
      const isTransient = r =>
        Boolean(r.error) ||
        (r.proposals.length === 0 &&
          (!r.content.trim() || r.content.startsWith("I couldn't put together a reply")));
      let result;
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        if (attempt > 0) {
          console.error(
            `eval-cat:   retry ${attempt}/${MAX_ATTEMPTS - 1} for ${probe.id} (${result.error || 'empty reply'})`
          );
          await sleep(RETRY_BACKOFF_MS[attempt - 1]);
        }
        result = await runProbe(probe, cookie, conversationId);
        result.retried = attempt > 0;
        if (!isTransient(result)) {break;}
      }

      const score = scoreProbe(probe, result);
      report.probes.push({
        id: probe.id,
        label: probe.label,
        ...score,
        model: result.model,
        ms: result.ms,
        retried: Boolean(result.retried),
        error: result.error,
        contentSnippet: (result.content || '').slice(0, 220),
      });
      if (score.typeOk) {report.scores.type++;}
      if (score.whyOk) {report.scores.why++;}
      if (score.dup) {report.scores.duplicates++;}

      // Purge memories extracted from this probe so they can't contaminate
      // the next one (recall is per-user, not per-conversation).
      await purgeRunMemories(userId, runStartIso).catch(() => {});
      await sleep(INTER_PROBE_DELAY_MS);
    }
  } finally {
    try {
      await cleanupEvalArtifacts(userId, conversationIds, runStartIso);
      console.error('eval-cat: cleanup done (conversations, messages, memories, daily cap)');
    } catch (err) {
      console.error(`eval-cat: CLEANUP FAILED — manual sweep needed: ${err}`);
    }
  }

  // ---- report ------------------------------------------------------------
  const { scores } = report;
  const providerErrorCount = report.probes.filter(p => Boolean(p.error)).length;
  const pass =
    scores.type >= PASS_THRESHOLD && scores.why >= PASS_THRESHOLD;
  const summaryLine = `type ${scores.type}/${scores.max} · why ${scores.why}/${scores.max} · duplicate-draft probes ${scores.duplicates}`;

  console.log('');
  console.log('=== Cat eval — nightly judgment gate ===');
  for (const p of report.probes) {
    const flags = [
      p.typeOk ? 'type✓' : 'type✗',
      p.whyOk ? 'why✓' : 'why✗',
      p.dup ? 'DUP' : '',
      p.error ? `err(${p.error.slice(0, 60)})` : '',
    ]
      .filter(Boolean)
      .join(' ');
    console.log(
      `  ${p.typeOk && p.whyOk && !p.dup ? 'PASS' : 'FAIL'}  ${p.id.padEnd(15)} ${flags}  [${p.proposalTypes.join(',') || 'no card'}] ${(p.ms / 1000).toFixed(1)}s`
    );
  }
  console.log(`  → ${summaryLine} — ${pass ? 'PASS' : 'FAIL'}`);
  console.log(JSON.stringify(report, null, 2));
  if (JSON_OUT) {writeFileSync(JSON_OUT, JSON.stringify(report, null, 2));}

  if (providerErrorCount > 0) {
    const line = `${providerErrorCount}/${scores.max} probe(s) failed at the provider layer; judgment score is invalid`;
    console.error(`eval-cat: HARNESS ERROR — ${line}`);
    if (NOTIFY) {
      try {
        await notifyFounderHarnessError(line);
        console.error(`eval-cat: founder notified in-app (${NOTIFY_USER_ID})`);
      } catch (err) {
        console.error(`eval-cat: failed to insert founder notification: ${err}`);
      }
    }
    process.exit(2);
  }

  if (!pass) {
    console.error(`eval-cat: REGRESSION — ${summaryLine}`);
    if (NOTIFY) {
      try {
        await notifyFounder(summaryLine, report);
        console.error(`eval-cat: founder notified in-app (${NOTIFY_USER_ID})`);
      } catch (err) {
        console.error(`eval-cat: failed to insert founder notification: ${err}`);
      }
    }
    process.exit(1);
  }
}

main().catch(async err => {
  console.error(`eval-cat: harness error: ${err?.stack || err}`);
  if (NOTIFY) {
    try {
      await upsertFounderNotification(
        'Cat eval harness error',
        `Nightly Cat eval could not run: ${String(err).slice(0, 200)}`
      );
    } catch {
      /* journal already has the primary error */
    }
  }
  process.exit(2);
});
