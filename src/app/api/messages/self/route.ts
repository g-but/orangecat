import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // The JS client cannot express the EXISTS/count logic easily; perform a two-step approach:
    // list user conversations, then filter client-side for a single-participant DM.
    let conversationId: string | null = null
    {
      const { data: convs } = await supabase
        .from('conversation_details')
        .select('*')
        .order('created_at', { ascending: false })
      if (Array.isArray(convs)) {
        const selfConv = convs.find((c: any) => {
          if (c.is_group) return false
          const parts = Array.isArray(c.participants) ? c.participants : []
          return parts.length === 1 && parts[0]?.user_id === user.id
        })
        if (selfConv) conversationId = selfConv.id
      }
    }

    if (!conversationId) {
      // Create new conversation
      // Ensure profile exists to satisfy FK on conversations.created_by
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

    if (!existingProfile) {
        const safeEmail = typeof user.email === 'string' ? user.email : null
        const emailName = safeEmail && safeEmail.includes('@') ? safeEmail.split('@')[0] : null
        const safeUsername = emailName && emailName.length > 0 ? emailName : `user_${String(user.id).slice(0, 8)}`
        const safeName =
          (user.user_metadata?.full_name as string | undefined) ||
          (user.user_metadata?.name as string | undefined) ||
          (emailName && emailName.length > 0 ? emailName : 'Anonymous User')
        const { error: profileErr } = await supabase
          .from('profiles')
          .insert({ id: user.id, username: safeUsername, name: safeName })
        if (profileErr) {
          return NextResponse.json({ error: 'Failed to create user profile', details: (profileErr as any)?.message || (profileErr as any)?.code }, { status: 500 })
        }
      }

      const createWithServer = async () => {
        const { data: convIns, error: convErr } = await supabase
          .from('conversations')
          .insert({ created_by: user.id, is_group: false })
          .select('id')
          .single()
        if (convErr || !convIns) {
          throw convErr || new Error('conv insert failed')
        }
        conversationId = convIns.id as string
        const { error: partErr } = await supabase
          .from('conversation_participants')
          .insert({ conversation_id: conversationId, user_id: user.id, role: 'member' })
        if (partErr) {
          // Roll back conversation if participant insert fails
          await supabase.from('conversations').delete().eq('id', conversationId)
          throw partErr
        }
      }

      try {
        await createWithServer()
      } catch (e) {
        // Dev-only admin fallback when RLS or RPC not ready
        if (process.env.NODE_ENV !== 'production') {
          try {
            const admin = createAdminClient()
            const { data: convIns, error: convErr } = await admin
              .from('conversations')
              .insert({ created_by: user.id, is_group: false })
              .select('id')
              .single()
            if (convErr || !convIns) {
              return NextResponse.json({ error: 'Failed to create conversation (admin)', details: (convErr as any)?.message || (convErr as any)?.code }, { status: 500 })
            }
            conversationId = convIns.id as string
            const { error: partErr } = await admin
              .from('conversation_participants')
              .insert({ conversation_id: conversationId, user_id: user.id, role: 'member' })
            if (partErr) {
              await admin.from('conversations').delete().eq('id', conversationId)
              return NextResponse.json({ error: 'Failed to add participant (admin)', details: (partErr as any)?.message || (partErr as any)?.code }, { status: 500 })
            }
          } catch (e2) {
            return NextResponse.json({ error: 'Self conversation creation failed', details: (e as any)?.message || (e as any)?.code }, { status: 500 })
          }
        } else {
          return NextResponse.json({ error: 'Failed to create conversation', details: (e as any)?.message || (e as any)?.code }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ success: true, conversationId })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
