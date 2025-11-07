import { logger } from '@/utils/logger';
import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = await createServerClient();
    // Create a client for storage operations
    const supabaseStorage = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { userId } = await params;

    // Get user's projects (simplified MVP - no organizations)
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
      .order('created_at', { ascending: false });

    if (projectsError) {
      throw projectsError;
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

    return NextResponse.json(
      {
        success: true,
        data: projectsWithMedia || [],
        counts: {
          total: projectsWithMedia?.length || 0,
        },
      },
      {
        status: 200,
        headers: {
          // Cache user's projects for 30 seconds (less frequent updates)
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=180',
        },
      }
    );
  } catch (error) {
    logger.error('Error fetching user projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}
