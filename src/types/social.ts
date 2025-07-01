/**
 * SOCIAL NETWORKING & COLLABORATION TYPES
 * 
 * This file defines the complete type system for OrangeCat's social
 * networking features including People, Organizations, and Projects
 * with Bitcoin-native functionality.
 */

import type { ScalableProfile } from '@/services/profileService'

// =====================================================================
// 👥 PEOPLE & CONNECTIONS
// =====================================================================

export interface Connection {
  id: string
  requester_id: string
  recipient_id: string
  status: 'pending' | 'accepted' | 'declined' | 'blocked'
  created_at: string
  updated_at: string
  message?: string
  
  // Populated fields
  requester?: ScalableProfile
  recipient?: ScalableProfile
}

export interface ConnectionRequest {
  recipient_id: string
  message?: string
}

export interface PeopleSearchFilters {
  query?: string
  location?: string
  skills?: string[]
  verification_status?: 'verified' | 'unverified'
  bitcoin_experience?: 'beginner' | 'intermediate' | 'expert'
  interests?: string[]
  limit?: number
  offset?: number
}

// =====================================================================
// 🏢 ORGANIZATIONS
// =====================================================================

export interface Organization {
  id: string
  name: string
  description: string
  mission_statement?: string
  website?: string
  logo_url?: string
  banner_url?: string
  
  // Bitcoin wallet info
  bitcoin_address: string
  lightning_address?: string
  wallet_balance: number
  total_raised: number
  total_spent: number
  
  // Organization details
  type: 'nonprofit' | 'company' | 'dao' | 'community' | 'project'
  status: 'active' | 'inactive' | 'suspended'
  visibility: 'public' | 'private' | 'invite_only'
  
  // Membership
  member_count: number
  max_members?: number
  
  // Metadata
  founded_at: string
  created_at: string
  updated_at: string
  created_by: string
  
  // Social & Contact
  social_links: Record<string, string>
  contact_email?: string
  location?: string
  timezone?: string
  
  // Settings
  settings: {
    require_approval: boolean
    allow_member_invites: boolean
    public_transactions: boolean
    voting_enabled: boolean
    proposal_threshold: number
  }
  
  // Populated fields
  creator?: ScalableProfile
  members?: OrganizationMember[]
  projects?: Project[]
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member' | 'contributor'
  permissions: string[]
  joined_at: string
  invited_by?: string
  status: 'active' | 'inactive' | 'pending'
  
  // Populated fields
  user?: ScalableProfile
  inviter?: ScalableProfile
}

export interface OrganizationFormData {
  name: string
  description: string
  mission_statement?: string
  website?: string
  type: Organization['type']
  visibility: Organization['visibility']
  contact_email?: string
  location?: string
  social_links?: Record<string, string>
  settings?: Partial<Organization['settings']>
}

// =====================================================================
// 🚀 PROJECTS
// =====================================================================

export interface Project {
  id: string
  name: string
  description: string
  detailed_description?: string
  
  // Project classification
  category: 'fundraising' | 'development' | 'research' | 'community' | 'education' | 'other'
  tags: string[]
  
  // Bitcoin wallet info
  bitcoin_address: string
  lightning_address?: string
  wallet_balance: number
  funding_goal?: number
  total_raised: number
  total_spent: number
  
  // Project status
  status: 'planning' | 'active' | 'completed' | 'paused' | 'cancelled'
  visibility: 'public' | 'private' | 'organization_only'
  
  // Timeline
  start_date?: string
  end_date?: string
  deadline?: string
  
  // Ownership
  created_by: string
  organization_id?: string
  
  // Team
  team_size: number
  max_team_size?: number
  
  // Media
  logo_url?: string
  banner_url?: string
  images?: string[]
  
  // Metadata
  created_at: string
  updated_at: string
  
  // Social & Contact
  website?: string
  social_links: Record<string, string>
  
  // Settings
  settings: {
    allow_public_contributions: boolean
    require_approval_to_join: boolean
    public_transactions: boolean
    milestone_based: boolean
    voting_enabled: boolean
  }
  
  // Populated fields
  creator?: ScalableProfile
  organization?: Organization
  team_members?: ProjectMember[]
  milestones?: ProjectMilestone[]
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: 'owner' | 'lead' | 'contributor' | 'supporter'
  permissions: string[]
  joined_at: string
  contribution_type?: string[]
  
  // Populated fields
  user?: ScalableProfile
}

export interface ProjectMilestone {
  id: string
  project_id: string
  title: string
  description: string
  funding_target?: number
  deadline?: string
  status: 'pending' | 'in_progress' | 'completed' | 'missed'
  created_at: string
  completed_at?: string
}

export interface ProjectFormData {
  name: string
  description: string
  detailed_description?: string
  category: Project['category']
  tags?: string[]
  funding_goal?: number
  start_date?: string
  end_date?: string
  deadline?: string
  organization_id?: string
  visibility: Project['visibility']
  website?: string
  social_links?: Record<string, string>
  settings?: Partial<Project['settings']>
}

// =====================================================================
// 🔍 SEARCH & DISCOVERY
// =====================================================================

export interface SearchFilters {
  query?: string
  type?: 'people' | 'organizations' | 'projects'
  location?: string
  tags?: string[]
  category?: string
  verification_status?: string
  funding_status?: 'seeking' | 'funded' | 'completed'
  limit?: number
  offset?: number
}

export interface SearchResult {
  type: 'person' | 'organization' | 'project'
  id: string
  title: string
  description: string
  image_url?: string
  verification_status?: string
  member_count?: number
  funding_progress?: number
  tags?: string[]
  location?: string
  created_at: string
  
  // Type-specific data
  data: ScalableProfile | Organization | Project
}

// =====================================================================
// 💰 BITCOIN WALLET MANAGEMENT
// =====================================================================

export interface WalletInfo {
  id: string
  entity_type: 'user' | 'organization' | 'project'
  entity_id: string
  
  // Addresses
  bitcoin_address: string
  lightning_address?: string
  
  // Balances (in satoshis)
  bitcoin_balance: number
  lightning_balance: number
  
  // Transaction history
  total_received: number
  total_sent: number
  transaction_count: number
  
  // Settings
  public_address: boolean
  auto_generate_invoices: boolean
  
  // Metadata
  created_at: string
  updated_at: string
  last_sync_at?: string
}

export interface Transaction {
  id: string
  wallet_id: string
  
  // Transaction details
  txid: string
  type: 'incoming' | 'outgoing'
  amount: number // satoshis
  fee?: number
  
  // Network
  network: 'bitcoin' | 'lightning'
  confirmations?: number
  block_height?: number
  
  // Metadata
  description?: string
  tags?: string[]
  category?: string
  
  // Timestamps
  created_at: string
  confirmed_at?: string
  
  // Related entities
  from_address?: string
  to_address?: string
  related_entity_type?: 'user' | 'organization' | 'project'
  related_entity_id?: string
}

// =====================================================================
// 📊 ANALYTICS & INSIGHTS
// =====================================================================

export interface SocialAnalytics {
  // Connections
  total_connections: number
  pending_requests: number
  connection_growth: number
  
  // Organizations
  organizations_joined: number
  organizations_created: number
  organization_roles: Record<string, number>
  
  // Projects
  projects_joined: number
  projects_created: number
  project_contributions: number
  
  // Financial
  total_raised_across_projects: number
  total_contributed: number
  average_contribution: number
  
  // Engagement
  profile_views: number
  collaboration_score: number
  reputation_score: number
}

// =====================================================================
// 🎯 USER EXPERIENCE HELPERS
// =====================================================================

export interface OnboardingStep {
  id: string
  title: string
  description: string
  action: string
  completed: boolean
  required: boolean
}

export interface EmptyStateContent {
  title: string
  description: string
  primaryAction: {
    label: string
    action: string
    icon?: string
  }
  secondaryAction?: {
    label: string
    action: string
    icon?: string
  }
  benefits: string[]
  examples: string[]
}

// =====================================================================
// 🔔 NOTIFICATIONS & ACTIVITY
// =====================================================================

export interface Notification {
  id: string
  user_id: string
  type: 'connection_request' | 'organization_invite' | 'project_invite' | 
        'payment_received' | 'milestone_completed' | 'mention' | 'system'
  title: string
  message: string
  
  // Related entities
  related_entity_type?: 'user' | 'organization' | 'project' | 'transaction'
  related_entity_id?: string
  
  // Status
  read: boolean
  action_required: boolean
  action_url?: string
  
  // Metadata
  created_at: string
  read_at?: string
  expires_at?: string
}

export interface ActivityFeed {
  id: string
  user_id: string
  type: 'connection' | 'organization' | 'project' | 'transaction' | 'achievement'
  action: string
  description: string
  
  // Related entities
  related_entities: Array<{
    type: 'user' | 'organization' | 'project'
    id: string
    name: string
    image_url?: string
  }>
  
  // Metadata
  created_at: string
  visibility: 'public' | 'connections' | 'private'
}
