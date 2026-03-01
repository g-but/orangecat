/**
 * Resend Email Client — Singleton
 *
 * SSOT: This is the canonical location for the Resend client instance.
 * Pattern mirrors src/lib/supabase/admin.ts.
 */

import { Resend } from 'resend';

let _client: Resend | null = null;

export function getEmailClient(): Resend {
  if (!_client) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error('RESEND_API_KEY is not set');
    }
    _client = new Resend(key);
  }
  return _client;
}
