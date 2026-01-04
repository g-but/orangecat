/**
 * Organization Detail API Route - Backward Compatibility Wrapper
 *
 * Uses unified groups service. Looks up organization by ID to get slug,
 * then calls unified groups API.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Updated to use unified groups API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import groupsService from '@/services/groups';
import { logger } from '@/utils/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function getOrgSlugById(id: string): Promise<string | null> {
  const supabase = await createServerClient();

  const { data: org } = await supabase
      .from('groups')
    .select('slug')
    .eq('id', id)
    .single();

  return org?.slug || null;
}

// GET /api/organizations/[id] - Get organization by ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const slug = await getOrgSlugById(id);

    if (!slug) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Use unified groups service
    const result = await groupsService.getGroup(slug, true);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch organization' },
        { status: result.error?.includes('not found') ? 404 : 500 }
      );
    }

    return NextResponse.json({ group: result.group });
  } catch (error) {
    logger.error('Error in GET /api/organizations/[id]', { error }, 'Organizations');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/organizations/[id] - Update organization
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const slug = await getOrgSlugById(id);

    if (!slug) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    // Ensure type is NOT 'circle' (organizations only)
    const bodyWithType = {
      ...body,
      type: body.type && body.type !== 'circle' ? body.type : 'organization',
    };

    // Get group first to check permissions
    const groupResult = await groupsService.getGroup(slug, true);
    if (!groupResult.success || !groupResult.group) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Update using unified service
    const result = await groupsService.updateGroup(groupResult.group.id, bodyWithType);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update organization' },
        { status: 500 }
      );
    }

    return NextResponse.json({ group: result.group });
  } catch (error) {
    logger.error('Error in PUT /api/organizations/[id]', { error }, 'Organizations');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/organizations/[id] - Delete organization
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const slug = await getOrgSlugById(id);

    if (!slug) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get group first to check permissions
    const groupResult = await groupsService.getGroup(slug, true);
    if (!groupResult.success || !groupResult.group) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Delete using unified service
    const result = await groupsService.deleteGroup(groupResult.group.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete organization' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error in DELETE /api/organizations/[id]', { error }, 'Organizations');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
