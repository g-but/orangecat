/**
 * Browser client for BYOK image generation. Same thin-fetch style as
 * suggestImages: unwrap { success, data } or throw a friendly Error.
 */

import { API_ROUTES } from '@/config/api-routes';
import { unwrapApiResponse } from '@/lib/api/client-response';

export interface ImageGenCapability {
  canGenerate: boolean;
  provider: string | null;
}

export interface GeneratedImageRef {
  url: string;
  provider: string;
  model: string;
}

// Capability changes only when the user's keys change, so cache it briefly —
// re-opening the picker shouldn't re-probe (or flash a loading state).
const CAPABILITY_TTL_MS = 5 * 60_000;
let capabilityCache: { value: ImageGenCapability; at: number } | null = null;

export async function fetchImageGenCapability(): Promise<ImageGenCapability> {
  if (capabilityCache && Date.now() - capabilityCache.at < CAPABILITY_TTL_MS) {
    return capabilityCache.value;
  }
  try {
    const res = await fetch(API_ROUTES.AI.IMAGES_GENERATE);
    const value = await unwrapApiResponse<ImageGenCapability>(res, 'unavailable');
    capabilityCache = { value, at: Date.now() };
    return value;
  } catch {
    // A failed probe just means "treat as not available" — never block the
    // UI, and never cache the failure.
    return { canGenerate: false, provider: null };
  }
}

export function generateImage(prompt: string): Promise<GeneratedImageRef> {
  return fetch(API_ROUTES.AI.IMAGES_GENERATE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  }).then(res =>
    unwrapApiResponse<GeneratedImageRef>(res, 'Could not generate an image. Please try again.')
  );
}
