import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({})) as { ids?: string[]; action?: 'leave' | 'delete' }
    const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : []
    if (ids.length === 0) {
      return NextResponse.json({ error: 'No conversation ids provided' }, { status: 400 })
    }

    // Default behavior: leave conversations (soft remove for this user)
    // PURE RLS: relies on 'Users can update their own participation' policy
    const { error: updErr, data } = await supabase
      .from('conversation_participants')
      .update({ is_active: false } as any)
      .in('conversation_id', ids)
      .eq('user_id', user.id)
      .select('conversation_id')

    if (updErr) {
      return NextResponse.json({ error: 'Failed to update conversations', details: (updErr as any)?.message || (updErr as any)?.code }, { status: 500 })
    }

    return NextResponse.json({ success: true, updated: data?.length || 0 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 })
  }
}
