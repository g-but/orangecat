/**
 * Cat tool executor — runs a single tool call (search_platform / prefill_entity_form)
 * and returns the `tool` result message to feed back to the model. Extracted verbatim
 * from tool-use.ts (SoC). Side-effects (onToolCall lifecycle, onPrefillProposal) fire here.
 */

import type { AnySupabaseClient } from '@/lib/supabase/types';
import { searchPlatform, type SearchType } from './platform-search';
import { generateFormPrefill } from '@/lib/ai/form-prefill-service';
import { generateOffers } from './offer-engine';
import { getEntityConfig } from '@/config/entity-configs/get-config';
import { isValidEntityType, type EntityType } from '@/config/entity-registry';
import { PREFILLABLE_ENTITY_TYPES } from './tool-use-detection';
import { fetchWebsiteText, resolveRequestedUrl } from './website-analysis';
import { runCatHealthProbes } from './health-probes';
import type {
  ToolResultMessage,
  ToolCallResultRef,
  OnToolCall,
  OnPrefillProposal,
  RawToolCall,
} from './tool-use-types';

/**
 * Execute a single tool call and return the `tool` result message to feed back
 * to the model. Side-effects (onToolCall lifecycle, onPrefillProposal) fire here.
 */
export async function executeToolCall(
  supabase: AnySupabaseClient,
  userId: string,
  toolCall: RawToolCall,
  userMessage: string,
  onToolCall?: OnToolCall,
  onPrefillProposal?: OnPrefillProposal
): Promise<ToolResultMessage> {
  const toolName = toolCall.function?.name;

  // ── analyze_website ─────────────────────────────────────────────────────
  // Fetches a site the user pasted (SSRF-guarded) and returns its readable
  // text plus a strict grounding instruction; the model then chains
  // prefill_entity_form calls for the entities the site actually evidences.
  if (toolName === 'analyze_website') {
    const parsedArgs = (() => {
      try {
        return JSON.parse(toolCall.function.arguments ?? '{}') as { url?: string };
      } catch {
        return {} as { url?: string };
      }
    })();

    // Only fetch URLs the user actually typed — never a model-invented one.
    const requestedUrl = resolveRequestedUrl(parsedArgs.url ?? '', userMessage);
    if (!requestedUrl) {
      onToolCall?.({
        id: toolCall.id,
        name: toolName,
        status: 'failed',
        error: 'no_url_in_message',
      });
      return {
        role: 'tool',
        tool_call_id: toolCall.id,
        content:
          "No matching http(s) URL was found in the user's message. Ask the user to paste the full website URL (starting with https://).",
      };
    }

    onToolCall?.({
      id: toolCall.id,
      name: toolName,
      status: 'running',
      args: { url: requestedUrl },
    });

    const result = await fetchWebsiteText(requestedUrl);
    if (!result.ok) {
      onToolCall?.({ id: toolCall.id, name: toolName, status: 'failed', error: result.error });
      return {
        role: 'tool',
        tool_call_id: toolCall.id,
        content: `Could not read the website: ${result.error} Tell the user plainly what went wrong and ask them to check the URL — do NOT guess or describe the site's content.`,
      };
    }

    onToolCall?.({
      id: toolCall.id,
      name: toolName,
      status: 'completed',
      resultCount: 1,
      results: [{ url: result.url, type: 'website', title: result.title ?? result.url }],
    });

    return {
      role: 'tool',
      tool_call_id: toolCall.id,
      content: `WEBSITE CONTENT fetched from ${result.url}:
---
${result.text}
---
INSTRUCTIONS (hard constraints):
- Propose AT MOST 3 entities by calling prefill_entity_form — put all calls in your NEXT message, one call per entity.
- Every entity MUST be directly evidenced by the site text above: a service they visibly offer, a product they visibly sell, or the organization itself as a project or group. In each description, quote or reference the exact wording from the site that evidences it.
- NEVER invent prices. Leave price out of the description unless the site states one; if it states a fiat price, keep it in that currency (e.g. "CHF 120"). Bitcoin amounts are always BTC — never sats.
- If the site text is thin or ambiguous, call NO further tools; the final reply should say so honestly and ask the user ONE clarifying question instead of proposing anything.
- In the final user-facing reply, briefly say what you read on the site and point to the draft cards — do not restate field values or add anything the site does not say.`,
    };
  }

  // ── suggest_offers (economic agent) ────────────────────────────────────────
  // Reads the user's full context, reasons over latent assets, and emits each
  // grounded offer as a prefill card (the UI already renders N cards per turn).
  if (toolName === 'suggest_offers') {
    const parsedArgs = (() => {
      try {
        return JSON.parse(toolCall.function.arguments ?? '{}') as {
          focus?: string;
          count?: number;
        };
      } catch {
        return {} as { focus?: string; count?: number };
      }
    })();

    const offers = await generateOffers(supabase, userId, {
      count: parsedArgs.count,
      focus: parsedArgs.focus,
    });

    let emitted = 0;
    await Promise.all(
      offers.map(async offer => {
        const entityConfig = getEntityConfig(offer.entityType);
        if (!entityConfig) {
          return;
        }
        try {
          const prefill = await generateFormPrefill(
            offer.entityType,
            offer.description,
            entityConfig
          );
          if (!prefill.success) {
            return;
          }
          emitted += 1;
          onPrefillProposal?.({
            entityType: offer.entityType,
            sourceDescription: offer.rationale
              ? `${offer.description}\n\nWhy: ${offer.rationale}`
              : offer.description,
            data: prefill.data as Record<string, unknown>,
            confidence: prefill.confidence as Record<string, number>,
          });
        } catch {
          // One offer failing to prefill shouldn't sink the rest.
        }
      })
    );

    onToolCall?.({
      id: toolCall.id,
      name: toolName,
      status: 'completed',
      resultCount: emitted,
      results: [],
    });

    return {
      role: 'tool',
      tool_call_id: toolCall.id,
      content:
        emitted > 0
          ? `Proposed ${emitted} grounded offer${emitted === 1 ? '' : 's'} as draft cards the user can review and publish. Introduce them in one or two warm sentences — do NOT list the field values; the cards show those.`
          : `Couldn't draft grounded offers from the user's current context. Invite them to add a little more about themselves (a quick document or a few profile details) so you can tailor real ideas — do not invent offers.`,
    };
  }

  // ── check_cat_health ─────────────────────────────────────────────────────
  // Live provider probes (same logic as GET /api/cat/diagnose) so the Cat can
  // explain "why isn't the AI answering?" and provider-failure notifications
  // with real data instead of sending the user to server logs.
  if (toolName === 'check_cat_health') {
    onToolCall?.({ id: toolCall.id, name: toolName, status: 'running' });
    try {
      const report = await runCatHealthProbes();
      onToolCall?.({
        id: toolCall.id,
        name: toolName,
        status: 'completed',
        resultCount: Object.keys(report.probes).length,
        results: [],
      });
      return {
        role: 'tool',
        tool_call_id: toolCall.id,
        content: `LIVE CAT HEALTH CHECK:
${JSON.stringify(report, null, 2)}
Explain this to the user in plain language: which provider is healthy, degraded, or down, and what that means for THEM. If they asked about a notification mentioning "provider layer" failures or eval errors, connect it to these results (e.g. rate_limit = the free-tier provider was overloaded, usually recovers on its own; auth/invalid_key/no_key = the API key needs fixing in settings; no_response = the provider was unreachable). Suggest ONE concrete next step. Never tell the user to read server logs.`,
      };
    } catch (err) {
      onToolCall?.({
        id: toolCall.id,
        name: toolName,
        status: 'failed',
        error: err instanceof Error ? err.message : 'unknown',
      });
      return {
        role: 'tool',
        tool_call_id: toolCall.id,
        content:
          'The health check itself failed to run. Tell the user honestly that you could not probe the providers right now and suggest trying again in a moment.',
      };
    }
  }

  // ── search_platform ──────────────────────────────────────────────────────
  if (toolName === 'search_platform') {
    const parsedArgs = (() => {
      try {
        return JSON.parse(toolCall.function.arguments ?? '{}') as { query?: string; type?: string };
      } catch {
        return {} as { query?: string; type?: string };
      }
    })();

    onToolCall?.({
      id: toolCall.id,
      name: toolName,
      status: 'running',
      args: { query: parsedArgs.query, type: parsedArgs.type ?? 'all' },
    });

    let searchContent: string;
    try {
      const results = await searchPlatform(
        supabase,
        parsedArgs.query ?? '',
        (parsedArgs.type ?? 'all') as SearchType
      );
      if (results.length > 0) {
        searchContent = JSON.stringify(results, null, 2);
        const refs: ToolCallResultRef[] = results
          .slice(0, 8)
          .map(r => ({ url: r.url, type: r.type, title: r.title }));
        onToolCall?.({
          id: toolCall.id,
          name: toolName,
          status: 'completed',
          resultCount: results.length,
          results: refs,
        });
      } else {
        searchContent = 'No results found for this search query.';
        onToolCall?.({ id: toolCall.id, name: toolName, status: 'no_results' });
      }
    } catch (err) {
      searchContent = 'Search failed. Please try a different query.';
      onToolCall?.({
        id: toolCall.id,
        name: toolName,
        status: 'failed',
        error: err instanceof Error ? err.message : 'unknown',
      });
    }
    return { role: 'tool', tool_call_id: toolCall.id, content: searchContent };
  }

  // ── prefill_entity_form ──────────────────────────────────────────────────
  if (toolName === 'prefill_entity_form') {
    const parsedArgs = (() => {
      try {
        return JSON.parse(toolCall.function.arguments ?? '{}') as {
          entityType?: string;
          description?: string;
        };
      } catch {
        return {} as { entityType?: string; description?: string };
      }
    })();

    const requestedType = parsedArgs.entityType ?? '';
    const description = parsedArgs.description ?? '';

    onToolCall?.({
      id: toolCall.id,
      name: toolName,
      status: 'running',
      args: { entityType: requestedType },
    });

    if (!isValidEntityType(requestedType)) {
      onToolCall?.({
        id: toolCall.id,
        name: toolName,
        status: 'failed',
        error: 'invalid_entity_type',
      });
      return {
        role: 'tool',
        tool_call_id: toolCall.id,
        content: `Invalid entityType "${requestedType}". Pick one of: ${PREFILLABLE_ENTITY_TYPES.join(', ')}.`,
      };
    }

    const entityType = requestedType as EntityType;
    const entityConfig = getEntityConfig(entityType);
    if (!entityConfig) {
      onToolCall?.({
        id: toolCall.id,
        name: toolName,
        status: 'failed',
        error: 'no_entity_config',
      });
      return {
        role: 'tool',
        tool_call_id: toolCall.id,
        content: `No config for entity type "${entityType}". Skip prefill.`,
      };
    }

    try {
      const prefill = await generateFormPrefill(entityType, description, entityConfig);
      if (!prefill.success) {
        onToolCall?.({
          id: toolCall.id,
          name: toolName,
          status: 'failed',
          error: prefill.error ?? 'unknown',
        });
        return {
          role: 'tool',
          tool_call_id: toolCall.id,
          content: `Prefill failed: ${prefill.error ?? 'unknown error'}`,
        };
      }

      const fieldCount = Object.keys(prefill.data).length;
      onToolCall?.({
        id: toolCall.id,
        name: toolName,
        status: 'completed',
        resultCount: fieldCount,
        results: [],
      });
      onPrefillProposal?.({
        entityType,
        sourceDescription: description,
        data: prefill.data as Record<string, unknown>,
        confidence: prefill.confidence as Record<string, number>,
      });
      return {
        role: 'tool',
        tool_call_id: toolCall.id,
        content: `Drafted a ${entityType} with ${fieldCount} fields. The user will see a card to review and open in the form. Do not repeat the field values in your response — briefly confirm what you drafted, include ONE short line on why a ${entityType} is the right type for it (tied to the user's own words), and invite them to review. Do NOT call prefill_entity_form again for this same ${entityType} — it is already drafted.`,
      };
    } catch (err) {
      onToolCall?.({
        id: toolCall.id,
        name: toolName,
        status: 'failed',
        error: err instanceof Error ? err.message : 'unknown',
      });
      return { role: 'tool', tool_call_id: toolCall.id, content: 'Prefill failed unexpectedly.' };
    }
  }

  // Unknown tool — return a benign result so the thread stays well-formed.
  return {
    role: 'tool',
    tool_call_id: toolCall.id,
    content: `Unknown tool "${toolName ?? ''}".`,
  };
}
