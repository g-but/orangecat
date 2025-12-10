import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';
import { fetchConversationSummary, fetchMessages as svcFetchMessages, sendMessage as svcSendMessage } from '@/features/messaging/service.server';

// Schema for sending a message
const sendMessageSchema = z.object({
  content: z.string().min(1).max(1000),
  messageType: z.enum(['text', 'image', 'file', 'system']).default('text'),
  metadata: z.record(z.any()).optional(),
});

// Pagination constants
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const { searchParams } = new URL(request.url);

    // Parse pagination params
    const cursor = searchParams.get('cursor'); // ISO timestamp of oldest message loaded
    const limitParam = searchParams.get('limit');
    const limit = Math.min(
      parseInt(limitParam || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE
    );

    // Authenticate user from cookies
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a participant in the conversation first
    const { data: participant, error: partError } = await supabase
      .from('conversation_participants')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (partError || !participant) {
      // Check if conversation exists at all
      const { data: convExists } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .single();

      if (!convExists) {
        // Fallback: attempt client-like assembly for robustness (some RLS/view delays)
        // Return a generic 404 but include a hint to let client try fallback if desired
        return NextResponse.json({ error: 'Conversation not found', hint: 'client_fallback_allowed' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Access denied', hint: 'client_fallback_allowed' }, { status: 403 });
    }

    // Use service for messages + pagination
    const { messages: sortedMessages, pagination } = await svcFetchMessages(conversationId, cursor || undefined, limit)

    // Get conversation info with participants using RPC or fallback to building it manually
    let conversationData = null;

    // Try to get from conversation_details view first (includes participants)
    const { data: convDetails, error: convDetailsError } = await supabase
      .from('conversation_details')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (!convDetailsError && convDetails) {
      conversationData = convDetails;
    } else {
      // Fallback: build conversation data manually
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (convError || !conv) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      // Fetch participants separately
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select(`
          user_id,
          role,
          joined_at,
          last_read_at,
          is_active,
          profiles:user_id (
            id,
            username,
            name,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId);

      // Transform participants to expected format
      const formattedParticipants = (participants || []).map(p => ({
        user_id: p.user_id,
        username: (p.profiles as any)?.username || '',
        name: (p.profiles as any)?.name || '',
        avatar_url: (p.profiles as any)?.avatar_url || '',
        role: p.role,
        joined_at: p.joined_at,
        last_read_at: p.last_read_at,
        is_active: p.is_active,
      }));

      conversationData = {
        ...conv,
        participants: formattedParticipants,
        unread_count: 0, // Calculate if needed
      };
    }

    return NextResponse.json({ conversation: conversationData, messages: sortedMessages, pagination });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;

    // Authenticate user from cookies
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = sendMessageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const { content, messageType, metadata } = validation.data;

    // Ensure membership: if missing or inactive, add or activate user membership
    const { data: participantMaybe } = await supabase
      .from('conversation_participants')
      .select('user_id, is_active')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!participantMaybe) {
      try {
        const admin = createAdminClient();
        await admin
          .from('conversation_participants')
          .insert({ conversation_id: conversationId, user_id: user.id, role: 'member', is_active: true });
      } catch {
        return NextResponse.json({ error: 'Not a participant in this conversation' }, { status: 403 });
      }
    } else if ((participantMaybe as any).is_active === false) {
      await supabase
        .from('conversation_participants')
        .update({ is_active: true, last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);
    }

    // Send using service; realtime will sync full message
    const newId = await svcSendMessage(conversationId, user.id, content, messageType, metadata || null)
    return NextResponse.json({ success: true, id: newId })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
