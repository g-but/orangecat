/**
 * Cat Memory Import API
 *
 * POST /api/cat/memories/import  — bring memory from another AI.
 *   body: { text: string }  (the export the user pasted from ChatGPT/Grok/…)
 *   → { total, imported, skipped, embeddingsEnabled }
 *
 * Thin wrapper: parsing, embedding, dedup and storage live in the memory
 * service. RLS-scoped to the caller; write rate-limited like other mutations.
 */

import { importMemories } from '@/services/cat/memory';
import { apiSuccess, apiError, apiRateLimited, handleApiError } from '@/lib/api/standardResponse';
import { rateLimitWriteAsync, retryAfterSeconds } from '@/lib/rate-limit';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';

/** Guard against absurdly large pastes (the parser also caps facts to 200). */
const MAX_TEXT_CHARS = 100_000;

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  const { user, supabase } = request;

  const rl = await rateLimitWriteAsync(user.id);
  if (!rl.success) {
    return apiRateLimited('Too many requests. Please slow down.', retryAfterSeconds(rl));
  }

  try {
    const body = (await request.json().catch(() => null)) as { text?: unknown } | null;
    const text = typeof body?.text === 'string' ? body.text : '';
    if (!text.trim()) {
      return apiError('Paste the exported memory text to import.', 'BAD_REQUEST', 400);
    }
    if (text.length > MAX_TEXT_CHARS) {
      return apiError('That paste is too large (max 100,000 characters).', 'BAD_REQUEST', 400);
    }

    const result = await importMemories(supabase, user.id, text);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
});
