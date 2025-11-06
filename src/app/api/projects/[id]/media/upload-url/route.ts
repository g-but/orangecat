import { createServerClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient();

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
      // Log error but don't block upload - client-side validation handles this
      console.error('Error checking media count:', countError);
    }

    // Allow upload if count is less than 3 (0, 1, or 2 images)
    if (count !== null && count >= 3) {
      return Response.json({ error: 'Maximum 3 images per project' }, { status: 400 });
    }

    const { fileName } = await request.json();
    const ext = (fileName?.split('.').pop() || 'jpg').toLowerCase();
    const allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    if (!allowed.includes(ext)) {
      return Response.json(
        { error: `Invalid file type. Allowed: ${allowed.join(', ')}` },
        { status: 400 }
      );
    }

    const filePath = `${params.id}/${crypto.randomUUID()}.${ext}`;

    const { data, error } = await supabase.storage
      .from('project-media')
      .createSignedUploadUrl(filePath);

    if (error) {
      throw error;
    }

    return Response.json({ upload_url: data.signedUrl, path: data.path, token: data.token });
  } catch (err: any) {
    return Response.json(
      { error: err?.message || 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
