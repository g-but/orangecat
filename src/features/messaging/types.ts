export interface Participant {
  user_id: string
  username: string
  name: string
  avatar_url: string | null
  role: string
  joined_at: string
  last_read_at: string
  is_active: boolean
}

export interface Conversation {
  id: string
  title: string | null
  is_group: boolean
  created_by?: string
  created_at?: string
  updated_at?: string
  last_message_at: string | null
  last_message_preview: string | null
  last_message_sender_id?: string | null
  participants: Participant[]
  unread_count: number
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  message_type: string
  metadata: any
  created_at: string
  updated_at: string
  is_deleted: boolean
  edited_at: string | null
  sender?: {
    id: string
    username: string
    name: string
    avatar_url: string | null
  }
}

export interface Pagination {
  hasMore: boolean
  nextCursor: string | null
  count: number
}

