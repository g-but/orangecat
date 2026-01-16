/**
 * Unified Groups API Route
 *
 * Handles CRUD operations for groups (circles + organizations).
 * Uses unified GroupsService.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Created unified groups API route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import groupsService from '@/services/groups';
import { createGroupSchema } from '@/services/groups/validation';
import { logger } from '@/utils/logger';
import type { CreateGroupInput } from '@/types/group';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type'); // 'circle', 'organization', etc.
    const category = searchParams.get('category');
    const isPublic = searchParams.get('is_public');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('limit') || '20');

    // Build query filters
    const query = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(type && { type: type as any }),
      ...(category && { category }),
      ...(isPublic !== null && { is_public: isPublic === 'true' }),
    };

    // Get user's groups (userId is obtained internally from auth)
    const userGroupsResult = await groupsService.getUserGroups(query, { page, pageSize });

    if (!userGroupsResult.success) {
      return NextResponse.json(
        { error: userGroupsResult.error || 'Failed to fetch groups' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      groups: userGroupsResult.groups || [],
      total: userGroupsResult.total || 0,
    });
  } catch (error) {
    logger.error('Error in GET /api/groups:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate request
    const validationResult = createGroupSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Create group using server client
    const { createGroup } = await import('@/services/groups/mutations/groups');
    const result = await createGroup(validationResult.data as CreateGroupInput, supabase, user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create group' },
        { status: 500 }
      );
    }

    // Return in format expected by EntityForm (data property)
    return NextResponse.json(
      { data: result.group, group: result.group },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error in POST /api/groups:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

