import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await params;

    // Verify user is a participant
    const { data: participant, error: partError } = await supabase
      .from('conversation_participants')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (partError || !participant) {
      return NextResponse.json({ error: 'Not a participant in this conversation' }, { status: 403 });
    }

    // Mark conversation as read
    const { error: readError } = await supabase
      .rpc('mark_conversation_read', {
        p_conversation_id: conversationId,
        p_user_id: user.id
      });

    if (readError) {
      console.error('Error marking conversation as read:', readError);
      return NextResponse.json({ error: 'Failed to mark conversation as read' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark read API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
