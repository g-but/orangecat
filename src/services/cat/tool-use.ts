/**
 * Cat Tool Use — Platform Search Enrichment
 *
 * Before the main streaming response, checks if the user's message looks like
 * a discovery query and optionally calls the Groq tool API to search the platform.
 * Enriches the messages array with tool call results so the final response
 * has real platform data to draw on.
 *
 * Only active for the Groq provider (OpenRouter tool use is not yet supported).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { SupabaseClient } from '@supabase/supabase-js';
import { searchPlatform, type SearchType } from './platform-search';

const SEARCH_KEYWORDS = [
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
];

const PLATFORM_TOOL_DEFINITION = [
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
];

/**
 * Returns the messages array, possibly enriched with platform search results.
 * Non-fatal: on any failure returns the original messages unchanged.
 */
export async function maybeEnrichWithSearchResults(
  supabase: SupabaseClient<any, any, any>,
  messages: any[],
  userMessage: string,
  provider: 'groq' | 'openrouter',
  groqKey: string | null,
  modelToUse: string
): Promise<any[]> {
  if (provider !== 'groq') return messages;

  const mightNeedSearch = SEARCH_KEYWORDS.some(kw => userMessage.toLowerCase().includes(kw));
  if (!mightNeedSearch) return messages;

  const key = groqKey ?? process.env.GROQ_API_KEY;
  if (!key) return messages;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelToUse,
        messages,
        tools: PLATFORM_TOOL_DEFINITION,
        tool_choice: 'auto',
        stream: false,
        max_tokens: 500, // Keep fast — only need to detect tool_calls
      }),
    });

    if (!res.ok) return messages;

    const data = await res.json();
    const choice = data.choices?.[0];
    if (choice?.finish_reason !== 'tool_calls' || !choice.message?.tool_calls?.length) {
      return messages; // Model decided no search needed
    }

    const enriched = [...messages, choice.message];

    for (const toolCall of choice.message.tool_calls as any[]) {
      if (toolCall.function?.name !== 'search_platform') continue;
      let content: string;
      try {
        const args = JSON.parse(toolCall.function.arguments ?? '{}');
        const results = await searchPlatform(
          supabase,
          args.query ?? '',
          (args.type ?? 'all') as SearchType
        );
        content =
          results.length > 0
            ? JSON.stringify(results, null, 2)
            : 'No results found for this search query.';
      } catch {
        content = 'Search failed. Please try a different query.';
      }
      enriched.push({ role: 'tool', tool_call_id: toolCall.id, content });
    }

    return enriched;
  } catch {
    return messages; // Non-fatal
  }
}
