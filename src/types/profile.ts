export type Profile = {
  id: string
  user_id: string
  full_name: string
  bio?: string
  avatar_url?: string
  website?: string
  bitcoin_address?: string
  lightning_address?: string
  social_links?: Record<string, string>
  created_at: string
  updated_at: string
} 