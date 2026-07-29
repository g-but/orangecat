/**
 * Browser client for AI image suggestions. Thin fetch wrapper that returns the
 * suggested search terms + royalty-free candidates, or throws a friendly Error
 * the picker can surface.
 */

import type { ImageSuggestResult } from '@/services/images/types';

export function suggestArticleImages(opts: {
  title?: string;
  body?: string;
  query?: string;
}): Promise<ImageSuggestResult> {
  return fetch('/api/ai/images/suggest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opts),
  }).then(async res => {
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      const err = json?.error;
      const message =
        (typeof err === 'string' ? err : err?.message) ||
        'Could not suggest images right now. Please try again.';
      throw new Error(message);
    }
    return json.data as ImageSuggestResult;
  });
}
