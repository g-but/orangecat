/**
 * Group Members API Route
 *
 * Handles member operations for a group.
 * Uses unified GroupsService.
 *
 * Created: 2025-01-30
 * Last Modified: 2026-01-28
 * Last Modified Summary: Refactored POST to use withAuth middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import groupsService from '@/services/groups';
import { logger } from '@/utils/logger';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { slug } = await context.params;

    // Get group first
    const groupResult = await groupsService.getGroup(slug, !!user);
    if (!groupResult.success || !groupResult.group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Get members
    const membersResult = await groupsService.getGroupMembers(groupResult.group.id);

    if (!membersResult.success) {
      return NextResponse.json(
        { error: membersResult.error || 'Failed to fetch members' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      members: membersResult.members || [],
      total: membersResult.total || 0,
    });
  } catch (error) {
    logger.error('Error in GET /api/groups/[slug]/members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { slug } = await context.params;
    const _body = await request.json();

    // Get group first
    const groupResult = await groupsService.getGroup(slug, true);
    if (!groupResult.success || !groupResult.group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Join group
    const result = await groupsService.joinGroup(groupResult.group.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to join group' }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, message: 'Successfully joined group' },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error in POST /api/groups/[slug]/members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
