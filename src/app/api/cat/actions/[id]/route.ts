/**
 * My Cat Pending Action API
 *
 * Endpoints for confirming or rejecting pending actions.
 *
 * POST /api/cat/actions/[id] - Confirm a pending action
 * DELETE /api/cat/actions/[id] - Reject a pending action
 *
 * Created: 2026-01-21
 * Last Modified: 2026-01-21
 * Last Modified Summary: Initial implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createActionExecutor } from '@/services/cat';
import { logger } from '@/utils/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/cat/actions/[id]
 * Confirm and execute a pending action
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: pendingActionId } = await params;

    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
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
    const result = await executor.confirmPendingAction(user.id, actor.id, pendingActionId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error, data: result },
        { status: 400 }
      );
    }
  } catch (error) {
    logger.error('Confirm pending action error', error, 'CatActionsAPI');
    return NextResponse.json(
      { success: false, error: 'Failed to confirm action' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cat/actions/[id]
 * Reject a pending action
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: pendingActionId } = await params;

    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get optional rejection reason from body
    let reason: string | undefined;
    try {
      const body = await request.json();
      reason = body.reason;
    } catch {
      // Body is optional
    }

    const executor = createActionExecutor(supabase);
    await executor.rejectPendingAction(user.id, pendingActionId, reason);

    return NextResponse.json({
      success: true,
      data: { rejected: true },
    });
  } catch (error) {
    logger.error('Reject pending action error', error, 'CatActionsAPI');
    return NextResponse.json({ success: false, error: 'Failed to reject action' }, { status: 500 });
  }
}
