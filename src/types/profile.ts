export interface Profile {
  id: string
  created_at: string
  updated_at: string
  full_name: string | null
  bio: string | null
  avatar_url: string | null
  website: string | null
  twitter: string | null
  github: string | null
  email: string | null
  is_public: boolean
  user_id: string
} 