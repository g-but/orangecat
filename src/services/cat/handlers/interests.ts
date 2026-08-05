/**
 * Interest handlers — the user's public discoverability surface, plus topic
 * watches.
 *
 * Publishing is the only Cat action that turns something the Cat learned into
 * something other people can see, so the guard rails are deliberate: the action
 * is high-risk (never automatable), the handler re-validates the topic rather
 * than trusting the model, and removal always succeeds quietly.
 */

import { DATABASE_TABLES } from '@/config/database-tables';
import { publishInterest, unpublishInterest, isValidTopic, cleanTopic } from '../interests';
import type { ActionHandler } from './types';

/** Watches are cheap, but not unlimited — a runaway loop shouldn't fill the table. */
const MAX_ACTIVE_TOPIC_WATCHES = 20;

export const interestHandlers: Record<string, ActionHandler> = {
  publish_interest: async (supabase, userId, _actorId, params) => {
    const raw = String(params.topic ?? '');
    const result = await publishInterest(supabase, userId, raw);
    if (!result.ok) {
      return { success: false, error: result.error };
    }
    return {
      success: true,
      data: {
        topic: result.topic,
        alreadyPublished: result.alreadyPublished,
        message: result.alreadyPublished
          ? `"${result.topic}" was already in your public interests.`
          : `"${result.topic}" is now on your public profile — people searching this topic can find you.`,
      },
    };
  },

  unpublish_interest: async (supabase, userId, _actorId, params) => {
    const raw = String(params.topic ?? '');
    const result = await unpublishInterest(supabase, userId, raw);
    if (!result.ok) {
      return {
        success: false,
        error: `"${raw}" is not in your published interests — nothing to remove.`,
      };
    }
    return {
      success: true,
      data: {
        removed: result.removed,
        message: `Removed "${result.removed}" from your public interests.`,
      },
    };
  },

  watch_topic: async (supabase, userId, _actorId, params) => {
    const raw = String(params.topic ?? '');
    if (!isValidTopic(raw)) {
      return { success: false, error: `"${raw}" is not a usable topic to watch.` };
    }
    const topic = cleanTopic(raw);

    const { data: existing } = await supabase
      .from(DATABASE_TABLES.CAT_WATCHES)
      .select('id, topic')
      .eq('user_id', userId)
      .eq('kind', 'topic_match')
      .eq('status', 'active');
    const rows = (existing ?? []) as { id: string; topic: string | null }[];
    if (rows.some(r => (r.topic ?? '').toLowerCase() === topic.toLowerCase())) {
      return { success: true, data: { topic, message: `Already watching "${topic}".` } };
    }
    if (rows.length >= MAX_ACTIVE_TOPIC_WATCHES) {
      return {
        success: false,
        error: `You already have ${rows.length} active topic watches (max ${MAX_ACTIVE_TOPIC_WATCHES}).`,
      };
    }

    const { error } = await supabase.from(DATABASE_TABLES.CAT_WATCHES).insert({
      user_id: userId,
      kind: 'topic_match',
      label: `Someone new is working on ${topic}`,
      topic,
    });
    if (error) {
      return { success: false, error: 'Could not set up that watch.' };
    }
    return {
      success: true,
      data: { topic, message: `Watching "${topic}" — I'll tell you as soon as someone shows up.` },
    };
  },
};
