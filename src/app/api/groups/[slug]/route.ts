/**
 * Unified Group Detail API Route
 *
 * Handles GET, PUT, DELETE operations for a specific group by slug.
 * Uses unified GroupsService.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Created unified group detail API route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import groupsService from '@/services/groups';
import { updateGroupSchema } from '@/services/groups/validation';
import { logger } from '@/utils/logger';
import type { UpdateGroupInput } from '@/types/group';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { slug } = await params;

    // Get group by slug (second param is bySlug=true)
    const result = await groupsService.getGroup(slug, true);

    if (!result.success) {
      if (result.error?.includes('not found')) {
        return NextResponse.json(
          { error: 'Group not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: result.error || 'Failed to fetch group' },
        { status: 500 }
      );
    }

    return NextResponse.json({ group: result.group });
  } catch (error) {
    logger.error('Error in GET /api/groups/[slug]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const body = await request.json();

    // Validate request
    const validationResult = updateGroupSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Get group first to check permissions
    const groupResult = await groupsService.getGroup(slug, true);
    if (!groupResult.success || !groupResult.group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to update
    const canUpdate = await groupsService.checkGroupPermission(
      groupResult.group.id,
      user.id,
      'canManageSettings'
    );

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to update this group' },
        { status: 403 }
      );
    }

    // Update group
    const result = await groupsService.updateGroup(
      groupResult.group.id,
      validationResult.data as UpdateGroupInput
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update group' },
        { status: 500 }
      );
    }

    return NextResponse.json({ group: result.group });
  } catch (error) {
    logger.error('Error in PUT /api/groups/[slug]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;

    // Get group first to check permissions
    const groupResult = await groupsService.getGroup(slug, true);
    if (!groupResult.success || !groupResult.group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if user is owner
    if (groupResult.group.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: Only the owner can delete this group' },
        { status: 403 }
      );
    }

    // Delete group
    const result = await groupsService.deleteGroup(groupResult.group.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete group' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error in DELETE /api/groups/[slug]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


