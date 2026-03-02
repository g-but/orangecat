/**
 * Cat Chat History API
 *
 * GET  /api/cat/history - Fetch recent messages for UI display
 * DELETE /api/cat/history - Clear conversation history
 */

import { createServerClient } from '@/lib/supabase/server';
import {
  getMessagesForDisplay,
  clearDefaultConversation,
} from '@/services/cat/conversation-history';
import { apiUnauthorized, apiSuccess } from '@/lib/api/standardResponse';

export async function GET() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized('Unauthorized');
  }

  const messages = await getMessagesForDisplay(supabase, user.id);

  return apiSuccess(messages);
}

export async function DELETE() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized('Unauthorized');
  }

  await clearDefaultConversation(supabase, user.id);

  return apiSuccess({ success: true });
}
