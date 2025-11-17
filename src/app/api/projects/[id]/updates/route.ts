/**
 * Project Updates API Endpoint
 *
 * GET /api/projects/[id]/updates - Fetch recent project updates
 *
 * Created: 2025-11-17
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/utils/logger';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/projects/[id]/updates
 *
 * Fetches recent updates for a project (updates, donations, milestones)
 * Public endpoint - no authentication required for viewing
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const supabase = await createServerClient();

    // Fetch project to ensure it exists and is viewable
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, status')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      logger.warn('Project not found for updates', { projectId }, 'ProjectUpdatesAPI');
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Only show updates for active or completed projects (privacy)
    if (!['active', 'completed'].includes(project.status)) {
      return NextResponse.json({ updates: [] }, { status: 200 });
    }

    // Fetch recent updates (limit to 10 most recent)
    const { data: updates, error: updatesError } = await supabase
      .from('project_updates')
      .select('id, project_id, type, title, content, amount_btc, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (updatesError) {
      logger.error(
        'Failed to fetch project updates',
        { projectId, error: updatesError },
        'ProjectUpdatesAPI'
      );
      return NextResponse.json({ error: 'Failed to fetch updates' }, { status: 500 });
    }

    return NextResponse.json(
      {
        updates: updates || [],
        count: updates?.length || 0,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Unexpected error in project updates API', { error }, 'ProjectUpdatesAPI');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
