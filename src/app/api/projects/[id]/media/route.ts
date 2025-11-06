import { createServerClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient();
    const { path, alt_text } = await request.json();

    if (!path || typeof path !== 'string' || !path.startsWith(`${params.id}/`)) {
      return Response.json({ error: 'Invalid storage path' }, { status: 400 });
    }

    const { data: project } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', params.id)
      .single();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !project || user.id !== project.user_id) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check current media count - use fresh query to avoid stale data
    const { count, error: countError } = await supabase
      .from('project_media')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', params.id);

    if (countError) {
      console.error('Error checking media count:', countError);
    }

    // Allow insert if count is less than 3 (0, 1, or 2 images)
    if (count !== null && count >= 3) {
      return Response.json({ error: 'Maximum 3 images per project' }, { status: 400 });
    }

    // Find the first available position (0, 1, or 2)
    // Get all existing positions
    const { data: existing } = await supabase
      .from('project_media')
      .select('position')
      .eq('project_id', params.id);

    const existingPositions = (existing || []).map(m => m.position).sort((a, b) => a - b);

    // Find first available position (0, 1, or 2)
    let nextPosition = 0;
    for (let i = 0; i < 3; i++) {
      if (!existingPositions.includes(i)) {
        nextPosition = i;
        break;
      }
    }

    // Safety check: if somehow all positions are taken (shouldn't happen due to count check)
    if (nextPosition > 2) {
      return Response.json({ error: 'Maximum 3 images per project' }, { status: 400 });
    }

    const { data: media, error } = await supabase
      .from('project_media')
      .insert({ project_id: params.id, storage_path: path, position: nextPosition, alt_text })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return Response.json({ success: true, media });
  } catch (err: any) {
    return Response.json({ error: err?.message || 'Failed to create media' }, { status: 500 });
  }
}
