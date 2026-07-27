/**
 * Cat tool-use intent detection + tool definitions. Extracted verbatim from
 * tool-use.ts (SoC). messageMightNeedTools is re-exported from tool-use.ts.
 */

import { CAT_CREATABLE_ENTITY_TYPES } from '@/types/cat';
import { extractHttpUrls, isUrlOnlyMessage } from './website-analysis';

/**
 * Cheap pre-filter to decide whether the user message MIGHT need a tool call.
 * If none of these keywords appear, we skip the extra Groq tool-pass entirely
 * to keep the cost / latency floor low. Both discovery-style and creation-style
 * intents are covered.
 */
const TOOL_TRIGGER_KEYWORDS = [
  // discovery / search_platform
  'find',
  'look',
  'search',
  'who ',
  'anyone',
  'connect',
  'similar',
  'recommend',
  'discover',
  'help me find',
  'know of',
  'looking for',
  'does anyone',
  // creation / prefill_entity_form
  'want to sell',
  'want to offer',
  'want to start',
  'want to create',
  'want to launch',
  "i'd like to sell",
  "i'd like to offer",
  "i'd like to create",
  "i'd like to start",
  'create a',
  'launch a',
  'set up a',
  'set up an',
  'open a',
  'open an',
  'i sell',
  'i make',
  'i provide',
  'i offer',
  'i run',
  'i teach',
  'i organize',
  'i need to raise',
  'fundraise',
  // economic-agent / suggest_offers ("what can I offer?")
  'what can i offer',
  'what can i sell',
  'what could i offer',
  'what should i create',
  'what should i sell',
  'make money',
  'earn money',
  'monetize',
  'monetise',
  'ways to earn',
  'help me make money',
  'what can i do to earn',
  'ideas for me',
  'how can i participate',
  // platform health / notifications / check_cat_health
  'notification',
  'diagnose',
  'health check',
  'not answering',
  'not working',
  'not responding',
  'eval',
  'harness',
];

/**
 * Whether a message looks like a discovery / creation / multi-step task — the
 * kind that benefits from an agentic (frontier) model and triggers the tool
 * pass. Exported so the chat route can decide whether to nudge a user on a
 * weaker model toward upgrading, using the SAME signal that gates tool use
 * (one source of truth for "this wants more than chat").
 */
/**
 * A money NEED ("I need 500 CHF to fix my bike", "can I borrow money here?")
 * is a lending/funding intent — it should reach the tool pass so Cat can draft
 * a loan (or project/cause) instead of only suggesting things to sell.
 * Deliberately narrow: "need" alone never triggers; it must pair with an
 * amount+currency or an explicit borrow/loan word.
 */
const MONEY_NEED_PATTERNS = [
  /\bborrow\b/i,
  /\b(a|get|request|take)\s+(out\s+)?a?\s*loan\b/i,
  /\bneed\s+(some\s+)?(money|cash|funds|capital)\b/i,
  /\bneed\s+[\d'.,]+\s*(chf|eur|usd|btc|francs?|dollars?|euros?)\b/i,
];

export function hasMoneyNeedIntent(message: string): boolean {
  return MONEY_NEED_PATTERNS.some(re => re.test(message));
}

export function messageMightNeedTools(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    TOOL_TRIGGER_KEYWORDS.some(kw => lower.includes(kw)) ||
    hasMoneyNeedIntent(message) ||
    hasWebsiteAnalysisIntent(message)
  );
}

/**
 * Intent words that, TOGETHER with a pasted URL, signal "read my site and act
 * on it" (analyze_website). A URL pasted casually MID-SENTENCE doesn't trigger
 * the tool pass on its own — but a URL plus any of these does. A message that
 * is ONLY a URL/domain always triggers (see hasWebsiteAnalysisIntent).
 */
const URL_ANALYZE_INTENT_KEYWORDS = [
  'set me up',
  'set us up',
  'set it up',
  'my site',
  'my website',
  'my webpage',
  'my homepage',
  'my business',
  'my shop',
  'my store',
  'my page',
  'my company',
  'our site',
  'our website',
  'our business',
  'this site',
  'this website',
  'the site',
  'the website',
  'analyze',
  'analyse',
  'import',
  'onboard',
  'check out',
  'take a look',
  'have a look',
  'look at',
  'read it',
  'read my',
  'from my',
  'based on',
];

/**
 * The message wants the Cat to actually READ a site (analyze_website), not
 * just chat about it. True when either:
 * - the message IS a URL/domain and nothing else ("revampit.orangecat.ch" —
 *   the only plausible intent is "analyze this site and set me up"), or
 * - a pasted URL appears together with setup/analyze/import intent words.
 */
export function hasWebsiteAnalysisIntent(message: string): boolean {
  if (extractHttpUrls(message).length === 0) {
    return false;
  }
  if (isUrlOnlyMessage(message)) {
    return true;
  }
  const lower = message.toLowerCase();
  return URL_ANALYZE_INTENT_KEYWORDS.some(kw => lower.includes(kw));
}

/**
 * Strong "I want to create/list my own thing" signals. When present we
 * PROGRAMMATICALLY suppress search_platform tool calls — the weak free-tier
 * models ignore the routing prompt and search anyway, wasting a round-trip and
 * surfacing irrelevant "results" on a pure create intent. prefill_entity_form
 * is still allowed through.
 */
const CREATE_INTENT_PATTERNS = [
  /\b(i|we)\s+(make|sell|offer|provide|run|teach|organi[sz]e|build|create|craft|bake|design)\b/i,
  /\bwant(ed)?\s+to\s+(sell|offer|start|create|launch|list|build|make|raise|fundraise)\b/i,
  /\b(i'?d|i\s+would)\s+like\s+to\s+(sell|offer|create|start|launch|list)\b/i,
  /\b(create|launch|set\s+up|open|list|start)\s+(a|an|my)\b/i,
  /\bi\s+need\s+to\s+raise\b/i,
];

export function hasCreateIntent(message: string): boolean {
  // A money need drafts the user's OWN loan/project — a create intent, never a
  // platform search.
  return CREATE_INTENT_PATTERNS.some(re => re.test(message)) || hasMoneyNeedIntent(message);
}

/** Entity types Cat can DRAFT via the prefill tool. Derived from the creatable SSOT so the
 *  two lists can't drift. `group` is creatable but not prefillable — it uses a `name`, not the
 *  form-field prefill flow. Add an entry here only by removing it from this exclusion set. */
const NON_PREFILLABLE_ENTITY_TYPES = new Set<string>(['group']);
export const PREFILLABLE_ENTITY_TYPES = CAT_CREATABLE_ENTITY_TYPES.filter(
  t => !NON_PREFILLABLE_ENTITY_TYPES.has(t)
);

export const PLATFORM_TOOL_DEFINITION = [
  {
    type: 'function',
    function: {
      name: 'search_platform',
      description:
        'Search OrangeCat for people, projects, products, services, events, or causes. Use when the user wants to find, connect with, or discover someone or something on the platform.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'What to search for' },
          type: {
            type: 'string',
            enum: ['all', 'people', 'projects', 'products', 'services', 'events', 'causes'],
            description: 'Type of content to search. Use "all" when unsure.',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'prefill_entity_form',
      description:
        'Draft an entity (product, service, project, etc.) from a natural-language description. Use this INSTEAD of a create_* exec_action when the user has described what they want to create with enough detail (title-ish hint + at least one specific attribute like price, location, category, audience). Returns structured fields the user can review in a form before publishing — never auto-creates.',
      parameters: {
        type: 'object',
        properties: {
          entityType: {
            type: 'string',
            enum: PREFILLABLE_ENTITY_TYPES as unknown as string[],
            description: 'Which kind of entity to draft.',
          },
          description: {
            type: 'string',
            description:
              'A full natural-language description of the entity. Include everything the user said about it: what it is, who it is for, price if mentioned, location, materials, ingredients, schedule, etc. Min 10 chars.',
          },
        },
        required: ['entityType', 'description'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_website',
      description:
        "Fetch and read a business website whose URL the user pasted in their message, returning the site's readable text. Use when the user shares a site URL and wants to be set up on OrangeCat, or asks you to analyze/import/read their site. Only URLs actually present in the user's message can be fetched. After reading the result, propose entities via prefill_entity_form grounded STRICTLY in what the site says — never invent.",
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: "The exact http(s) URL from the user's message.",
          },
        },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'suggest_offers',
      description:
        'The economic agent. Call this when the user asks what they could offer, sell, or create, how they could make money, or wants ideas grounded in who they are. It reads everything OrangeCat knows about them (profile, documents, memories, existing entities) and proposes several concrete, ready-to-publish offers across the economic spectrum, each as a draft card. Takes no required arguments — it reads their stored context, not the message.',
      parameters: {
        type: 'object',
        properties: {
          focus: {
            type: 'string',
            description:
              'Optional area to focus suggestions on (e.g. "design", "teaching", "renting out gear"). Omit for a broad spread.',
          },
          count: {
            type: 'number',
            description: 'How many offers to propose (1-5). Default 4.',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_cat_health',
      description:
        "Live health check of the AI providers powering the Cat. Call when the user asks why the Cat/AI is failing, slow, or not answering, or asks about a system notification that mentions provider failures, eval/harness errors, or Cat health. Returns per-provider status (ok / rate-limited / auth failure / down) that explains what's wrong in actionable terms. Takes no arguments.",
      parameters: { type: 'object', properties: {} },
    },
  },
];
