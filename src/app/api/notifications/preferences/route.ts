import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiSuccess, apiBadRequest, handleApiError, apiRateLimited } from '@/lib/api/standardResponse';
import { rateLimitWriteAsync } from '@/lib/rate-limit';
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

const CATEGORY_TOGGLE_KEYS = [
  'economic_emails',
  'social_emails',
  'group_emails',
  'progress_emails',
  'reengagement_emails',
] as const;

/**
 * GET /api/notifications/preferences
 *
 * Return the authenticated user's notification preferences.
 * If no preferences exist yet, create and return defaults.
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { user } = req;
    const admin = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin.from(TABLE) as any)
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      logger.error(
        'Failed to fetch notification preferences',
        { error, userId: user.id },
        'NotificationPrefs'
      );
      throw error;
    }

    // If preferences exist, return them
    if (data) {
      return apiSuccess(data as NotificationPreferences);
    }

    // First time: create default preferences
    const defaults = createDefaultPreferences(user.id);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: created, error: insertError } = await (admin.from(TABLE) as any)
      .insert(defaults)
      .select()
      .single();

    if (insertError) {
      // Race condition: another request may have created the row concurrently
      if (insertError.code === '23505') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existing } = await (admin.from(TABLE) as any)
          .select('*')
          .eq('user_id', user.id)
          .single();

        return apiSuccess((existing ?? defaults) as NotificationPreferences);
      }
      logger.error(
        'Failed to create default notification preferences',
        { error: insertError, userId: user.id },
        'NotificationPrefs'
      );
      throw insertError;
    }

    return apiSuccess(created as NotificationPreferences);
  } catch (error) {
    logger.error('Notification preferences GET error', { error }, 'NotificationPrefs');
    return handleApiError(error);
  }
});

/**
 * PUT /api/notifications/preferences
 *
 * Update the authenticated user's notification preferences.
 * Accepts partial updates — only provided fields are changed.
 *
 * Body (all optional):
 * - economic_emails: boolean
 * - social_emails: boolean
 * - group_emails: boolean
 * - progress_emails: boolean
 * - reengagement_emails: boolean
 * - digest_frequency: 'daily' | 'weekly' | 'never'
 * - type_overrides: Record<string, boolean>
 */
export const PUT = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { user } = req;

    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {
      const retryAfter = Math.ceil((rl.resetTime - Date.now()) / 1000);
      return apiRateLimited('Too many requests. Please slow down.', retryAfter);
    }

    const body = (await req.json()) as NotificationPreferencesUpdate;

    // Validate the update payload
    const updateData: Record<string, unknown> = {};

    // Validate category toggles (must be boolean if provided)
    for (const key of CATEGORY_TOGGLE_KEYS) {
      if (key in body) {
        const value = body[key];
        if (typeof value !== 'boolean') {
          return apiBadRequest(`${key} must be a boolean`);
        }
        updateData[key] = value;
      }
    }

    // Validate digest_frequency
    if ('digest_frequency' in body) {
      if (!VALID_DIGEST_FREQUENCIES.includes(body.digest_frequency as DigestFrequency)) {
        return apiBadRequest(
          `digest_frequency must be one of: ${VALID_DIGEST_FREQUENCIES.join(', ')}`
        );
      }
      updateData.digest_frequency = body.digest_frequency;
    }

    // Validate type_overrides (must be Record<string, boolean>)
    if ('type_overrides' in body) {
      const overrides = body.type_overrides;
      if (typeof overrides !== 'object' || overrides === null || Array.isArray(overrides)) {
        return apiBadRequest('type_overrides must be an object mapping type names to booleans');
      }
      for (const [key, value] of Object.entries(overrides)) {
        if (typeof key !== 'string' || typeof value !== 'boolean') {
          return apiBadRequest(
            `type_overrides values must be booleans, got non-boolean for "${key}"`
          );
        }
      }
      updateData.type_overrides = overrides;
    }

    if (Object.keys(updateData).length === 0) {
      return apiBadRequest('No valid fields provided to update');
    }

    updateData.updated_at = new Date().toISOString();

    const admin = createAdminClient();

    // Upsert: if preferences don't exist yet, create with defaults + updates
    const defaults = createDefaultPreferences(user.id);
    const upsertData = { ...defaults, ...updateData, user_id: user.id };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin.from(TABLE) as any)
      .upsert(upsertData, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      logger.error(
        'Failed to update notification preferences',
        { error, userId: user.id },
        'NotificationPrefs'
      );
      throw error;
    }

    return apiSuccess(data as NotificationPreferences);
  } catch (error) {
    logger.error('Notification preferences PUT error', { error }, 'NotificationPrefs');
    return handleApiError(error);
  }
});
