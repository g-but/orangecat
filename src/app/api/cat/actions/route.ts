/**
 * My Cat Actions API
 *
 * Endpoints for managing pending actions and action history.
 *
 * GET /api/cat/actions - Get pending actions and recent history
 * POST /api/cat/actions - Execute an action directly (requires permission)
 *
 * Created: 2026-01-21
 * Last Modified: 2026-01-21
 * Last Modified Summary: Initial implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createActionExecutor } from '@/services/cat';
import { z } from 'zod';

// Validation schema
const executeActionSchema = z.object({
  actionId: z.string().min(1),
  parameters: z.record(z.unknown()),
  conversationId: z.string().uuid().optional(),
  messageId: z.string().uuid().optional(),
});

/**
 * GET /api/cat/actions
 * Get pending actions and recent action history
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const actionId = searchParams.get('actionId') || undefined;
    const status = searchParams.get('status') || undefined;

    const executor = createActionExecutor(supabase);

    // Get pending actions and history in parallel
    const [pendingActions, history] = await Promise.all([
      executor.getPendingActions(user.id),
      executor.getActionHistory(user.id, { limit, actionId, status }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        pendingActions,
        history,
      },
    });
  } catch (error) {
    console.error('[API] Get cat actions error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get actions' }, { status: 500 });
  }
}

/**
 * POST /api/cat/actions
 * Execute an action directly (requires permission)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = executeActionSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: parseResult.error.errors },
        { status: 400 }
      );
    }

    // Get user's actor ID
    const { data: actor, error: actorError } = (await supabase
      .from('actors')
      .select('id')
      .eq('user_id', user.id)
      .single()) as { data: { id: string } | null; error: unknown };

    if (actorError || !actor) {
      return NextResponse.json({ success: false, error: 'Actor not found' }, { status: 404 });
    }

    const executor = createActionExecutor(supabase);
    const result = await executor.executeAction(user.id, actor.id, parseResult.data);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error, data: result },
        { status: result.status === 'denied' ? 403 : 400 }
      );
    }
  } catch (error) {
    console.error('[API] Execute cat action error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to execute action' },
      { status: 500 }
    );
  }
}
