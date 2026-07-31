/**
 * Browser client for AI image suggestions. Thin fetch wrapper that returns the
 * suggested search terms + royalty-free candidates, or throws a friendly Error
 * the picker can surface.
 */

import { API_ROUTES } from '@/config/api-routes';
import { unwrapApiResponse } from '@/lib/api/client-response';
import type { ImageSuggestResult } from '@/services/images/types';

export function suggestImages(opts: {
  title?: string;
  body?: string;
  query?: string;
}): Promise<ImageSuggestResult> {
  return fetch(API_ROUTES.AI.IMAGES_SUGGEST, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opts),
  }).then(res =>
    unwrapApiResponse<ImageSuggestResult>(
      res,
      'Could not suggest images right now. Please try again.'
    )
  );
}
