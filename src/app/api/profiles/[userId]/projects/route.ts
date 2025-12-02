import { logger } from '@/utils/logger';
import { createServerClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { apiSuccess, apiInternalError } from '@/lib/api/standardResponse';
import { validateUUID, getValidationError } from '@/lib/api/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Validate user ID
    const idValidation = getValidationError(validateUUID(userId, 'user ID'));
    if (idValidation) {
      return idValidation;
    }

    const supabase = await createServerClient();
    // Create a client for storage operations
    const supabaseStorage = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get user's projects (simplified MVP - no organizations)
    // Exclude draft projects from public profiles - drafts should only show in dashboards
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select(
        `
        id,
        title,
        description,
        category,
        tags,
        status,
        bitcoin_address,
        lightning_address,
        goal_amount,
        currency,
        raised_amount,
        bitcoin_balance_btc,
        bitcoin_balance_updated_at,
        created_at,
        updated_at,
        project_media(id, storage_path, position)
      `
      )
      .eq('user_id', userId)
      .neq('status', 'draft') // Exclude drafts from public profile view
      .order('created_at', { ascending: false });

    if (projectsError) {
      logger.error('Failed to fetch user projects', {
        userId,
        error: projectsError.message,
      });
      return apiInternalError('Failed to fetch projects');
    }

    // Process projects to get first media URL
    const projectsWithMedia = (projects || []).map((project: any) => {
      if (project.project_media && project.project_media.length > 0) {
        // Get first media item (sorted by position)
        const firstMedia = project.project_media.sort(
          (a: any, b: any) => a.position - b.position
        )[0];
        const { data: urlData } = supabaseStorage.storage
          .from('project-media')
          .getPublicUrl(firstMedia.storage_path);
        return {
          ...project,
          thumbnail_url: urlData.publicUrl,
          project_media: undefined, // Remove nested data
        };
      }
      return {
        ...project,
        thumbnail_url: null,
        project_media: undefined,
      };
    });

    logger.info('Fetched user projects successfully', {
      userId,
      count: projectsWithMedia.length,
    });

    return apiSuccess(
      {
        data: projectsWithMedia || [],
        counts: {
          total: projectsWithMedia?.length || 0,
        },
      },
      { cache: 'SHORT' }
    );
  } catch (error) {
    logger.error('Unexpected error fetching user projects', { userId, error });
    return apiInternalError('Failed to fetch projects');
  }
}
