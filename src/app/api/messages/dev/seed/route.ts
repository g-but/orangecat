import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(_req: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Disabled in production' }, { status: 403 })
    }

    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    // Ensure profile exists
    const { data: existing } = await admin.from('profiles').select('id').eq('id', user.id).maybeSingle()
    if (!existing) {
      const safeEmail = typeof user.email === 'string' ? user.email : null
      const emailName = safeEmail && safeEmail.includes('@') ? safeEmail.split('@')[0] : null
      const username = emailName && emailName.length > 0 ? emailName : `user_${String(user.id).slice(0, 8)}`
      const name = (user.user_metadata?.full_name as string | undefined) || (user.user_metadata?.name as string | undefined) || username
      const { error: pErr } = await admin.from('profiles').insert({ id: user.id, username, name })
      if (pErr) return NextResponse.json({ error: 'Failed to ensure profile', details: (pErr as any)?.message || (pErr as any)?.code }, { status: 500 })
    }

    // Create conversation
    const { data: convIns, error: convErr } = await admin
      .from('conversations')
      .insert({ created_by: user.id, is_group: false })
      .select('id')
      .single()
    if (convErr || !convIns) {
      return NextResponse.json({ error: 'Failed to create conversation', details: (convErr as any)?.message || (convErr as any)?.code }, { status: 500 })
    }
    const conversationId = convIns.id as string

    // Add participant
    const { error: partErr } = await admin
      .from('conversation_participants')
      .insert({ conversation_id: conversationId, user_id: user.id, role: 'member' })
    if (partErr) {
      await admin.from('conversations').delete().eq('id', conversationId)
      return NextResponse.json({ error: 'Failed to add participant', details: (partErr as any)?.message || (partErr as any)?.code }, { status: 500 })
    }

    // Seed greeting message
    const { error: msgErr } = await admin
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: user.id, content: 'Hello from seed!', message_type: 'text' })
    if (msgErr) {
      // Not fatal; still return conversationId
    }

    return NextResponse.json({ success: true, conversationId })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

