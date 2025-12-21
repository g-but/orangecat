import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({})) as { conversationId?: string, ids?: string[] }
    const conversationId = body.conversationId
    const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : []
    if (!conversationId || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Verify user is participant
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()
    if (!participant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Soft delete messages (only messages sent by current user)
    // PURE RLS: relies on 'Message senders can update their messages' policy
    const { error: updErr, data } = await supabase
      .from('messages')
      .update({ is_deleted: true } as any)
      .in('id', ids)
      .eq('conversation_id', conversationId)
      .eq('sender_id', user.id)
      .select('id')

    if (updErr) {
      return NextResponse.json({ error: 'Failed to delete messages', details: (updErr as any)?.message || (updErr as any)?.code }, { status: 500 })
    }

    return NextResponse.json({ success: true, deleted: data?.length || 0 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
