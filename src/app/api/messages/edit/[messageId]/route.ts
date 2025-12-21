/**
 * Message Edit API Endpoint
 *
 * PATCH /api/messages/edit/[messageId]
 * Updates a message's content and sets edited_at timestamp
 *
 * Created: 2025-12-12
 * Last Modified: 2025-12-14
 * Last Modified Summary: Moved to /edit/[messageId] to avoid route conflict
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Schema for editing a message
const editMessageSchema = z.object({
  content: z.string().min(1).max(1000),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await params;

    // Authenticate user
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = editMessageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const { content } = validation.data;

    // Verify user is the sender of this message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('id, sender_id, conversation_id, is_deleted')
      .eq('id', messageId)
      .single();

    if (messageError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (message.is_deleted) {
      return NextResponse.json({ error: 'Cannot edit deleted message' }, { status: 400 });
    }

    if (message.sender_id !== user.id) {
      return NextResponse.json({ error: 'You can only edit your own messages' }, { status: 403 });
    }

    // Update message content and set edited_at
    const { data: updatedMessage, error: updateError } = await supabase
      .from('messages')
      .update({
        content,
        edited_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .eq('sender_id', user.id) // Double-check ownership
      .select()
      .single();

    if (updateError || !updatedMessage) {
      return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: updatedMessage 
    });
  } catch (error) {
    console.error('Error editing message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


