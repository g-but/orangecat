import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import type { AnySupabaseClient } from '@/lib/supabase/types';
import { apiSuccess, apiBadRequest, handleApiError, apiRateLimited } from '@/lib/api/standardResponse';
import {  rateLimitWriteAsync , retryAfterSeconds } from '@/lib/rate-limit';
import { logger } from '@/utils/logger';
import { DATABASE_TABLES } from '@/config/database-tables';
import {
  createDefaultPreferences,
  type NotificationPreferences,
  type NotificationPreferencesUpdate,
  type DigestFrequency,
} from '@/types/notification-preferences';

const TABLE = DATABASE_TABLES.NOTIFICATION_PREFERENCES;
const VALID_DIGEST_FREQUENCIES: DigestFrequency[] = ['daily', 'weekly', 'never'];
const CATEGORY_TOGGLE_KEYS = ['economic_emails', 'social_emails', 'group_emails', 'progress_emails', 'reengagement_emails'] as const;

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { user } = req;
    const admin = createAdminClient() as unknown as AnySupabaseClient;

    const { data, error } = await admin.from(TABLE).select('*').eq('user_id', user.id).maybeSingle();
    if (error) { logger.error('Failed to fetch notification preferences', { error, userId: user.id }, 'NotificationPrefs'); throw error; }
    if (data) {return apiSuccess(data as NotificationPreferences);}

    // First time: create default preferences
    const defaults = createDefaultPreferences(user.id);
    const { data: created, error: insertError } = await admin.from(TABLE).insert(defaults).select().single();

    if (insertError) {
      if (insertError.code === '23505') {
        // Race condition: another request created the row concurrently
        const { data: existing } = await admin.from(TABLE).select('*').eq('user_id', user.id).single();
        return apiSuccess((existing ?? defaults) as NotificationPreferences);
      }
      logger.error('Failed to create default notification preferences', { error: insertError, userId: user.id }, 'NotificationPrefs');
      throw insertError;
    }

    return apiSuccess(created as NotificationPreferences);
  } catch (error) {
    logger.error('Notification preferences GET error', { error }, 'NotificationPrefs');
    return handleApiError(error);
  }
});

export const PUT = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { user } = req;

    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {return apiRateLimited('Too many requests. Please slow down.', retryAfterSeconds(rl));}

    const body = (await req.json()) as NotificationPreferencesUpdate;
    const updateData: Record<string, unknown> = {};

    for (const key of CATEGORY_TOGGLE_KEYS) {
      if (key in body) {
        if (typeof body[key] !== 'boolean') {return apiBadRequest(`${key} must be a boolean`);}
        updateData[key] = body[key];
      }
    }

    if ('digest_frequency' in body) {
      if (!VALID_DIGEST_FREQUENCIES.includes(body.digest_frequency as DigestFrequency)) {
        return apiBadRequest(`digest_frequency must be one of: ${VALID_DIGEST_FREQUENCIES.join(', ')}`);
      }
      updateData.digest_frequency = body.digest_frequency;
    }

    if ('type_overrides' in body) {
      const overrides = body.type_overrides;
      if (typeof overrides !== 'object' || overrides === null || Array.isArray(overrides)) {
        return apiBadRequest('type_overrides must be an object mapping type names to booleans');
      }
      for (const [key, value] of Object.entries(overrides)) {
        if (typeof value !== 'boolean') {return apiBadRequest(`type_overrides values must be booleans, got non-boolean for "${key}"`);}
      }
      updateData.type_overrides = overrides;
    }

    if (Object.keys(updateData).length === 0) {return apiBadRequest('No valid fields provided to update');}
    updateData.updated_at = new Date().toISOString();

    const admin = createAdminClient() as unknown as AnySupabaseClient;
    const upsertData = { ...createDefaultPreferences(user.id), ...updateData, user_id: user.id };
    const { data, error } = await admin.from(TABLE).upsert(upsertData, { onConflict: 'user_id' }).select().single();

    if (error) { logger.error('Failed to update notification preferences', { error, userId: user.id }, 'NotificationPrefs'); throw error; }

    return apiSuccess(data as NotificationPreferences);
  } catch (error) {
    logger.error('Notification preferences PUT error', { error }, 'NotificationPrefs');
    return handleApiError(error);
  }
});
