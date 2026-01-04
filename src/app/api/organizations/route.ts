/**
 * Organizations API Route - Backward Compatibility Wrapper
 *
 * Uses unified groups API, filtering out circles.
 * Maintains backward compatibility for existing clients.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Updated to use unified groups API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import groupsService from '@/services/groups';
import { createGroupSchema } from '@/services/groups/validation';
import { logger } from '@/utils/logger';
import type { CreateGroupInput } from '@/types/group';

// GET /api/organizations - Get organizations (exclude circles)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get('filter'); // 'my' for user's orgs
    const pageSize = parseInt(searchParams.get('limit') || '20');

    if (filter === 'my' && user) {
      // Get user's groups, filter out circles (userId obtained internally)
      const result = await groupsService.getUserGroups({}, { page: 1, pageSize });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to fetch organizations' },
          { status: 500 }
        );
      }

      // Filter out circles (label === 'circle')
      const organizations = (result.groups || []).filter((g) => g.label !== 'circle');

      return NextResponse.json({
        organizations,
        count: organizations.length,
      });
    } else {
      // Get available groups (public), filter out circles
      const result = await groupsService.getAvailableGroups(
        { is_public: true },
        { page: 1, pageSize }
      );

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to fetch organizations' },
          { status: 500 }
        );
      }

      // Filter out circles (label === 'circle')
      const organizations = (result.groups || []).filter((g) => g.label !== 'circle');

      return NextResponse.json({
        organizations,
        count: organizations.length,
      });
    }
  } catch (error) {
    logger.error('Error in GET /api/organizations', { error }, 'Organizations');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/organizations - Create organization
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate and ensure type is NOT 'circle'
    const validationResult = createGroupSchema.safeParse({
      ...body,
      type: body.type && body.type !== 'circle' ? body.type : 'organization',
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Create group (organization)
    const result = await groupsService.createGroup(validationResult.data as CreateGroupInput);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create organization' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { organization: result.group },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error in POST /api/organizations', { error }, 'Organizations');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
