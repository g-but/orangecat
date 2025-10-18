export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          display_name: string | null
          bio: string | null
          location: string | null
          avatar_url: string | null
          banner_url: string | null
          website: string | null
          bitcoin_address: string | null
          lightning_address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          display_name?: string | null
          bio?: string | null
          location?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          website?: string | null
          bitcoin_address?: string | null
          lightning_address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          display_name?: string | null
          bio?: string | null
          location?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          website?: string | null
          bitcoin_address?: string | null
          lightning_address?: string | null
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
      campaigns: {
        Row: {
          id: string
          title: string
          description: string
          goal_amount: number
          current_amount: number
          currency: string
          status: string
          creator_id: string
          organization_id: string | null
          project_id: string | null
          bitcoin_address: string | null
          lightning_address: string | null
          featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          goal_amount: number
          current_amount?: number
          currency?: string
          status?: string
          creator_id: string
          organization_id?: string | null
          project_id?: string | null
          bitcoin_address?: string | null
          lightning_address?: string | null
          featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          goal_amount?: number
          current_amount?: number
          currency?: string
          status?: string
          creator_id?: string
          organization_id?: string | null
          project_id?: string | null
          bitcoin_address?: string | null
          lightning_address?: string | null
          featured?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      donations: {
        Row: {
          id: string
          campaign_id: string
          donor_id: string | null
          amount: number
          currency: string
          payment_method: string
          transaction_hash: string | null
          lightning_payment_hash: string | null
          status: string
          anonymous: boolean
          message: string | null
          created_at: string
          confirmed_at: string | null
        }
        Insert: {
          id?: string
          campaign_id: string
          donor_id?: string | null
          amount: number
          currency?: string
          payment_method: string
          transaction_hash?: string | null
          lightning_payment_hash?: string | null
          status?: string
          anonymous?: boolean
          message?: string | null
          created_at?: string
          confirmed_at?: string | null
        }
        Update: {
          id?: string
          campaign_id?: string
          donor_id?: string | null
          amount?: number
          currency?: string
          payment_method?: string
          transaction_hash?: string | null
          lightning_payment_hash?: string | null
          status?: string
          anonymous?: boolean
          message?: string | null
          created_at?: string
          confirmed_at?: string | null
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
export type Campaign = Database['public']['Tables']['campaigns']['Row']
export type Donation = Database['public']['Tables']['donations']['Row']
export type Organization = Database['public']['Tables']['organizations']['Row']
export type OrganizationMember = Database['public']['Tables']['organization_members']['Row']
export type Project = Database['public']['Tables']['projects']['Row']

export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type CampaignInsert = Database['public']['Tables']['campaigns']['Insert']
export type DonationInsert = Database['public']['Tables']['donations']['Insert']
export type OrganizationInsert = Database['public']['Tables']['organizations']['Insert']
export type OrganizationMemberInsert = Database['public']['Tables']['organization_members']['Insert']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']

export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type CampaignUpdate = Database['public']['Tables']['campaigns']['Update']
export type DonationUpdate = Database['public']['Tables']['donations']['Update']
export type OrganizationUpdate = Database['public']['Tables']['organizations']['Update']
export type OrganizationMemberUpdate = Database['public']['Tables']['organization_members']['Update']
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']

// Form data types for profile operations
export type ProfileFormData = {
  username?: string | null
  display_name?: string | null
  bio?: string | null
  location?: string | null
  avatar_url?: string | null
  banner_url?: string | null
  website?: string | null
  bitcoin_address?: string | null
  lightning_address?: string | null
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
  can_create_campaigns?: boolean
  can_invite_members?: boolean
  can_manage_funds?: boolean
  can_remove_members?: boolean
  can_edit_campaigns?: boolean
}

// Extended types with relationships
export type OrganizationWithMembers = Organization & {
  members?: OrganizationMember[]
  member_count?: number
}

export type ProjectWithCampaigns = Project & {
  campaigns?: Campaign[]
  campaign_count?: number
}

export type CampaignWithProject = Campaign & {
  project?: Project | null
}

export type ProfileWithOrganizations = Profile & {
  memberships?: OrganizationMember[]
  organizations?: Organization[]
}