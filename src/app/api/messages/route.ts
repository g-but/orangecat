import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchUserConversations, openConversation } from '@/features/messaging/service.server';

// Schema for creating a conversation
const createConversationSchema = z.object({
  participantIds: z.array(z.string().uuid()).min(1).max(50), // Max 50 participants for groups
  title: z.string().max(100).optional(),
  initialMessage: z.string().max(1000).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const limitParam = url.searchParams.get('limit')
    const limit = Math.min(parseInt(limitParam || '30', 10) || 30, 100)
    const conversations = await fetchUserConversations(limit);
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Messages API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = createConversationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const { participantIds, title, initialMessage } = validation.data;
    const conversationId = await openConversation(participantIds, title || null)

    // Send initial message if provided
    // Initial message is handled by client optimistically or can be posted via POST /messages/:id

    return NextResponse.json({
      success: true,
      conversationId
    });
  } catch (error) {
    console.error('Messages API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
