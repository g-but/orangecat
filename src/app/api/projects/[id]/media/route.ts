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

    const { data: existing } = await supabase
      .from('project_media')
      .select('position')
      .eq('project_id', params.id)
      .order('position', { ascending: false })
      .limit(1);

    const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0;
    if (nextPosition >= 3) {
      return Response.json({ error: 'Maximum 3 images' }, { status: 400 });
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
