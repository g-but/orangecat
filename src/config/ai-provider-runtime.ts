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
}

/**
 * Providers whose keys can also generate images via the OpenAI-compatible
 * POST {baseUrl}/images/generations endpoint (base URL comes from
 * PROVIDER_RUNTIME above — same provider, same key).
 *
 * BYOK-only by design: the platform free pool is text-only and must never
 * pay for image generation. OpenRouter is deliberately absent — its image
 * output rides /chat/completions with a different response shape.
 */
export const IMAGE_PROVIDER_RUNTIME: Record<string, ImageProviderRuntimeConfig> = {
  openai: { defaultImageModel: 'gpt-image-1' },
  xai: { defaultImageModel: 'grok-2-image' },
};

export function getImageProviderRuntime(
  providerId: string
): (ImageProviderRuntimeConfig & ProviderRuntimeConfig) | null {
  const image = IMAGE_PROVIDER_RUNTIME[providerId];
  const base = PROVIDER_RUNTIME[providerId];
  return image && base ? { ...base, ...image } : null;
}
