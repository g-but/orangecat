/**
 * DOCUMENT [ID] API ROUTE
 *
 * Handles getting, updating, and deleting a single document.
 *
 * Created: 2026-01-20
 * Last Modified: 2026-01-20
 * Last Modified Summary: Initial creation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { compose } from '@/lib/api/compose';
import { withRateLimit } from '@/lib/api/withRateLimit';
import { withRequestId } from '@/lib/api/withRequestId';
import { documentSchema } from '@/lib/validation';
import {
  handleApiError,
  apiSuccess,
  apiNotFound,
  apiValidationError,
} from '@/lib/api/standardResponse';
import { getDocument, updateDocument, deleteDocument } from '@/domain/documents/service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/documents/[id] - Get a single document
export const GET = compose(
  withRequestId(),
  withRateLimit('read')
)(async (_request: NextRequest, context: RouteContext) => {
  try {
    const { id } = await context.params;

    const document = await getDocument(id);
    if (!document) {
      return apiNotFound('Document');
    }

    return apiSuccess(document);
  } catch (error) {
    return handleApiError(error);
  }
});

// PUT /api/documents/[id] - Update a document
export const PUT = compose(
  withRequestId(),
  withRateLimit('write')
)(async (request: NextRequest, context: RouteContext) => {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    // Validate input (partial schema)
    const result = documentSchema.partial().safeParse(body);
    if (!result.success) {
      return apiValidationError('Invalid document data', { details: result.error.errors });
    }

    const document = await updateDocument(id, user.id, result.data);
    return apiSuccess(document);
  } catch (error) {
    return handleApiError(error);
  }
});

// DELETE /api/documents/[id] - Delete a document
export const DELETE = compose(
  withRequestId(),
  withRateLimit('write')
)(async (_request: NextRequest, context: RouteContext) => {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    await deleteDocument(id, user.id);
    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
});
