/**
 * Organization and Membership Types
 * 
 * Created: 2025-07-03
 * Purpose: TypeScript types for organizations and memberships system
 * Based on database schema from 20250108100000_association_system_clean.sql
 */

// =====================================================================
// ENUM TYPES (matching database enums)
// =====================================================================

export type EntityType = 'profile' | 'campaign' | 'organization' | 'collective' | 'project'

export type RelationshipType = 
  | 'created' | 'founded' | 'supports' | 'collaborates' | 'maintains'
  | 'member' | 'leader' | 'moderator' | 'contributor' | 'advisor'
  | 'investor' | 'sponsor' | 'partner' | 'beneficiary'

export type AssociationStatus = 'active' | 'inactive' | 'pending' | 'completed' | 'suspended' | 'disputed'

export type OrganizationType = 
  | 'dao' | 'company' | 'nonprofit' | 'community' | 'cooperative'
  | 'foundation' | 'collective' | 'guild' | 'syndicate'

export type GovernanceModel = 
  | 'hierarchical' | 'flat' | 'democratic' | 'consensus' | 'liquid_democracy'
  | 'quadratic_voting' | 'stake_weighted' | 'reputation_based'

export type MembershipRole = 
  | 'owner' | 'admin' | 'moderator' | 'member' | 'contributor'
  | 'observer' | 'advisor' | 'emeritus'

export type MembershipStatus = 
  | 'active' | 'inactive' | 'pending' | 'invited' | 'suspended'
  | 'banned' | 'alumni' | 'on_leave'

export type Visibility = 'public' | 'members_only' | 'private' | 'confidential'

// =====================================================================
// CORE INTERFACES
// =====================================================================

export interface Organization {
  id: string
  profile_id: string
  name: string
  slug: string
  description?: string
  website_url?: string
  avatar_url?: string
  banner_url?: string
  type: OrganizationType
  category?: string
  tags: string[]
  governance_model: GovernanceModel
  treasury_address?: string
  is_public: boolean
  requires_approval: boolean
  verification_level: number
  trust_score: number
  settings: Record<string, any>
  contact_info: Record<string, any>
  founded_at: string
  created_at: string
  updated_at: string
}

export interface Membership {
  id: string
  organization_id: string
  profile_id: string
  role: MembershipRole
  permissions: Record<string, any>
  title?: string
  status: MembershipStatus
  joined_at: string
  last_active_at: string
  contribution_address?: string
  total_contributions: number
  reward_percentage: number
  invited_by?: string
  invitation_token?: string
  invitation_expires_at?: string
  bio?: string
  achievements: any[]
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ProfileAssociation {
  id: string
  source_profile_id: string
  target_entity_id: string
  target_entity_type: EntityType
  relationship_type: RelationshipType
  role?: string
  status: AssociationStatus
  bitcoin_reward_address?: string
  reward_percentage: number
  permissions: Record<string, any>
  metadata: Record<string, any>
  visibility: Visibility
  starts_at: string
  ends_at?: string
  created_at: string
  updated_at: string
  version: number
  created_by?: string
  last_modified_by?: string
}

// =====================================================================
// EXTENDED INTERFACES WITH RELATIONS
// =====================================================================

export interface OrganizationWithMemberships extends Organization {
  memberships: Membership[]
  member_count: number
  admin_count: number
  recent_activity?: any[]
}

export interface MembershipWithProfile extends Membership {
  profile: {
    id: string
    username?: string
    display_name?: string
    avatar_url?: string
    bio?: string
  }
}

export interface MembershipWithOrganization extends Membership {
  organization: Organization
}

// =====================================================================
// FORM DATA INTERFACES
// =====================================================================

export interface OrganizationFormData {
  name: string
  description?: string
  website_url?: string
  avatar_url?: string
  banner_url?: string
  type: OrganizationType
  category?: string
  tags: string[]
  governance_model: GovernanceModel
  treasury_address?: string
  is_public: boolean
  requires_approval: boolean
  contact_info?: Record<string, any>
  settings?: Record<string, any>
}

export interface MembershipFormData {
  role: MembershipRole
  title?: string
  bio?: string
  contribution_address?: string
  reward_percentage?: number
  permissions?: Record<string, any>
}

export interface InvitationFormData {
  email?: string
  profile_id?: string
  role: MembershipRole
  title?: string
  message?: string
  expires_in_days?: number
}

// =====================================================================
// API RESPONSE INTERFACES
// =====================================================================

export interface OrganizationResponse {
  success: boolean
  data?: Organization
  error?: string
}

export interface OrganizationsResponse {
  success: boolean
  data?: Organization[]
  error?: string
  pagination?: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

export interface MembershipResponse {
  success: boolean
  data?: Membership
  error?: string
}

export interface MembershipsResponse {
  success: boolean
  data?: Membership[]
  error?: string
}

// =====================================================================
// SEARCH AND FILTER INTERFACES
// =====================================================================

export interface OrganizationFilters {
  type?: OrganizationType
  category?: string
  governance_model?: GovernanceModel
  is_public?: boolean
  verification_level?: number
  tags?: string[]
  search?: string
}

export interface MembershipFilters {
  organization_id?: string
  role?: MembershipRole
  status?: MembershipStatus
  search?: string
}

export interface OrganizationSearchParams {
  q?: string
  type?: OrganizationType
  category?: string
  page?: number
  limit?: number
  sort?: 'name' | 'created_at' | 'member_count' | 'trust_score'
  order?: 'asc' | 'desc'
}

// =====================================================================
// UTILITY TYPES
// =====================================================================

export type OrganizationPermission = 
  | 'manage_members'
  | 'invite_members'
  | 'manage_settings'
  | 'manage_treasury'
  | 'create_proposals'
  | 'moderate_content'
  | 'view_analytics'

export interface OrganizationStats {
  total_members: number
  active_members: number
  total_contributions: number
  treasury_balance: number
  proposals_count: number
  events_count: number
}

// =====================================================================
// CONSTANTS
// =====================================================================

export const ORGANIZATION_TYPES: { value: OrganizationType; label: string; description: string }[] = [
  { value: 'dao', label: 'DAO', description: 'Decentralized Autonomous Organization' },
  { value: 'company', label: 'Company', description: 'Business organization' },
  { value: 'nonprofit', label: 'Non-Profit', description: 'Non-profit organization' },
  { value: 'community', label: 'Community', description: 'Community group' },
  { value: 'cooperative', label: 'Cooperative', description: 'Member-owned cooperative' },
  { value: 'foundation', label: 'Foundation', description: 'Charitable foundation' },
  { value: 'collective', label: 'Collective', description: 'Informal collective' },
  { value: 'guild', label: 'Guild', description: 'Professional guild' },
  { value: 'syndicate', label: 'Syndicate', description: 'Investment syndicate' }
]

export const MEMBERSHIP_ROLES: { value: MembershipRole; label: string; description: string }[] = [
  { value: 'owner', label: 'Owner', description: 'Organization owner with full control' },
  { value: 'admin', label: 'Admin', description: 'Administrator with management permissions' },
  { value: 'moderator', label: 'Moderator', description: 'Content and community moderator' },
  { value: 'member', label: 'Member', description: 'Regular organization member' },
  { value: 'contributor', label: 'Contributor', description: 'Active contributor' },
  { value: 'observer', label: 'Observer', description: 'Observer with limited access' },
  { value: 'advisor', label: 'Advisor', description: 'Strategic advisor' },
  { value: 'emeritus', label: 'Emeritus', description: 'Former member with honorary status' }
]

export const GOVERNANCE_MODELS: { value: GovernanceModel; label: string; description: string }[] = [
  { value: 'hierarchical', label: 'Hierarchical', description: 'Traditional top-down structure' },
  { value: 'flat', label: 'Flat', description: 'Flat organizational structure' },
  { value: 'democratic', label: 'Democratic', description: 'One person, one vote' },
  { value: 'consensus', label: 'Consensus', description: 'Consensus-based decisions' },
  { value: 'liquid_democracy', label: 'Liquid Democracy', description: 'Delegatable voting' },
  { value: 'quadratic_voting', label: 'Quadratic Voting', description: 'Quadratic voting system' },
  { value: 'stake_weighted', label: 'Stake Weighted', description: 'Voting power based on stake' },
  { value: 'reputation_based', label: 'Reputation Based', description: 'Voting based on reputation' }
]