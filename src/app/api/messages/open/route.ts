/**
 * Open/Create Conversation API Route
 *
 * POST /api/messages/open
 *
 * Creates or finds an existing conversation based on participants:
 * - Self (empty or just creator): Notes to Self
 * - Direct (one other user): Find existing or create new
 * - Group (2+ other users): Always create new
 *
 * @module api/messages/open
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  openOrCreateConversation,
  RATE_LIMIT_CONFIGS,
  enforceRateLimit,
  getRateLimitHeaders,
  VALIDATION,
} from '@/features/messaging/lib';

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = enforceRateLimit('CONVERSATION_CREATE', user.id);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before creating more conversations.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Parse request body
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const rawParticipantIds = Array.isArray(body?.participantIds) ? body.participantIds : [];
    const title = typeof body?.title === 'string' ? body.title : null;

    // Validate participant count
    if (rawParticipantIds.length > VALIDATION.MAX_PARTICIPANTS) {
      return NextResponse.json(
        { error: `Maximum ${VALIDATION.MAX_PARTICIPANTS} participants allowed` },
        { status: 400 }
      );
    }

    // Validate title length
    if (title && title.length > VALIDATION.TITLE_MAX_LENGTH) {
      return NextResponse.json(
        { error: `Title must be less than ${VALIDATION.TITLE_MAX_LENGTH} characters` },
        { status: 400 }
      );
    }

    // Filter to valid string IDs
    const validParticipantIds = rawParticipantIds.filter(
      (id): id is string => typeof id === 'string' && id.trim().length > 0
    );

    // Open or create conversation
    const result = await openOrCreateConversation(user.id, validParticipantIds, title);

    return NextResponse.json(
      {
        success: true,
        conversationId: result.conversationId,
        isExisting: result.isExisting,
      },
      { headers: getRateLimitHeaders(rateLimitResult) }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[api/messages/open] Error:', message);
    return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 });
  }
}
