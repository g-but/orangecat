export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          name: string | null
          bio: string | null
          avatar_url: string | null
          bitcoin_address: string | null
          lightning_address: string | null
          verification_status: string | null
          status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          name?: string | null
          bio?: string | null
          avatar_url?: string | null
          bitcoin_address?: string | null
          lightning_address?: string | null
          verification_status?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          name?: string | null
          bio?: string | null
          avatar_url?: string | null
          bitcoin_address?: string | null
          lightning_address?: string | null
          verification_status?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          avatar_url: string | null
          banner_url: string | null
          website: string | null
          bitcoin_address: string | null
          lightning_address: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          website?: string | null
          bitcoin_address?: string | null
          lightning_address?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          website?: string | null
          bitcoin_address?: string | null
          lightning_address?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          title: string
          description: string
          goal_amount: number | null
          goal_currency: string | null
          funding_purpose: string | null
          current_amount: number
          currency: string
          status: string
          creator_id: string
          organization_id: string | null
          bitcoin_address: string | null
          lightning_address: string | null
          featured: boolean
          start_date: string | null
          target_completion: string | null
          category: string | null
          tags: string[] | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          goal_amount?: number | null
          goal_currency?: string | null
          funding_purpose?: string | null
          current_amount?: number
          currency?: string
          status?: string
          creator_id: string
          organization_id?: string | null
          bitcoin_address?: string | null
          lightning_address?: string | null
          featured?: boolean
          start_date?: string | null
          target_completion?: string | null
          category?: string | null
          tags?: string[] | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          goal_amount?: number | null
          goal_currency?: string | null
          funding_purpose?: string | null
          current_amount?: number
          currency?: string
          status?: string
          creator_id?: string
          organization_id?: string | null
          bitcoin_address?: string | null
          lightning_address?: string | null
          featured?: boolean
          start_date?: string | null
          target_completion?: string | null
          category?: string | null
          tags?: string[] | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          amount_sats: number
          currency: string
          from_entity_type: string
          from_entity_id: string
          to_entity_type: string
          to_entity_id: string
          payment_method: string
          transaction_hash: string | null
          lightning_payment_hash: string | null
          payment_proof: string | null
          status: string
          fee_sats: number
          exchange_rate: number | null
          anonymous: boolean
          message: string | null
          purpose: string | null
          tags: string[] | null
          public_visibility: boolean
          audit_trail: Json | null
          verification_status: string | null
          initiated_at: string | null
          confirmed_at: string | null
          settled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          amount_sats: number
          currency?: string
          from_entity_type: string
          from_entity_id: string
          to_entity_type: string
          to_entity_id: string
          payment_method: string
          transaction_hash?: string | null
          lightning_payment_hash?: string | null
          payment_proof?: string | null
          status?: string
          fee_sats?: number
          exchange_rate?: number | null
          anonymous?: boolean
          message?: string | null
          purpose?: string | null
          tags?: string[] | null
          public_visibility?: boolean
          audit_trail?: Json | null
          verification_status?: string | null
          initiated_at?: string | null
          confirmed_at?: string | null
          settled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          amount_sats?: number
          currency?: string
          from_entity_type?: string
          from_entity_id?: string
          to_entity_type?: string
          to_entity_id?: string
          payment_method?: string
          transaction_hash?: string | null
          lightning_payment_hash?: string | null
          payment_proof?: string | null
          status?: string
          fee_sats?: number
          exchange_rate?: number | null
          anonymous?: boolean
          message?: string | null
          purpose?: string | null
          tags?: string[] | null
          public_visibility?: boolean
          audit_trail?: Json | null
          verification_status?: string | null
          initiated_at?: string | null
          confirmed_at?: string | null
          settled_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          profile_id: string
          role: 'owner' | 'admin' | 'member' | 'contributor'
          permissions: Record<string, any>
          bitcoin_reward_address: string | null
          reward_share_percentage: number
          joined_at: string
          invited_by: string | null
          status: 'active' | 'pending' | 'removed' | 'suspended'
          notes: string | null
          metadata: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          profile_id: string
          role: 'owner' | 'admin' | 'member' | 'contributor'
          permissions?: Record<string, any>
          bitcoin_reward_address?: string | null
          reward_share_percentage?: number
          joined_at?: string
          invited_by?: string | null
          status?: 'active' | 'pending' | 'removed' | 'suspended'
          notes?: string | null
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          profile_id?: string
          role?: 'owner' | 'admin' | 'member' | 'contributor'
          permissions?: Record<string, any>
          bitcoin_reward_address?: string | null
          reward_share_percentage?: number
          joined_at?: string
          invited_by?: string | null
          status?: 'active' | 'pending' | 'removed' | 'suspended'
          notes?: string | null
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          owner_type: 'profile' | 'organization'
          owner_id: string
          avatar_url: string | null
          banner_url: string | null
          website: string | null
          bitcoin_address: string | null
          lightning_address: string | null
          status: 'planning' | 'active' | 'completed' | 'on_hold' | 'cancelled'
          visibility: 'public' | 'unlisted' | 'private'
          tags: string[]
          category: string | null
          start_date: string
          target_completion: string | null
          completed_at: string | null
          metadata: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug?: string
          description?: string | null
          owner_type: 'profile' | 'organization'
          owner_id: string
          avatar_url?: string | null
          banner_url?: string | null
          website?: string | null
          bitcoin_address?: string | null
          lightning_address?: string | null
          status?: 'planning' | 'active' | 'completed' | 'on_hold' | 'cancelled'
          visibility?: 'public' | 'unlisted' | 'private'
          tags?: string[]
          category?: string | null
          start_date?: string
          target_completion?: string | null
          completed_at?: string | null
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          owner_type?: 'profile' | 'organization'
          owner_id?: string
          avatar_url?: string | null
          banner_url?: string | null
          website?: string | null
          bitcoin_address?: string | null
          lightning_address?: string | null
          status?: 'planning' | 'active' | 'completed' | 'on_hold' | 'cancelled'
          visibility?: 'public' | 'unlisted' | 'private'
          tags?: string[]
          category?: string | null
          start_date?: string
          target_completion?: string | null
          completed_at?: string | null
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type Organization = Database['public']['Tables']['organizations']['Row']
export type OrganizationMember = Database['public']['Tables']['organization_members']['Row']

export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
export type OrganizationInsert = Database['public']['Tables']['organizations']['Insert']
export type OrganizationMemberInsert = Database['public']['Tables']['organization_members']['Insert']

export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update']
export type OrganizationUpdate = Database['public']['Tables']['organizations']['Update']
export type OrganizationMemberUpdate = Database['public']['Tables']['organization_members']['Update']

// Form data types for profile operations
export type ProfileFormData = {
  username?: string | null
  name?: string | null
  bio?: string | null
  location?: string | null
  avatar_url?: string | null
  banner_url?: string | null
  website?: string | null
  bitcoin_address?: string | null
  lightning_address?: string | null
}

// Form data types for entity operations
export type ProjectFormData = {
  title: string
  description: string
  goal_amount?: number | null
  currency?: string
  start_date?: string | null
  target_completion?: string | null
  category?: string | null
  tags?: string[]
  organization_id?: string | null
}

export type TransactionFormData = {
  amount_sats: number
  from_entity_type: 'profile' | 'organization' | 'project'
  from_entity_id: string
  to_entity_type: 'profile' | 'organization' | 'project'
  to_entity_id: string
  payment_method: 'bitcoin' | 'lightning' | 'on-chain' | 'off-chain'
  message?: string | null
  purpose?: string | null
  anonymous?: boolean
  public_visibility?: boolean
}

export type ProfileData = Profile

// Form data types for organization operations
export type OrganizationFormData = {
  name: string
  slug?: string
  description?: string | null
  avatar_url?: string | null
  banner_url?: string | null
  website?: string | null
  bitcoin_address?: string | null
  lightning_address?: string | null
}

// Form data types for settings operations
export type ProfileFormData = {
  username: string
  name?: string
  bio?: string
  avatar_url?: string
  banner_url?: string
  website?: string
  bitcoin_address?: string
  lightning_address?: string
  location?: string
}

// Form data types for password operations
export type PasswordFormData = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// Form data types for project operations
export type ProjectFormData = {
  name: string
  slug?: string
  description?: string | null
  owner_type: 'profile' | 'organization'
  owner_id: string
  avatar_url?: string | null
  banner_url?: string | null
  website?: string | null
  bitcoin_address?: string | null
  lightning_address?: string | null
  status?: 'planning' | 'active' | 'completed' | 'on_hold' | 'cancelled'
  visibility?: 'public' | 'unlisted' | 'private'
  tags?: string[]
  category?: string | null
  target_completion?: string | null
}

// Permission types for organization members
export type OrganizationPermissions = {
  can_edit_org?: boolean
  can_create_projects?: boolean
  can_invite_members?: boolean
  can_manage_funds?: boolean
  can_remove_members?: boolean
  can_edit_projects?: boolean
}

// Extended types with relationships
export type OrganizationWithMembers = Organization & {
  members?: OrganizationMember[]
  member_count?: number
}

export type ProjectWithSubprojects = Project & {
  subprojects?: Project[]
  subproject_count?: number
}

// Extended project type with additional computed fields
export type ProjectWithStats = Project & {
  total_donations?: number
  donor_count?: number
  days_remaining?: number | null
}

export type ProfileWithOrganizations = Profile & {
  memberships?: OrganizationMember[]
  organizations?: Organization[]
}