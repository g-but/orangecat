/**
 * DOCUMENT API ROUTE
 *
 * Handles listing and creating documents.
 *
 * Created: 2026-01-20
 * Last Modified: 2026-01-20
 * Last Modified Summary: Initial creation
 */

import { NextRequest } from 'next/server';
import { compose } from '@/lib/api/compose';
import { withRateLimit } from '@/lib/api/withRateLimit';
import { withRequestId } from '@/lib/api/withRequestId';
import { documentSchema } from '@/lib/validation';
import { handleApiError, apiSuccess } from '@/lib/api/standardResponse';
import { getPagination } from '@/lib/api/query';
import { listDocumentsPage, createDocument } from '@/domain/documents/service';
import { calculatePage, getCacheControl } from '@/lib/api/helpers';
import { createEntityPostHandler } from '@/lib/api/entityPostHandler';
import type { DocumentType, DocumentVisibility, DocumentFormData } from '@/lib/validation';

// GET /api/documents - Get all documents for the current user
export const GET = compose(
  withRequestId(),
  withRateLimit('read')
)(async (request: NextRequest) => {
  try {
    const { limit, offset } = getPagination(request.url, { defaultLimit: 20, maxLimit: 100 });
    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id');
    const documentType = url.searchParams.get('document_type') as DocumentType | null;
    const visibility = url.searchParams.get('visibility') as DocumentVisibility | null;

    const filters: { document_type?: DocumentType; visibility?: DocumentVisibility } = {};
    if (documentType) {
      filters.document_type = documentType;
    }
    if (visibility) {
      filters.visibility = visibility;
    }

    const { items, total } = await listDocumentsPage(limit, offset, userId || undefined, filters);
    return apiSuccess(items, {
      page: calculatePage(offset, limit),
      limit,
      total,
      headers: { 'Cache-Control': getCacheControl(false) },
    });
  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/documents - Create new document
export const POST = createEntityPostHandler({
  entityType: 'document',
  schema: documentSchema,
  createEntity: async (userId, data, _supabase) => {
    return (await createDocument(userId, data as DocumentFormData)) as unknown as Record<
      string,
      unknown
    >;
  },
});
