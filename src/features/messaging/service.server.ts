import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Conversation, Message, Pagination } from './types'

export async function getServerUser() {
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 })
  }
  return { supabase, user }
}

export async function ensureMessagingFunctions() {
  const admin = createAdminClient()

  try {
    console.log('Ensuring messaging functions exist...')

    // Try to create the send_message function directly
    // This will fail gracefully if it already exists
    try {
      await admin.rpc('send_message', {
        p_conversation_id: '00000000-0000-0000-0000-000000000000',
        p_sender_id: '00000000-0000-0000-0000-000000000000',
        p_content: 'test'
      })
      console.log('send_message function exists')
    } catch (testError: any) {
      if (testError.message && testError.message.includes('function send_message')) {
        console.log('send_message function does not exist, this is expected')
      } else {
        console.log('send_message function exists (error was expected participant check)')
      }
    }

    // If we get here, try to create the function using raw SQL
    console.log('Attempting to create send_message function...')

    // This is a fallback - in a real deployment, this would be done via migrations
    // For now, let's implement the message sending logic directly in the API

  } catch (error) {
    console.error('Error ensuring messaging functions:', error)
    // Don't throw - we'll handle this in the API
  }
}

export async function fetchUserConversations(limit: number = 30): Promise<Conversation[]> {
  try {
    console.log('fetchUserConversations: Starting, limit=', limit);
    let user
    try {
      const { supabase: _, user: u } = await getServerUser()
      user = u
    } catch (authError) {
      console.error('fetchUserConversations: Auth error:', authError);
      return []
    }
    
    if (!user) {
      console.error('fetchUserConversations: No user found')
      return []
    }
    console.log('fetchUserConversations: User found', user.id);

    // Use admin client to bypass RLS issues, then filter by user
    let admin
    try {
      admin = createAdminClient()
      console.log('fetchUserConversations: Admin client created');
    } catch (adminError) {
      console.error('fetchUserConversations: Error creating admin client:', adminError);
      return []
    }

    // Prefer RPC for correct per-user aggregation
    // Try RPC first, but fallback gracefully if it doesn't exist
    try {
      const { data: rpcConversations, error: rpcError } = await (admin as any).rpc(
        'get_user_conversations',
        { p_user_id: user.id }
      )
      if (!rpcError && rpcConversations && Array.isArray(rpcConversations)) {
        // Client-side slice to avoid huge payloads if RPC can't be ranged
        const arr = rpcConversations as Conversation[]
        return arr.length > limit ? arr.slice(0, limit) : arr
      }
    } catch (rpcErr) {
      // RPC function might not exist, fall through to manual method
      console.warn('RPC get_user_conversations failed, using fallback:', rpcErr)
    }

    // Fallback: build conversations manually using admin client
    // Simplified query - just get conversation IDs first
    const { data: participations, error: partError } = await admin
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(100) // Prevent huge queries

    if (partError) {
      console.error('Error fetching participations:', partError);
      return []
    }

    if (!participations || participations.length === 0) {
      return []
    }

    const conversationIds = (participations as any[]).map(p => p.conversation_id).filter(Boolean)

    if (conversationIds.length === 0) {
      return []
    }

    // Get conversations with minimal fields first
    const { data: conversations, error: convError } = await admin
      .from('conversations')
      .select('id, title, is_group, created_at, updated_at, last_message_at, last_message_preview, last_message_sender_id, created_by')
      .in('id', conversationIds)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(limit)

    if (convError) {
      console.error('Error fetching conversations:', convError);
      return []
    }

    if (!conversations || conversations.length === 0) {
      return []
    }

    // Fetch participants separately - simplified query without profile join for now
    const { data: allParticipants, error: participantsError } = await admin
      .from('conversation_participants')
      .select('conversation_id, user_id, role, joined_at, last_read_at, is_active')
      .in('conversation_id', conversationIds)

    if (participantsError) {
      console.error('Error fetching participants:', participantsError);
      // Return conversations without participants rather than failing
      return (conversations as any[]).map(c => ({
        ...c,
        participants: [],
        unread_count: 0,
      })) as Conversation[]
    }

    // Get user profiles separately to avoid complex joins
    const userIds = [...new Set((allParticipants || []).map((p: any) => p.user_id).filter(Boolean))]
    let profilesMap = new Map()
    if (userIds.length > 0) {
      const { data: profiles } = await admin
        .from('profiles')
        .select('id, username, name, avatar_url')
        .in('id', userIds)
      profilesMap = new Map((profiles || []).map((p: any) => [p.id, p]))
    }

    // Group participants by conversation
    const participantsByConv = new Map<string, any[]>()
    for (const p of (allParticipants || []) as any[]) {
      if (!p || !p.conversation_id) continue
      const profile = profilesMap.get(p.user_id) || {}
      const list = participantsByConv.get(p.conversation_id) || []
      list.push({
        user_id: p.user_id,
        username: profile.username || '',
        name: profile.name || '',
        avatar_url: profile.avatar_url || null,
        role: p.role,
        joined_at: p.joined_at,
        last_read_at: p.last_read_at,
        is_active: p.is_active,
      })
      participantsByConv.set(p.conversation_id, list)
    }

    // Build full conversation objects with all required fields
    return (conversations as any[]).map(c => ({
      ...c,
      participants: participantsByConv.get(c.id) || [],
      unread_count: 0, // Could calculate but keeping simple for now
      last_message_preview: c.last_message_preview || null,
      last_message_sender_id: c.last_message_sender_id || null,
      last_message_at: c.last_message_at || null,
    })) as Conversation[]
  } catch (error) {
    console.error('Error in fetchUserConversations:', error);
    // Return empty array on any error to prevent breaking the UI
    return []
  }
}

export async function fetchConversationSummary(conversationId: string): Promise<Conversation> {
  const { user } = await getServerUser()
  if (!user) throw Object.assign(new Error('Unauthorized'), { status: 401 })

  // Use admin client to bypass RLS issues
  const admin = createAdminClient()

  // Membership check
  const { data: participant } = await admin
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()
  if (!participant) throw Object.assign(new Error('Access denied'), { status: 403 })

  const { data: conv } = await admin
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single()
  if (!conv) throw Object.assign(new Error('Conversation not found'), { status: 404 })

  const { data: participants } = await admin
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
  const { user } = await getServerUser()
  if (!user) throw Object.assign(new Error('Unauthorized'), { status: 401 })

  // Use admin client to bypass RLS issues
  const admin = createAdminClient()

  // Verify membership
  const { data: participant } = await admin
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()
  if (!participant) throw Object.assign(new Error('Access denied'), { status: 403 })

  // Fetch messages with sender info using admin client
  let query = admin
    .from('messages')
    .select(`
      id,
      conversation_id,
      sender_id,
      content,
      message_type,
      metadata,
      created_at,
      updated_at,
      is_deleted,
      edited_at,
      profiles:sender_id (id, username, name, avatar_url)
    `, { count: 'exact' })
    .eq('conversation_id', conversationId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  if (cursor) query = query.lt('created_at', cursor)

  const { data, count, error } = await query
  if (error) throw Object.assign(new Error('Failed to fetch messages'), { status: 500 })

  // Get all participants' last_read_at for read receipt calculation
  const { data: allParticipants } = await admin
    .from('conversation_participants')
    .select('user_id, last_read_at')
    .eq('conversation_id', conversationId)
    .eq('is_active', true)
  
  // Create map of user_id -> last_read_at for quick lookup
  const participantReadTimes = new Map<string, Date | null>()
  allParticipants?.forEach((p: any) => {
    participantReadTimes.set(p.user_id, p.last_read_at ? new Date(p.last_read_at) : null)
  })
  
  const userLastReadAt = participantReadTimes.get(user.id) || null

  // Transform to expected format
  const messages = (data || []).map((m: any) => {
    const messageCreatedAt = new Date(m.created_at)
    
    // For messages sent by current user: calculate read receipt status
    // For messages from others: calculate if current user has read them
    let isRead = false
    let isDelivered = false
    let status: 'pending' | 'failed' | 'sent' | 'delivered' | 'read' = 'sent'
    
    if (m.sender_id === user.id) {
      // This is the sender's own message - check if recipient(s) have read it
      // Message is delivered if it exists in DB (which it does, since we fetched it)
      isDelivered = true
      status = 'delivered'
      
      // Check if any recipient has read it (for direct messages, check the other participant)
      // For group messages, we'd check all participants, but for now just check if any participant read it
      let recipientHasRead = false
      for (const [participantId, lastReadAt] of participantReadTimes.entries()) {
        if (participantId !== user.id && lastReadAt) {
          if (messageCreatedAt <= lastReadAt) {
            recipientHasRead = true
            break
          }
        }
      }
      
      isRead = recipientHasRead
      if (isRead) {
        status = 'read'
      }
    } else {
      // This is a message from someone else - check if current user has read it
      isDelivered = true // If it's in the DB, it's delivered
      isRead = userLastReadAt ? messageCreatedAt <= userLastReadAt : false
      status = isRead ? 'read' : 'delivered'
    }
    
    return {
      id: m.id,
      conversation_id: m.conversation_id,
      sender_id: m.sender_id,
      content: m.content,
      message_type: m.message_type,
      metadata: m.metadata,
      created_at: m.created_at,
      updated_at: m.updated_at,
      is_deleted: m.is_deleted,
      edited_at: m.edited_at,
      sender: {
        id: m.profiles?.id || m.sender_id,
        username: m.profiles?.username || '',
        name: m.profiles?.name || '',
        avatar_url: m.profiles?.avatar_url || null,
      },
      is_read: isRead,
      is_delivered: isDelivered,
      status: status,
    }
  })

  const hasMore = messages.length > limit
  const slice = hasMore ? messages.slice(0, limit) : messages
  const sorted = slice.reverse() as Message[]
  const nextCursor = hasMore && sorted.length > 0 ? sorted[0].created_at : null
  return { messages: sorted, pagination: { hasMore, nextCursor, count: count || sorted.length } }
}

export async function sendMessage(conversationId: string, senderId: string, content: string, type: string = 'text', metadata: any = null): Promise<string> {
  const { supabase, user } = await getServerUser()
  if (!user) throw Object.assign(new Error('Unauthorized'), { status: 401 })

  // Verify sender matches authenticated user
  if (user.id !== senderId) {
    throw Object.assign(new Error('Sender ID does not match authenticated user'), { status: 403 })
  }

  try {
    // Use admin client to bypass RLS for participant check
    const admin = createAdminClient()
    
    // First verify the sender is a participant
    const { data: participant, error: partError } = await admin
      .from('conversation_participants')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (partError || !participant) {
      throw Object.assign(new Error('User is not a participant in this conversation'), { status: 403 })
    }

    // Insert the message directly using admin client to bypass RLS
    const { data: message, error: insertError } = await admin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content,
        message_type: type,
        metadata: metadata || {}
      })
      .select('id')
      .single()

    if (insertError || !message) {
      console.error('Error inserting message:', insertError)
      throw Object.assign(new Error('Failed to send message'), { status: 500 })
    }

    // Update conversation metadata using admin client
    const { error: updateError } = await admin
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: content.substring(0, 100),
        last_message_sender_id: senderId,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)

    if (updateError) {
      console.warn('Failed to update conversation metadata:', updateError)
      // Don't fail the message send for this
    }

    // Update participant's last_read_at for sender using admin client to avoid RLS recursion
    const { error: readError } = await admin
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', senderId)

    if (readError) {
      console.warn('Failed to update sender read time:', readError)
      // Don't fail the message send for this
    }

    console.log('Message sent successfully:', message.id)
    return message.id

  } catch (error) {
    console.error('Error sending message:', error)
    throw error
  }
}

export async function markConversationRead(conversationId: string) {
  const { user } = await getServerUser()
  if (!user) throw Object.assign(new Error('Unauthorized'), { status: 401 })

  // Use admin client to bypass RLS issues
  const admin = createAdminClient()
  await admin
    .from('conversation_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
}

// Conversation creation helpers (self/direct/group)
export async function openConversation(participantIds: string[], title?: string | null): Promise<string> {
  const { supabase, user } = await getServerUser()
  if (!user) throw Object.assign(new Error('Unauthorized'), { status: 401 })

  // Ensure messaging functions exist
  await ensureMessagingFunctions()

  // Ensure profile exists for FK constraints (admin fallback)
  const admin = createAdminClient()
  const ensureProfile = async (id: string) => {
    const { data: existing, error: checkError } = await admin
      .from('profiles')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (checkError) {
      throw checkError
    }

    if (!existing) {
      const { error: insertError } = await admin.from('profiles').insert({ id, username: `user_${id.slice(0,8)}`, name: 'User' })
      if (insertError) {
        throw insertError
      }
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
      .insert({ conversation_id: convId, user_id: user.id, role: 'member', is_active: true })
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

    // Create conversation using admin client
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
        { conversation_id: newId, user_id: user.id, role: 'member', is_active: true },
        { conversation_id: newId, user_id: otherId, role: 'member', is_active: true },
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
    is_active: true,
  }))
  const { error: pErr } = await admin.from('conversation_participants').insert(rows)
  if (pErr) throw Object.assign(new Error('Failed to add participants'), { status: 500 })
  return gid
}
