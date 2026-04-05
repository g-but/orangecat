/**
 * Resend Email Client — Singleton
 *
 * SSOT: This is the canonical location for the Resend client instance.
 * Pattern mirrors src/lib/supabase/admin.ts.
 */

import { Resend } from 'resend';
import { logger } from '@/utils/logger';

let _client: Resend | null = null;
let _placeholderWarned = false;

/**
 * Returns true if Resend is configured with a real API key.
 * Use this to short-circuit email-sending code paths in dev.
 */
export function isEmailConfigured(): boolean {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  if (key.startsWith('re_placeholder') || key === 'undefined') return false;
  return true;
}

export function getEmailClient(): Resend {
  if (!_client) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error('RESEND_API_KEY is not set');
    }
    if (key.startsWith('re_placeholder') && !_placeholderWarned) {
      _placeholderWarned = true;
      logger.warn(
        'RESEND_API_KEY is a placeholder — emails will fail to send. Get a real key at https://resend.com/api-keys',
        {},
        'Email'
      );
    }
    _client = new Resend(key);
  }
  return _client;
}
