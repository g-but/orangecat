import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { handleApiError, apiSuccess, apiUnauthorized } from '@/lib/api/standardResponse';
import { updateCause, deleteCause } from '@/domain/causes/service';

// PUT /api/causes/[id] - Update cause
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return apiUnauthorized('Unauthorized');
    }

    const body = await request.json();
    const updatedCause = await updateCause(id, user.id, body);

    return apiSuccess(updatedCause);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/causes/[id] - Delete cause
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return apiUnauthorized('Unauthorized');
    }

    await deleteCause(id, user.id);

    return apiSuccess({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
