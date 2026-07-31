/**
 * Server-side image generation against a user's OWN provider key. Two call
 * styles (see IMAGE_PROVIDER_RUNTIME): OpenAI-style POST
 * {baseUrl}/images/generations, or OpenRouter's /chat/completions with
 * `modalities: ['image','text']` returning data-URI images. BYOK-only —
 * this is never called with a platform key.
 */

import { logger } from '@/utils/logger';

const GENERATION_TIMEOUT_MS = 90_000;

export interface GeneratedImage {
  bytes: Uint8Array;
  mimeType: string;
}

export type GenerateImageResult =
  | { ok: true; image: GeneratedImage }
  | { ok: false; error: string };

/** Sniff the actual format (keys of IMAGE_MIME_EXT) — providers return PNG, JPEG, or WebP. */
function sniffMimeType(bytes: Uint8Array): string {
  if (bytes[0] === 0x89 && bytes[1] === 0x50) {
    return 'image/png';
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    return 'image/jpeg';
  }
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[8] === 0x57) {
    return 'image/webp';
  }
  return 'image/png';
}

export async function generateImageWithKey(opts: {
  apiKey: string;
  baseUrl: string;
  model: string;
  prompt: string;
  api: 'images' | 'chat';
}): Promise<GenerateImageResult> {
  if (opts.api === 'chat') {
    return generateViaChat(opts);
  }
  return generateViaImagesEndpoint(opts);
}

async function generateViaImagesEndpoint(opts: {
  apiKey: string;
  baseUrl: string;
  model: string;
  prompt: string;
}): Promise<GenerateImageResult> {
  const { apiKey, baseUrl, model, prompt } = opts;

  try {
    const response = await fetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        n: 1,
        // gpt-image-* rejects response_format (it always returns base64);
        // dall-e / grok default to ephemeral URLs unless asked for base64.
        ...(model.startsWith('gpt-image') ? {} : { response_format: 'b64_json' }),
      }),
      signal: AbortSignal.timeout(GENERATION_TIMEOUT_MS),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      const providerMessage = body?.error?.message || `provider returned ${response.status}`;
      logger.warn(
        'Image generation failed upstream',
        { status: response.status, model, providerMessage },
        'ImageGen'
      );
      return { ok: false, error: providerMessage };
    }

    const json = (await response.json().catch(() => null)) as {
      data?: Array<{ b64_json?: string; url?: string }>;
    } | null;
    const first = json?.data?.[0];

    if (first?.b64_json) {
      const bytes = new Uint8Array(Buffer.from(first.b64_json, 'base64'));
      return { ok: true, image: { bytes, mimeType: sniffMimeType(bytes) } };
    }

    // Some providers ignore response_format and hand back an ephemeral URL —
    // fetch it now so the caller can persist a stable copy.
    if (first?.url) {
      const download = await fetch(first.url, {
        signal: AbortSignal.timeout(GENERATION_TIMEOUT_MS),
      });
      if (!download.ok) {
        return { ok: false, error: 'could not download the generated image' };
      }
      const bytes = new Uint8Array(await download.arrayBuffer());
      return { ok: true, image: { bytes, mimeType: sniffMimeType(bytes) } };
    }

    return { ok: false, error: 'provider returned no image' };
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'TimeoutError';
    logger.warn('Image generation request failed', { model, error: String(error) }, 'ImageGen');
    return {
      ok: false,
      error: timedOut ? 'generation timed out — try a simpler prompt' : 'request failed',
    };
  }
}

/**
 * OpenRouter shape: a normal chat completion asked for image output; the
 * generated image comes back as a base64 data URI at
 * choices[0].message.images[n].image_url.url.
 */
async function generateViaChat(opts: {
  apiKey: string;
  baseUrl: string;
  model: string;
  prompt: string;
}): Promise<GenerateImageResult> {
  const { apiKey, baseUrl, model, prompt } = opts;

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        modalities: ['image', 'text'],
      }),
      signal: AbortSignal.timeout(GENERATION_TIMEOUT_MS),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      const providerMessage = body?.error?.message || `provider returned ${response.status}`;
      logger.warn(
        'Image generation (chat) failed upstream',
        { status: response.status, model, providerMessage },
        'ImageGen'
      );
      return { ok: false, error: providerMessage };
    }

    const json = (await response.json().catch(() => null)) as {
      choices?: Array<{ message?: { images?: Array<{ image_url?: { url?: string } }> } }>;
    } | null;
    const dataUri = json?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!dataUri) {
      return { ok: false, error: 'model returned no image — try a different prompt' };
    }

    const base64 = dataUri.includes(',') ? dataUri.slice(dataUri.indexOf(',') + 1) : dataUri;
    const bytes = new Uint8Array(Buffer.from(base64, 'base64'));
    if (bytes.length === 0) {
      return { ok: false, error: 'model returned an empty image' };
    }
    return { ok: true, image: { bytes, mimeType: sniffMimeType(bytes) } };
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'TimeoutError';
    logger.warn(
      'Image generation (chat) request failed',
      { model, error: String(error) },
      'ImageGen'
    );
    return {
      ok: false,
      error: timedOut ? 'generation timed out — try a simpler prompt' : 'request failed',
    };
  }
}
