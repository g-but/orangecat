import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Conversation, Message, Pagination } from './types'

export async function getServerUser() {
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { supabase, user: null }
  return { supabase, user }
}

export async function fetchUserConversations(limit: number = 30): Promise<Conversation[]> {
  const { supabase, user } = await getServerUser()
  if (!user) throw Object.assign(new Error('Unauthorized'), { status: 401 })

  // Prefer RPC for correct per-user aggregation; fallback to view
  const { data: rpcConversations, error: rpcError } = await supabase.rpc(
    'get_user_conversations',
    { p_user_id: user.id }
  )
  if (!rpcError && rpcConversations) {
    // Client-side slice to avoid huge payloads if RPC can't be ranged
    const arr = rpcConversations as Conversation[]
    return Array.isArray(arr) && arr.length > limit ? arr.slice(0, limit) : arr
  }

  const { data: viewConversations, error: viewError } = await supabase
    .from('conversation_details')
    .select('*')
    .order('last_message_at', { ascending: false })
    .limit(limit)
  if (viewError) throw Object.assign(new Error('Failed to fetch conversations'), { status: 500 })
  return (viewConversations || []) as Conversation[]
}

export async function fetchConversationSummary(conversationId: string): Promise<Conversation> {
  const { supabase, user } = await getServerUser()
  if (!user) throw Object.assign(new Error('Unauthorized'), { status: 401 })

  // Membership check
  const { data: participant } = await supabase
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!participant) throw Object.assign(new Error('Access denied'), { status: 403 })

  const { data: convDetails } = await supabase
    .from('conversation_details')
    .select('*')
    .eq('id', conversationId)
    .maybeSingle()
  if (convDetails) return convDetails as Conversation

  const { data: conv } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single()
  if (!conv) throw Object.assign(new Error('Conversation not found'), { status: 404 })

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
    .eq('conversation_id', conversationId)

  const formattedParticipants = (participants || []).map((p: any) => ({
    user_id: p.user_id,
    username: p.profiles?.username || '',
    name: p.profiles?.name || '',
    avatar_url: p.profiles?.avatar_url || null,
    role: p.role,
    joined_at: p.joined_at,
    last_read_at: p.last_read_at,
    is_active: p.is_active,
  }))

  return {
    ...(conv as any),
    participants: formattedParticipants,
    unread_count: 0,
  } as Conversation
}

export async function fetchMessages(conversationId: string, cursor?: string, limit = 50): Promise<{ messages: Message[]; pagination: Pagination }>{
  const { supabase, user } = await getServerUser()
  if (!user) throw Object.assign(new Error('Unauthorized'), { status: 401 })

  // Verify membership
  const { data: participant } = await supabase
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!participant) throw Object.assign(new Error('Access denied'), { status: 403 })

  let q = supabase
    .from('message_details')
    .select('*', { count: 'exact' })
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit + 1)
  if (cursor) q = q.lt('created_at', cursor)
  const { data, count, error } = await q
  if (error) throw Object.assign(new Error('Failed to fetch messages'), { status: 500 })

  const hasMore = (data?.length || 0) > limit
  const slice = hasMore ? data!.slice(0, limit) : (data || [])
  const sorted = slice.reverse() as Message[]
  const nextCursor = hasMore && sorted.length > 0 ? sorted[0].created_at : null
  return { messages: sorted, pagination: { hasMore, nextCursor, count: count || sorted.length } }
}

export async function sendMessage(conversationId: string, senderId: string, content: string, type: string = 'text', metadata: any = null): Promise<string> {
  const { supabase, user } = await getServerUser()
  if (!user || user.id !== senderId) throw Object.assign(new Error('Unauthorized'), { status: 401 })
  const { data: id, error } = await supabase.rpc('send_message', {
    p_conversation_id: conversationId,
    p_sender_id: senderId,
    p_content: content,
    p_message_type: type,
    p_metadata: metadata,
  })
  if (error || !id) throw Object.assign(new Error('Failed to send message'), { status: 500 })
  return id as unknown as string
}

export async function markConversationRead(conversationId: string) {
  const { supabase, user } = await getServerUser()
  if (!user) throw Object.assign(new Error('Unauthorized'), { status: 401 })
  await supabase
    .from('conversation_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
}

// Conversation creation helpers (self/direct/group)
export async function openConversation(participantIds: string[], title?: string | null): Promise<string> {
  const { supabase, user } = await getServerUser()
  if (!user) throw Object.assign(new Error('Unauthorized'), { status: 401 })

  // Ensure profile exists for FK constraints (admin fallback)
  const admin = createAdminClient()
  const ensureProfile = async (id: string) => {
    const { data: existing } = await admin
      .from('profiles')
      .select('id')
      .eq('id', id)
      .maybeSingle()
    if (!existing) {
      await admin.from('profiles').insert({ id, username: `user_${id.slice(0,8)}`, name: 'User' })
    }
  }

  // Self conversation (Notes to Self)
  if (!participantIds || participantIds.length === 0) {
    await ensureProfile(user.id)
    const { data: convIns, error: convErr } = await admin
      .from('conversations')
      .insert({ created_by: user.id, is_group: false })
      .select('id')
      .single()
    if (convErr || !convIns) throw Object.assign(new Error('Failed to create conversation'), { status: 500 })
    const convId = (convIns as any).id as string
    const { error: partErr } = await admin
      .from('conversation_participants')
      .insert({ conversation_id: convId, user_id: user.id, role: 'member' })
    if (partErr) {
      await admin.from('conversations').delete().eq('id', convId)
      throw Object.assign(new Error('Failed to add participant'), { status: 500 })
    }
    return convId
  }

  // Direct message with one other user
  if (participantIds.length === 1) {
    const otherId = participantIds[0]
    await ensureProfile(user.id)
    await ensureProfile(otherId)

    // Try SECURITY DEFINER function first
    const { data: convId, error: funcError } = await supabase
      .rpc('create_direct_conversation', { participant1_id: user.id, participant2_id: otherId })
    if (!funcError && convId) return convId as unknown as string

    // Fallback: admin create
    const { data: convIns, error: convErr } = await admin
      .from('conversations')
      .insert({ created_by: user.id, is_group: false })
      .select('id')
      .single()
    if (convErr || !convIns) throw Object.assign(new Error('Failed to create conversation'), { status: 500 })
    const newId = (convIns as any).id as string
    const { error: pErr } = await admin
      .from('conversation_participants')
      .insert([
        { conversation_id: newId, user_id: user.id, role: 'member' },
        { conversation_id: newId, user_id: otherId, role: 'member' },
      ])
    if (pErr) throw Object.assign(new Error('Failed to add participants'), { status: 500 })
    return newId
  }

  // Group conversation
  const { data: groupId, error: groupErr } = await supabase
    .rpc('create_group_conversation', {
      p_created_by: user.id,
      p_participant_ids: participantIds,
      p_title: title || null,
    })
  if (!groupErr && groupId) return groupId as unknown as string

  // Fallback: admin create
  await ensureProfile(user.id)
  for (const id of participantIds) await ensureProfile(id)
  const { data: convIns, error: cErr } = await admin
    .from('conversations')
    .insert({ created_by: user.id, is_group: true, title: title || null })
    .select('id')
    .single()
  if (cErr || !convIns) throw Object.assign(new Error('Failed to create conversation'), { status: 500 })
  const gid = (convIns as any).id as string
  const rows = [user.id, ...participantIds].map(pid => ({
    conversation_id: gid,
    user_id: pid,
    role: pid === user.id ? 'admin' : 'member',
  }))
  const { error: pErr } = await admin.from('conversation_participants').insert(rows)
  if (pErr) throw Object.assign(new Error('Failed to add participants'), { status: 500 })
  return gid
}
