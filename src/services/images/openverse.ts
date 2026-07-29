/**
 * Openverse image search — free, no API key, Creative-Commons licensed images.
 * We default to CC0 + Public-Domain-Mark so a chosen image needs no attribution
 * (there's no caption slot on an article cover), which keeps reuse legally clean.
 * Never throws — returns [] on any failure so the picker degrades to "no results".
 *
 * Why Openverse (not a paid generator): the whole AI-writing surface runs on the
 * free pool and touches no credits; image help should stay the same — zero cost,
 * zero new secrets.
 */

import type { StockImage } from './types';
import { logger } from '@/utils/logger';

const OPENVERSE_URL = 'https://api.openverse.org/v1/images/';
/** CC0 + Public Domain Mark — reusable commercially, no attribution required. */
const LICENSE_FILTER = 'cc0,pdm';

interface OpenverseResult {
  id?: string;
  title?: string;
  url?: string;
  thumbnail?: string;
  creator?: string | null;
  license?: string;
  foreign_landing_url?: string | null;
}

export async function searchOpenverse(query: string, count = 8): Promise<StockImage[]> {
  const q = query.trim();
  if (!q) {
    return [];
  }
  const params = new URLSearchParams({
    q,
    license: LICENSE_FILTER,
    page_size: String(Math.min(Math.max(count, 1), 20)),
    mature: 'false',
  });
  try {
    const res = await fetch(`${OPENVERSE_URL}?${params.toString()}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'OrangeCat/1.0 (+https://orangecat.ch)',
      },
      // Openverse results are stable; cache briefly to spare their rate limit.
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      logger.warn('openverse: search failed', { status: res.status }, 'Openverse');
      return [];
    }
    const json = (await res.json()) as { results?: OpenverseResult[] };
    return (json.results ?? [])
      .filter(r => r.id && r.url && r.thumbnail)
      .map(
        (r): StockImage => ({
          id: r.id as string,
          thumbUrl: r.thumbnail as string,
          fullUrl: r.url as string,
          title: (r.title || 'Untitled').slice(0, 120),
          creator: r.creator ?? null,
          license: r.license || 'cc0',
          sourceUrl: r.foreign_landing_url ?? null,
        })
      );
  } catch (err) {
    logger.warn('openverse: search threw', { err: String(err) }, 'Openverse');
    return [];
  }
}
