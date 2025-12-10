import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * Opens or creates a conversation.
 * - Self DM: participantIds empty or just contains the requestor
 * - Direct DM: participantIds has one other user - find existing or create
 * - Group: participantIds has 2+ other users - always creates new
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({})) as Record<string, unknown>
    const rawParticipantIds = Array.isArray(body?.participantIds) ? body.participantIds : []
    const title = typeof body?.title === 'string' ? body.title : null

    // Normalize: unique participants, always include requestor
    const allParticipants = [...new Set([...rawParticipantIds.filter((id): id is string => typeof id === 'string'), user.id])]
    const count = allParticipants.length

    // Self DM case (just the requestor)
    if (count === 1) {
      // Try to find existing self conversation
      const { data: existingConvs, error: findErr } = await supabase
        .from('conversations')
        .select(`
          id,
          conversation_participants!inner(user_id, is_active)
        `)
        .eq('is_group', false)

      if (findErr) {
        return NextResponse.json({ error: 'Failed to search conversations', details: findErr.message }, { status: 500 })
      }

      // Find one where only the requestor is active
      const selfConv = existingConvs?.find(c => {
        const participants = c.conversation_participants as Array<{ user_id: string; is_active: boolean }>
        const activeParticipants = participants.filter(p => p.is_active)
        return activeParticipants.length === 1 && activeParticipants[0].user_id === user.id
      })

      if (selfConv) {
        return NextResponse.json({ success: true, conversationId: selfConv.id })
      }

      // Create new self conversation
      const { data: newConv, error: createErr } = await supabase
        .from('conversations')
        .insert({ created_by: user.id, is_group: false, title: null })
        .select('id')
        .single()

      if (createErr || !newConv) {
        return NextResponse.json({ error: 'Failed to create conversation', details: createErr?.message }, { status: 500 })
      }

      const { error: partErr } = await supabase
        .from('conversation_participants')
        .insert({ conversation_id: newConv.id, user_id: user.id, role: 'member' })

      if (partErr) {
        return NextResponse.json({ error: 'Failed to add participant', details: partErr.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, conversationId: newConv.id })
    }

    // Direct DM case (exactly 2 participants)
    if (count === 2) {
      const otherId = allParticipants.find(id => id !== user.id)!

      // Try to find existing DM between these two users
      const { data: existingConvs, error: findErr } = await supabase
        .from('conversations')
        .select(`
          id,
          conversation_participants!inner(user_id, is_active)
        `)
        .eq('is_group', false)

      if (findErr) {
        return NextResponse.json({ error: 'Failed to search conversations', details: findErr.message }, { status: 500 })
      }

      // Find a non-group conversation with exactly these two participants active
      const dmConv = existingConvs?.find(c => {
        const participants = c.conversation_participants as Array<{ user_id: string; is_active: boolean }>
        const activeParticipants = participants.filter(p => p.is_active)
        if (activeParticipants.length !== 2) return false
        const userIds = activeParticipants.map(p => p.user_id)
        return userIds.includes(user.id) && userIds.includes(otherId)
      })

      if (dmConv) {
        return NextResponse.json({ success: true, conversationId: dmConv.id })
      }

      // Create new direct conversation
      const { data: newConv, error: createErr } = await supabase
        .from('conversations')
        .insert({ created_by: user.id, is_group: false, title: null })
        .select('id')
        .single()

      if (createErr || !newConv) {
        return NextResponse.json({ error: 'Failed to create conversation', details: createErr?.message }, { status: 500 })
      }

      // Add both participants
      const { error: partErr } = await supabase
        .from('conversation_participants')
        .insert(allParticipants.map(id => ({
          conversation_id: newConv.id,
          user_id: id,
          role: id === user.id ? 'admin' : 'member'
        })))

      if (partErr) {
        return NextResponse.json({ error: 'Failed to add participants', details: partErr.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, conversationId: newConv.id })
    }

    // Group conversation (3+ participants) - always create new
    const { data: newConv, error: createErr } = await supabase
      .from('conversations')
      .insert({
        created_by: user.id,
        is_group: true,
        title: title || null
      })
      .select('id')
      .single()

    if (createErr || !newConv) {
      return NextResponse.json({ error: 'Failed to create group conversation', details: createErr?.message }, { status: 500 })
    }

    // Add all participants
    const { error: partErr } = await supabase
      .from('conversation_participants')
      .insert(allParticipants.map(id => ({
        conversation_id: newConv.id,
        user_id: id,
        role: id === user.id ? 'admin' : 'member'
      })))

    if (partErr) {
      return NextResponse.json({ error: 'Failed to add participants', details: partErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, conversationId: newConv.id })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 })
  }
}
