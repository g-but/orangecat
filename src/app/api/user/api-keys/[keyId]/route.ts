/**
 * Single API Key Management
 *
 * DELETE - Remove an API key
 * PATCH - Update API key (set as primary)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createApiKeyService } from '@/services/ai/api-key-service';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ keyId: string }>;
}

const updateKeySchema = z.object({
  isPrimary: z.boolean().optional(),
});

/**
 * DELETE /api/user/api-keys/[keyId]
 * Delete an API key
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { keyId } = await params;
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const keyService = createApiKeyService(supabase);
    const success = await keyService.deleteKey(user.id, keyId);

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete key' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/user/api-keys/[keyId]
 * Update an API key (e.g., set as primary)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { keyId } = await params;
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = updateKeySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const keyService = createApiKeyService(supabase);

    if (result.data.isPrimary) {
      const success = await keyService.setPrimary(user.id, keyId);
      if (!success) {
        return NextResponse.json({ error: 'Failed to set primary key' }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
