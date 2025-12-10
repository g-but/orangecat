import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST(_req: NextRequest) {
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

    // Ensure profile exists for FK
    const { data: existing } = await admin
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()
    if (!existing) {
      const safeEmail = typeof user.email === 'string' ? user.email : null
      const emailName = safeEmail && safeEmail.includes('@') ? safeEmail.split('@')[0] : null
      const username = emailName && emailName.length > 0 ? emailName : `user_${String(user.id).slice(0, 8)}`
      const name = (user.user_metadata?.full_name as string | undefined) || (user.user_metadata?.name as string | undefined) || username
      await admin.from('profiles').insert({ id: user.id, username, name })
    }

    // Try to find an existing self conversation
    const { data: existingConv } = await admin
      .from('conversations')
      .select('id, conversation_participants!inner(user_id, is_active)')
      .eq('is_group', false)
      .limit(1)
    const found = (existingConv || []).find(c => Array.isArray((c as any).conversation_participants) && (c as any).conversation_participants.some((p: any) => p.user_id === user.id && p.is_active)) as any

    if (found?.id) {
      return NextResponse.json({ success: true, conversationId: found.id })
    }

    // Create a new conversation and add the current user as a participant
    const { data: convIns, error: convErr } = await admin
      .from('conversations')
      .insert({ created_by: user.id, is_group: false })
      .select('id')
      .single()
    if (convErr || !convIns) {
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
    }

    const conversationId = convIns.id as string
    const { error: partErr } = await admin
      .from('conversation_participants')
      .insert({ conversation_id: conversationId, user_id: user.id, role: 'member' })
    if (partErr) {
      await admin.from('conversations').delete().eq('id', conversationId)
      return NextResponse.json({ error: 'Failed to add participant' }, { status: 500 })
    }

    return NextResponse.json({ success: true, conversationId })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

