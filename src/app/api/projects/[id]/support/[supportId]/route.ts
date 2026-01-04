/**
 * Project Support Detail API Route
 *
 * Handles individual project support operations (delete).
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Created project support detail API route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import projectSupportService from '@/services/projects/support';
import { logger } from '@/utils/logger';

interface RouteParams {
  params: Promise<{ id: string; supportId: string }>;
}

// DELETE /api/projects/[id]/support/[supportId] - Delete project support
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { supportId } = await params;
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete support
    const result = await projectSupportService.deleteProjectSupport(supportId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete support' },
        { status: result.error === 'Unauthorized' || result.error === 'Forbidden' ? 403 : 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error in DELETE /api/projects/[id]/support/[supportId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


