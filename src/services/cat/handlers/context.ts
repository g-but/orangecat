import { ENTITY_REGISTRY } from '@/config/entity-registry';
import { DATABASE_TABLES } from '@/config/database-tables';
import {
  saveEconomicProfile,
  normalizeEconomicPatch,
  removeFromEconomicProfile,
} from '../economic-profile';
import { forgetMemoriesMatching, rememberFacts, editMemoryMatching } from '../memory';
import type { ActionHandler } from './types';

export const contextHandlers: Record<string, ActionHandler> = {
  // Persist latent economic value the user discloses (skills/assets/goals/etc.)
  // into the structured economic-profile store — the keystone the offer engine
  // and interview build on. Merge-upserts; safe to call repeatedly. Shares the
  // normalizer with the passive extractor so both paths behave identically.
  save_economic_profile: async (supabase, userId, _actorId, params) => {
    const patch = normalizeEconomicPatch(params as Record<string, unknown>);
    if (!patch) {
      return {
        success: false,
        error:
          'Nothing to save — provide at least one of: skills, assets, goals, constraints, asked_for, not_available_for, motivation, stage.',
      };
    }

    const ok = await saveEconomicProfile(supabase, userId, patch);
    if (!ok) {
      return { success: false, error: 'Could not save the economic profile.' };
    }
    const summary = [
      patch.skills?.length && `${patch.skills.length} skill(s)`,
      patch.assets?.length && `${patch.assets.length} asset(s)`,
      patch.goals?.length && `${patch.goals.length} goal(s)`,
      patch.notAvailableFor?.length && `${patch.notAvailableFor.length} scope note(s)`,
    ]
      .filter(Boolean)
      .join(', ');
    return {
      success: true,
      data: { displayMessage: `🧭 Updated your economic profile${summary ? ` (${summary})` : ''}` },
    };
  },

  // One user verb — "that's wrong, remove it" — must clear BOTH stores:
  // free-form memories AND the structured economic profile. Splitting them
  // is how Cat once "removed" a skill that kept driving suggestions.
  forget_memories: async (supabase, userId, _actorId, params) => {
    const facts = Array.isArray(params.facts)
      ? (params.facts as unknown[]).filter((f): f is string => typeof f === 'string')
      : [];
    if (facts.length === 0) {
      return {
        success: false,
        error: 'Nothing to forget — pass the wrong facts as short phrases.',
      };
    }
    const [mem, profile] = await Promise.all([
      forgetMemoriesMatching(supabase, userId, facts),
      removeFromEconomicProfile(supabase, userId, facts),
    ]);
    const removedCount = mem.deleted.length + profile.removed.length;
    const stillUnknown = facts.filter(
      f => mem.notFound.includes(f) && profile.notFound.includes(f)
    );

    // A store that could not be reached is NOT a store with nothing in it.
    // Checked before the no-match branch, because that branch's wording — "no
    // stored memory matched, nothing was removed" — is a factual claim about
    // the user's data that we are in no position to make when the query or the
    // delete failed. Telling someone a memory is gone while it is still there
    // is the worst outcome this feature has.
    const failed = [...mem.failed, ...profile.failed];
    if (failed.length > 0) {
      return {
        success: false,
        error:
          'Could not reach your memories just now, so nothing was removed — ' +
          'please try again in a moment. Nothing has been deleted, and you can ' +
          'check what is stored at Settings → AI → What Cat remembers.',
      };
    }

    if (removedCount === 0) {
      return {
        success: false,
        error:
          'No stored memory or profile entry matched — nothing was removed. The full list is at Settings → AI → What Cat remembers.',
      };
    }
    // List exactly WHAT was removed, not just counts — the user must be able
    // to spot an over-match at a glance (and re-add it), and a bare "removed
    // 2 entries" hides which stored fact survived.
    const removedAll = [...mem.deleted, ...profile.removed];
    const MAX_LISTED = 8;
    const listed = removedAll
      .slice(0, MAX_LISTED)
      .map(r => `"${r.length > 70 ? `${r.slice(0, 70)}…` : r}"`)
      .join(', ');
    const overflow =
      removedAll.length > MAX_LISTED ? ` and ${removedAll.length - MAX_LISTED} more` : '';
    return {
      success: true,
      data: {
        displayMessage:
          `🧹 Removed ${listed}${overflow}.` +
          (stillUnknown.length > 0
            ? ` No stored match found for: ${stillUnknown.join(', ')} — check Settings → AI → What Cat remembers.`
            : ''),
        deletedMemories: mem.deleted,
        removedProfileEntries: profile.removed,
        notFound: stillUnknown,
      },
    };
  },

  // Explicit "remember this" — a user command, not passive extraction. Also
  // lifts any suppression a past forget left behind for the same fact.
  remember_fact: async (supabase, userId, _actorId, params) => {
    const facts = Array.isArray(params.facts)
      ? (params.facts as unknown[]).filter((f): f is string => typeof f === 'string')
      : [];
    if (facts.length === 0) {
      return { success: false, error: 'Nothing to remember — pass one or more short facts.' };
    }
    const result = await rememberFacts(supabase, userId, facts);
    if (result.stored.length === 0 && result.duplicates.length === 0) {
      return { success: false, error: 'Could not store the memory — nothing was saved.' };
    }
    const storedPart =
      result.stored.length > 0
        ? `🧠 Remembered: ${result.stored.map(s => `"${s}"`).join(', ')}.`
        : '';
    const dupPart =
      result.duplicates.length > 0
        ? ` Already knew: ${result.duplicates.map(s => `"${s}"`).join(', ')}.`
        : '';
    return {
      success: true,
      data: {
        displayMessage: `${storedPart}${dupPart}`.trim(),
        stored: result.stored,
        duplicates: result.duplicates,
      },
    };
  },

  // Correct ONE stored memory in place. Ambiguity is surfaced, never guessed
  // through — silently editing the wrong memory is a trust-killer.
  edit_memory: async (supabase, userId, _actorId, params) => {
    const match = typeof params.match === 'string' ? params.match : '';
    const newContent = typeof params.new_content === 'string' ? params.new_content : '';
    if (!match || !newContent) {
      return {
        success: false,
        error: 'Pass "match" (which memory to change) and "new_content" (the corrected fact).',
      };
    }
    const result = await editMemoryMatching(supabase, userId, match, newContent);
    if (!result.ok) {
      if (result.reason === 'ambiguous') {
        return {
          success: false,
          error: `Several memories match: ${(result.candidates ?? [])
            .map(c => `"${c}"`)
            .join(
              ', '
            )}. Ask the user which one to change, then call edit_memory with more specific wording.`,
        };
      }
      if (result.reason === 'not_found') {
        return {
          success: false,
          error:
            'No stored memory matched — nothing was changed. The full list is at Settings → AI → What Cat remembers.',
        };
      }
      return { success: false, error: 'Updating the memory failed — nothing was changed.' };
    }
    return {
      success: true,
      data: {
        displayMessage: `✏️ Updated memory: "${result.previous}" → "${result.updated}"`,
        previous: result.previous,
        updated: result.updated,
      },
    };
  },

  add_context: async (supabase, _userId, actorId, params) => {
    const { data, error } = await supabase
      .from(ENTITY_REGISTRY.document.tableName)
      .insert({
        actor_id: actorId,
        title: params.title,
        content: params.content,
        document_type: params.document_type || 'notes',
        visibility: 'cat_visible',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return {
      success: true,
      data: { ...data, displayMessage: `🧠 Saved to your Cat context: "${params.title}"` },
    };
  },

  update_profile: async (supabase, userId, _actorId, params) => {
    // Update the user's public profile. Only safe text fields — no username (affects URLs),
    // no email, no financial addresses. Profile.id = auth.users.id = userId.
    const SAFE_FIELDS = [
      'name',
      'bio',
      'background',
      'website',
      'location_city',
      'location_country',
    ] as const;
    type SafeField = (typeof SAFE_FIELDS)[number];

    const updates: Partial<Record<SafeField, string>> = {};
    for (const field of SAFE_FIELDS) {
      if (params[field] !== undefined && params[field] !== null) {
        updates[field] = params[field] as string;
      }
    }

    if (Object.keys(updates).length === 0) {
      return {
        success: false,
        error:
          'No profile fields to update — provide at least one of: name, bio, background, website, location_city, location_country',
      };
    }

    const { data, error } = await supabase
      .from(DATABASE_TABLES.PROFILES)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('name, bio, background, website, location_city, location_country')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const updatedFields = Object.keys(updates).join(', ');
    return {
      success: true,
      data: {
        ...data,
        displayMessage: `✅ Profile updated: ${updatedFields}`,
      },
    };
  },
};
