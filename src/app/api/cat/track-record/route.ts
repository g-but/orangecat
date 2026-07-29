/**
 * My Cat Track Record API
 *
 * GET /api/cat/track-record — what actually happened to the entities Cat
 * created with this user (published? funded?). Same derived signal Cat sees
 * in its context (services/cat/track-record.ts); this route only exposes it
 * to the transparency UI. Thin wrapper: auth + delegate + respond.
 */

import { getCatTrackRecord } from '@/services/cat/track-record';
import { logger } from '@/utils/logger';
import { apiSuccess, apiInternalError } from '@/lib/api/standardResponse';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  const { user, supabase } = request;
  try {
    const record = await getCatTrackRecord(supabase, user.id);
    return apiSuccess(record);
  } catch (error) {
    logger.error('Error fetching cat track record', error, 'CatTrackRecordAPI');
    return apiInternalError('Failed to fetch track record');
  }
});
