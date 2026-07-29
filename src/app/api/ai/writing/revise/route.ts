/**
 * POST /api/ai/writing/revise — in-editor AI writing help: transform the
 * author's own article text (improve/continue/tighten/expand/grammar/tone),
 * seed an outline, suggest titles, or generate an excerpt. Thin wrapper over the
 * revise-engine; auth + write-tier rate limit. Never leaks engine internals.
 */

import type { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { createRateLimitResponse, rateLimitWriteAsync } from '@/lib/rate-limit';
import { apiBadRequest, apiError, apiInternalError, apiSuccess } from '@/lib/api/standardResponse';
import { generateExcerpt, reviseText, suggestTitles } from '@/services/cat/writing-revise';
import { logger } from '@/utils/logger';

const bodySchema = z.object({
  action: z.enum([
    'improve',
    'continue',
    'tighten',
    'expand',
    'grammar',
    'tone',
    'outline',
    'title',
    'excerpt',
  ]),
  text: z.string().trim().max(100_000).optional(),
  tone: z.enum(['casual', 'formal', 'punchy', 'warm']).optional(),
  title: z.string().trim().max(300).optional(),
  topic: z.string().trim().max(300).optional(),
  instruction: z.string().trim().max(300).optional(),
  /** 'post' (short) vs 'article' (long-form, default) — changes framing + length. */
  kind: z.enum(['post', 'article']).optional(),
});

const AI_UNAVAILABLE =
  'The AI writer is busy right now. Try again in a moment, or add your own free Groq key in Settings → AI.';

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
    const { action, text, tone, title, topic, instruction, kind } = parsed.data;

    // Title suggestions return a list; everything else returns transformed text.
    if (action === 'title') {
      const suggestions = await suggestTitles(supabase, user.id, text ?? '');
      if (!suggestions.length) {
        return apiError(AI_UNAVAILABLE, 'AI_UNAVAILABLE', 503) as NextResponse;
      }
      return apiSuccess({ suggestions }) as NextResponse;
    }

    if (action === 'excerpt') {
      const result = await generateExcerpt(supabase, user.id, text ?? '', title);
      if (!result) {
        return apiError(AI_UNAVAILABLE, 'AI_UNAVAILABLE', 503) as NextResponse;
      }
      return apiSuccess({ result }) as NextResponse;
    }

    // outline may use `topic`; the rest need `text`.
    if (action !== 'outline' && !text) {
      return apiBadRequest('Nothing to revise — select some text first.');
    }

    const result = await reviseText(supabase, user.id, {
      action,
      text: text ?? '',
      tone,
      title,
      topic,
      instruction,
      kind,
    });
    if (!result) {
      return apiError(AI_UNAVAILABLE, 'AI_UNAVAILABLE', 503) as NextResponse;
    }
    return apiSuccess({ result }) as NextResponse;
  } catch (error) {
    logger.error('writing/revise failed', error, 'WritingAPI');
    return apiInternalError('Could not revise that right now. Please try again.');
  }
});
