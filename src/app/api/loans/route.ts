/**
 * Loans API - List and Create
 *
 * GET  /api/loans - List loans with pagination and filtering
 * POST /api/loans - Create a new loan
 */

import { loanSchema } from '@/lib/validation';
import { createLoan } from '@/domain/loans/service';
import { createEntityListHandler } from '@/lib/api/entityListHandler';
import { createEntityPostHandler } from '@/lib/api/entityPostHandler';

// GET /api/loans - List loans with pagination and filtering
// Uses generic entity list handler with status filter support
export const GET = createEntityListHandler({
  entityType: 'loan',
  publicStatuses: ['active'],
  additionalFilters: { status: 'status' }, // Allow status filter from URL params
});

// POST /api/loans - Create a new loan (mock mode supported)
export const POST = createEntityPostHandler({
  entityType: 'loan',
  schema: loanSchema,
  createEntity: async (userId, data, supabase) => {
    return await createLoan(userId, data as any, supabase);
  },
});
