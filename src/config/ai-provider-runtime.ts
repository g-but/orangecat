/**
 * Per-provider runtime configuration for OpenAI-compatible providers.
 *
 * The data layer (`src/data/aiProviders.ts`) is the SSOT for what's shown
 * to users — name, description, key URL, key prefix. This file is the SSOT
 * for what the chat route does with their key — base URL to call, default
 * model to use when the user hasn't picked one explicitly.
 *
 * Anything in this map can be reached by the generic
 * `OpenAICompatibleService` (one class, eight providers). Groq and
 * OpenRouter stay in their own service classes for historical reasons
 * (they predate this unification and have provider-specific niceties —
 * Groq tracks rate-limit headers, OpenRouter tracks BTC cost per model).
 *
 * Created: 2026-06-10
 */

export interface ProviderRuntimeConfig {
  /** Base URL for the OpenAI-compatible chat endpoint (without /chat/completions). */
  baseUrl: string;
  /** Model used when the user hasn't selected one. */
  defaultModel: string;
}

export const PROVIDER_RUNTIME: Record<string, ProviderRuntimeConfig> = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
  },
  together: {
    baseUrl: 'https://api.together.xyz/v1',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
  },
  xai: {
    baseUrl: 'https://api.x.ai/v1',
    defaultModel: 'grok-2-latest',
  },
};

/** Provider IDs the OpenAICompatibleService can serve. */
export const OPENAI_COMPAT_PROVIDER_IDS = Object.keys(PROVIDER_RUNTIME) as Array<
  keyof typeof PROVIDER_RUNTIME
>;

export function getProviderRuntime(providerId: string): ProviderRuntimeConfig | null {
  return PROVIDER_RUNTIME[providerId] ?? null;
}

export function isOpenAICompatibleProvider(providerId: string): boolean {
  return providerId in PROVIDER_RUNTIME;
}

// ---------------------------------------------------------------------------
// Image generation (BYOK-only)
// ---------------------------------------------------------------------------

export interface ImageProviderRuntimeConfig {
  /** Model used for image generation when the user hasn't picked one. */
  defaultImageModel: string;
  /**
   * How the provider exposes image output: the OpenAI-style
   * POST {baseUrl}/images/generations, or a /chat/completions call with
   * `modalities: ['image','text']` (OpenRouter's shape).
   */
  api: 'images' | 'chat';
  /** Only needed when the provider isn't in PROVIDER_RUNTIME (OpenRouter). */
  baseUrl?: string;
}

/**
 * Providers whose keys can also generate images. Base URL comes from
 * PROVIDER_RUNTIME above unless overridden — same provider, same key.
 *
 * BYOK-only by design: the platform free pool is text-only and must never
 * pay for image generation.
 */
export const IMAGE_PROVIDER_RUNTIME: Record<string, ImageProviderRuntimeConfig> = {
  openai: { defaultImageModel: 'gpt-image-1', api: 'images' },
  xai: { defaultImageModel: 'grok-2-image', api: 'images' },
  openrouter: {
    defaultImageModel: 'google/gemini-3.1-flash-image',
    api: 'chat',
    baseUrl: 'https://openrouter.ai/api/v1',
  },
};

export function getImageProviderRuntime(
  providerId: string
): (ImageProviderRuntimeConfig & { baseUrl: string }) | null {
  const image = IMAGE_PROVIDER_RUNTIME[providerId];
  if (!image) {
    return null;
  }
  const baseUrl = image.baseUrl ?? PROVIDER_RUNTIME[providerId]?.baseUrl;
  return baseUrl ? { ...image, baseUrl } : null;
}
