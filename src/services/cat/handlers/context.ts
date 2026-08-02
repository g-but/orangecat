import { ENTITY_REGISTRY } from '@/config/entity-registry';
import { DATABASE_TABLES } from '@/config/database-tables';
import {
  saveEconomicProfile,
  normalizeEconomicPatch,
  removeFromEconomicProfile,
} from '../economic-profile';
import { forgetMemoriesMatching } from '../memory';
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
          'Nothing to save — provide at least one of: skills, assets, goals, constraints, asked_for, motivation, stage.',
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
      return { success: false, error: 'Nothing to forget — pass the wrong facts as short phrases.' };
    }
    const [mem, profile] = await Promise.all([
      forgetMemoriesMatching(supabase, userId, facts),
      removeFromEconomicProfile(supabase, userId, facts),
    ]);
    const removedCount = mem.deleted.length + profile.removed.length;
    const stillUnknown = facts.filter(
      f => mem.notFound.includes(f) && profile.notFound.includes(f)
    );
    if (removedCount === 0) {
      return {
        success: false,
        error:
          'No stored memory or profile entry matched — nothing was removed. The full list is at Settings → AI → What Cat remembers.',
      };
    }
    const parts = [
      mem.deleted.length > 0 && `${mem.deleted.length} memor${mem.deleted.length === 1 ? 'y' : 'ies'}`,
      profile.removed.length > 0 && `${profile.removed.length} profile entr${profile.removed.length === 1 ? 'y' : 'ies'}`,
    ]
      .filter(Boolean)
      .join(' and ');
    return {
      success: true,
      data: {
        displayMessage:
          `🧹 Removed ${parts}.` +
          (stillUnknown.length > 0 ? ` No match found for: ${stillUnknown.join(', ')}.` : ''),
        deletedMemories: mem.deleted,
        removedProfileEntries: profile.removed,
        notFound: stillUnknown,
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
