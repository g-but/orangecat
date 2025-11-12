import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/utils/logger';

/**
 * Toggle favorite status for a project
 * POST /api/projects/[id]/favorite - Add to favorites
 * DELETE /api/projects/[id]/favorite - Remove from favorites
 */
async function handleToggleFavorite(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const user = request.user;
    const { id: projectId } = await params;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Verify project exists
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if already favorited
    const { data: existingFavorite, error: favoriteCheckError } = await supabase
      .from('project_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('project_id', projectId)
      .maybeSingle();

    if (favoriteCheckError) {
      logger.error('Error checking favorite status:', favoriteCheckError);
      return NextResponse.json({ error: 'Failed to check favorite status' }, { status: 500 });
    }

    if (request.method === 'POST') {
      // Add to favorites
      if (existingFavorite) {
        return NextResponse.json({
          success: true,
          isFavorited: true,
          message: 'Project already in favorites',
        });
      }

      const { error: insertError } = await supabase.from('project_favorites').insert({
        user_id: user.id,
        project_id: projectId,
      });

      if (insertError) {
        logger.error('Error adding favorite:', insertError);
        return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        isFavorited: true,
        message: 'Project added to favorites',
      });
    } else if (request.method === 'DELETE') {
      // Remove from favorites
      if (!existingFavorite) {
        return NextResponse.json({
          success: true,
          isFavorited: false,
          message: 'Project not in favorites',
        });
      }

      const { error: deleteError } = await supabase
        .from('project_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('project_id', projectId);

      if (deleteError) {
        logger.error('Error removing favorite:', deleteError);
        return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        isFavorited: false,
        message: 'Project removed from favorites',
      });
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    logger.error('Unexpected error in favorite toggle:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Check if a project is favorited by the current user
 * GET /api/projects/[id]/favorite
 */
async function handleGetFavoriteStatus(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const user = request.user;
    const { id: projectId } = await params;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const { data: favorite, error: favoriteError } = await supabase
      .from('project_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('project_id', projectId)
      .maybeSingle();

    if (favoriteError) {
      logger.error('Error checking favorite status:', favoriteError);
      return NextResponse.json({ error: 'Failed to check favorite status' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      isFavorited: !!favorite,
    });
  } catch (error) {
    logger.error('Unexpected error checking favorite status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withAuth(handleToggleFavorite);
export const DELETE = withAuth(handleToggleFavorite);
export const GET = withAuth(handleGetFavoriteStatus);
