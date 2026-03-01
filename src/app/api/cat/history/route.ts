/**
 * Cat Chat History API
 *
 * GET  /api/cat/history - Fetch recent messages for UI display
 * DELETE /api/cat/history - Clear conversation history
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  getMessagesForDisplay,
  clearDefaultConversation,
} from '@/services/cat/conversation-history';

export async function GET() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const messages = await getMessagesForDisplay(supabase, user.id);

  return NextResponse.json({ success: true, data: messages });
}

export async function DELETE() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await clearDefaultConversation(supabase, user.id);

  return NextResponse.json({ success: true });
}
