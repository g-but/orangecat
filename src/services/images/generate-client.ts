/**
 * Browser client for BYOK image generation. Same thin-fetch style as
 * suggestArticleImages: unwrap { success, data } or throw a friendly Error.
 */

import { API_ROUTES } from '@/config/api-routes';

export interface ImageGenCapability {
  canGenerate: boolean;
  provider: string | null;
}

export interface GeneratedImageRef {
  url: string;
  provider: string;
  model: string;
}

async function unwrap<T>(res: Response, fallback: string): Promise<T> {
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    const err = json?.error;
    const message = (typeof err === 'string' ? err : err?.message) || fallback;
    throw new Error(message);
  }
  return json.data as T;
}

export async function fetchImageGenCapability(): Promise<ImageGenCapability> {
  try {
    const res = await fetch(API_ROUTES.AI.IMAGES_GENERATE);
    return await unwrap<ImageGenCapability>(res, 'unavailable');
  } catch {
    // A failed probe just means "treat as not available" — never block the UI.
    return { canGenerate: false, provider: null };
  }
}

export function generateImage(prompt: string): Promise<GeneratedImageRef> {
  return fetch(API_ROUTES.AI.IMAGES_GENERATE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  }).then(res => unwrap<GeneratedImageRef>(res, 'Could not generate an image. Please try again.'));
}
