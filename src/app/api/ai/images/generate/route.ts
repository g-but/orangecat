/**
 * AI image generation — BYOK-ONLY.
 *
 * GET  — capability probe: does this user have a valid key from an
 *        image-capable provider (IMAGE_PROVIDER_RUNTIME)?
 * POST — generate an image from a prompt with the USER'S OWN key, persist it
 *        to storage, return a stable public URL.
 *
 * The platform free pool (Groq/OpenRouter text models) is NEVER used here and
 * checkPlatformUsage/incrementPlatformUsage are deliberately absent: image
 * generation only ever spends the user's own credits, so it cannot drain the
 * platform quota. Only the generic write rate limit applies.
 */

import type { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { createRateLimitResponse, rateLimitWriteAsync } from '@/lib/rate-limit';
import { apiBadRequest, apiError, apiInternalError, apiSuccess } from '@/lib/api/standardResponse';
import { createApiKeyService } from '@/services/ai/api-key-service';
import { IMAGE_PROVIDER_RUNTIME, getImageProviderRuntime } from '@/config/ai-provider-runtime';
import { generateImageWithKey } from '@/services/images/generate';
import { getAdminClient } from '@/lib/supabase/admin';
import { STORAGE_BUCKETS } from '@/config/database-tables';
import { logger } from '@/utils/logger';

const bodySchema = z.object({
  prompt: z.string().trim().min(3).max(1000),
});

const MIME_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  const { user, supabase } = request;
  try {
    const keys = await createApiKeyService(supabase).getKeys(user.id);
    const capable = keys.find(k => k.is_valid && k.provider in IMAGE_PROVIDER_RUNTIME);
    return apiSuccess({
      canGenerate: Boolean(capable),
      provider: capable?.provider ?? null,
    }) as NextResponse;
  } catch (error) {
    logger.error('images/generate capability probe failed', error, 'ImagesAPI');
    return apiInternalError('Could not check image generation availability.');
  }
});

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  const { user, supabase } = request;
  try {
    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {
      return createRateLimitResponse(rl) as NextResponse;
    }

    const parsed = bodySchema.safeParse(await (request as NextRequest).json().catch(() => ({})));
    if (!parsed.success) {
      return apiBadRequest('Invalid request', parsed.error.flatten());
    }
    const { prompt } = parsed.data;

    // First image-capable key in the user's own fallback-chain order.
    const keys = await createApiKeyService(supabase).listDecryptedKeysOrdered(user.id);
    const imageKey = keys.find(k => k.provider in IMAGE_PROVIDER_RUNTIME);
    if (!imageKey) {
      return apiError(
        'Image generation needs your own OpenAI or xAI API key. Add one in Settings → AI.',
        'NO_IMAGE_KEY',
        400
      );
    }

    const runtime = getImageProviderRuntime(imageKey.provider);
    if (!runtime) {
      return apiInternalError('Image provider is not configured.');
    }

    const result = await generateImageWithKey({
      apiKey: imageKey.key,
      baseUrl: runtime.baseUrl,
      model: runtime.defaultImageModel,
      prompt,
    });
    if (!result.ok) {
      return apiError(`Image generation failed: ${result.error}`, 'UPSTREAM_ERROR', 502);
    }

    // Persist a stable copy — provider URLs/base64 are ephemeral. The admin
    // client bypasses RLS, so the path MUST be scoped to the authenticated
    // user id (mirrors the browser cover-upload path convention).
    const ext = MIME_EXT[result.image.mimeType] ?? 'png';
    const path = `${user.id}/ai-gen_${Date.now()}.${ext}`;
    const admin = getAdminClient();
    const { error: uploadError } = await admin.storage
      .from(STORAGE_BUCKETS.BANNERS)
      .upload(path, result.image.bytes, {
        contentType: result.image.mimeType,
        cacheControl: '31536000',
        upsert: false,
      });
    if (uploadError) {
      logger.error('Generated image upload failed', { error: uploadError }, 'ImagesAPI');
      return apiInternalError('Could not save the generated image. Please try again.');
    }

    const { data: urlData } = admin.storage.from(STORAGE_BUCKETS.BANNERS).getPublicUrl(path);
    return apiSuccess({
      url: urlData.publicUrl,
      provider: imageKey.provider,
      model: runtime.defaultImageModel,
    }) as NextResponse;
  } catch (error) {
    logger.error('images/generate failed', error, 'ImagesAPI');
    return apiInternalError('Could not generate an image right now. Please try again.');
  }
});
