/**
 * Feed syndication sweep — the PULL half of cross-posting.
 *
 * Reads each configured fleet feed (config/syndication.ts) and lands new items
 * on the subject project's OrangeCat wall through the existing external publish
 * bus, which supplies idempotency (source + external_id upsert), origin
 * allow-listing, and the "via …" attribution. Re-running is always safe: a
 * previously-seen item reconciles the same row instead of duplicating it.
 *
 * Rides the per-minute reconcile cron (deploys install no new timers), so it
 * throttles itself: a tick inside the interval is a cheap no-op.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { getTableName } from '@/config/entity-registry';
import { logger } from '@/utils/logger';
import { externalPublishSchema } from '@/config/external-publish';
import {
  SYNDICATION_FEEDS,
  SYNDICATION_MAX_ITEMS_PER_SWEEP,
  SYNDICATION_SWEEP_INTERVAL_MS,
  type SyndicationFeed,
} from '@/config/syndication';
import { ingestExternalEvent } from '@/services/timeline/externalPublish';
import { parseRssItems } from './rss';
import type { AnySupabaseClient } from '@/lib/supabase/types';

export interface SyndicationSweepSummary {
  ran: boolean;
  feeds: number;
  published: number;
  reconciled: number;
  skipped: number;
  errors: number;
}

const SKIPPED: SyndicationSweepSummary = {
  ran: false,
  feeds: 0,
  published: 0,
  reconciled: 0,
  skipped: 0,
  errors: 0,
};

let lastRunAt = 0;

/** Test seam: reset the throttle without waiting out the interval. */
export function resetSyndicationThrottleForTests(): void {
  lastRunAt = 0;
}

async function fetchFeed(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) {
      logger.warn('Syndication feed fetch failed', { url, status: response.status }, 'Syndication');
      return null;
    }
    return await response.text();
  } catch (error) {
    logger.warn('Syndication feed unreachable', { url, error: String(error) }, 'Syndication');
    return null;
  }
}

async function sweepFeed(
  db: AnySupabaseClient,
  feed: SyndicationFeed,
  summary: SyndicationSweepSummary
): Promise<void> {
  const xml = await fetchFeed(feed.feedUrl);
  if (!xml) {
    summary.errors += 1;
    return;
  }

  // The bus enforces "caller owns the subject project"; the sweep publishes on
  // the owner's behalf, so resolve who that is from the same authz SSOT.
  const { data: project } = await db
    .from(getTableName('project'))
    .select('user_id')
    .eq('id', feed.subjectProjectId)
    .maybeSingle();
  const ownerUserId = (project as { user_id: string | null } | null)?.user_id;
  if (!ownerUserId) {
    logger.error(
      'Syndication feed points at a project with no owner',
      { projectId: feed.subjectProjectId },
      'Syndication'
    );
    summary.errors += 1;
    return;
  }

  for (const item of parseRssItems(xml).slice(0, SYNDICATION_MAX_ITEMS_PER_SWEEP)) {
    const parsed = externalPublishSchema.safeParse({
      source: feed.source,
      external_id: item.guid.slice(0, 200),
      event_type: feed.eventType,
      subject_type: 'project',
      subject_id: feed.subjectProjectId,
      title: item.title.slice(0, 200),
      ...(item.description ? { description: item.description.slice(0, 2000) } : {}),
      url: item.link,
      ...(item.publishedAt ? { event_timestamp: item.publishedAt } : {}),
      visibility: 'public',
    });
    if (!parsed.success) {
      summary.skipped += 1;
      continue;
    }

    const result = await ingestExternalEvent(parsed.data, ownerUserId);
    if (!result.ok) {
      logger.warn(
        'Syndication item rejected by publish bus',
        { guid: item.guid, reason: result.reason },
        'Syndication'
      );
      summary.errors += 1;
    } else if (result.status === 'created') {
      summary.published += 1;
    } else {
      summary.reconciled += 1;
    }
  }
}

export async function runSyndicationSweep(options?: {
  force?: boolean;
}): Promise<SyndicationSweepSummary> {
  const now = Date.now();
  if (!options?.force && now - lastRunAt < SYNDICATION_SWEEP_INTERVAL_MS) {
    return SKIPPED;
  }
  lastRunAt = now;

  const summary: SyndicationSweepSummary = {
    ran: true,
    feeds: SYNDICATION_FEEDS.length,
    published: 0,
    reconciled: 0,
    skipped: 0,
    errors: 0,
  };
  const db = createAdminClient() as unknown as AnySupabaseClient;

  for (const feed of SYNDICATION_FEEDS) {
    await sweepFeed(db, feed, summary);
  }

  if (summary.published > 0 || summary.errors > 0) {
    logger.info('Syndication sweep finished', { ...summary }, 'Syndication');
  }
  return summary;
}
