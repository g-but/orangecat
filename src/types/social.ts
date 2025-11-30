/**
 * SOCIAL NETWORKING & COLLABORATION TYPES
 *
 * This file defines the complete type system for OrangeCat's social
 * networking features including People, Organizations, and Projects
 * with Bitcoin-native functionality.
 *
 * Created: 2025-01-01
 * Last Modified: 2025-11-24
 * Last Modified Summary: Added SocialLink type for profile social links
 */

import type { ScalableProfile } from '@/services/profileService';
import { Profile } from './database';
import { MembershipRole } from './organization';
import type { SocialPlatformId } from '@/lib/social-platforms';

// =====================================================================
// 🔗 SOCIAL LINKS
// =====================================================================

/**
 * Social link structure for profiles
 * Uses progressive disclosure - users add links one at a time
 */
export interface SocialLink {
  platform: SocialPlatformId;
  label?: string; // For custom platforms
  value: string; // URL or username
}

/**
 * Social links container
 * Stored in profiles.social_links JSONB column
 */
export interface SocialLinks {
  links: SocialLink[];
}

// =====================================================================
// 👥 PEOPLE & CONNECTIONS
// =====================================================================

export interface Connection {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  created_at: string;
  updated_at: string;
  message?: string;

  // Populated fields
  requester?: ScalableProfile;
  recipient?: ScalableProfile;
}

export interface ConnectionRequest {
  recipient_id: string;
  message?: string;
}

export interface PeopleSearchFilters {
  query?: string;
  location?: string;
  skills?: string[];
  verification_status?: 'verified' | 'unverified';
  bitcoin_experience?: 'beginner' | 'intermediate' | 'expert';
  interests?: string[];
  limit?: number;
  offset?: number;
}

// =====================================================================
// 🏢 ORGANIZATIONS
// =====================================================================

export interface Organization {
  id: string;
  name: string;
  description: string;
  mission_statement?: string;
  website?: string;
  logo_url?: string;
  banner_url?: string;

  // Bitcoin wallet info
  bitcoin_address: string;
  lightning_address?: string;
  wallet_balance: number;
  total_raised: number;
  total_spent: number;

  // Organization details
  type: 'nonprofit' | 'company' | 'dao' | 'community' | 'project';
  status: 'active' | 'inactive' | 'suspended';
  visibility: 'public' | 'private' | 'invite_only';

  // Membership
  member_count: number;
  max_members?: number;

  // Metadata
  founded_at: string;
  created_at: string;
  updated_at: string;
  created_by: string;

  // Social & Contact
  social_links: Record<string, string> | { links: SocialLink[] };
  contact_email?: string;
  location?: string;
  timezone?: string;

  // Settings
  settings: {
    require_approval: boolean;
    allow_member_invites: boolean;
    public_transactions: boolean;
    voting_enabled: boolean;
    proposal_threshold: number;
  };

  // Populated fields
  creator?: ScalableProfile;
  members?: OrganizationMember[];
  projects?: Project[];
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'contributor';
  permissions: string[];
  joined_at: string;
  invited_by?: string;
  status: 'active' | 'inactive' | 'pending';

  // Populated fields
  user?: ScalableProfile;
  inviter?: ScalableProfile;
}

export interface OrganizationFormData {
  name: string;
  description: string;
  mission_statement?: string;
  website?: string;
  type: Organization['type'];
  visibility: Organization['visibility'];
  contact_email?: string;
  location?: string;
  social_links?: Record<string, string>;
  settings?: Partial<Organization['settings']>;
}

// All entities consolidated into projects for unified architecture

// =====================================================================
// 🔍 SEARCH & DISCOVERY
// =====================================================================

export interface SearchFilters {
  query?: string;
  type?: 'people' | 'organizations' | 'projects';
  location?: string;
  tags?: string[];
  category?: string;
  verification_status?: string;
  funding_status?: 'seeking' | 'funded' | 'completed';
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  type: 'person' | 'organization' | 'project';
  id: string;
  title: string;
  description: string;
  image_url?: string;
  verification_status?: string;
  member_count?: number;
  funding_progress?: number;
  tags?: string[];
  location?: string;
  created_at: string;

  // Type-specific data
  data: ScalableProfile | Organization | Project;
}

// =====================================================================
// 💰 BITCOIN WALLET MANAGEMENT
// =====================================================================

export interface WalletInfo {
  id: string;
  entity_type: 'user' | 'organization' | 'project';
  entity_id: string;

  // Addresses
  bitcoin_address: string;
  lightning_address?: string;

  // Balances (in satoshis)
  bitcoin_balance: number;
  lightning_balance: number;

  // Transaction history
  total_received: number;
  total_sent: number;
  transaction_count: number;

  // Settings
  public_address: boolean;
  auto_generate_invoices: boolean;

  // Metadata
  created_at: string;
  updated_at: string;
  last_sync_at?: string;
}

export interface Transaction {
  id: string;
  wallet_id: string;

  // Transaction details
  txid: string;
  type: 'incoming' | 'outgoing';
  amount: number; // satoshis
  fee?: number;

  // Network
  network: 'bitcoin' | 'lightning';
  confirmations?: number;
  block_height?: number;

  // Metadata
  description?: string;
  tags?: string[];
  category?: string;

  // Timestamps
  created_at: string;
  confirmed_at?: string;

  // Related entities
  from_address?: string;
  to_address?: string;
  related_entity_type?: 'user' | 'organization' | 'project';
  related_entity_id?: string;
}

// =====================================================================
// 📊 ANALYTICS & INSIGHTS
// =====================================================================

export interface SocialAnalytics {
  // Connections
  total_connections: number;
  pending_requests: number;
  connection_growth: number;

  // Organizations
  organizations_joined: number;
  organizations_created: number;
  organization_roles: Record<string, number>;

  // Projects
  projects_joined: number;
  projects_created: number;
  project_contributions: number;

  // Financial
  total_raised_across_projects: number;
  total_contributed: number;
  average_contribution: number;

  // Engagement
  collaboration_score: number;
  reputation_score: number;
}

// =====================================================================
// 🎯 USER EXPERIENCE HELPERS
// =====================================================================

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  action: string;
  completed: boolean;
  required: boolean;
}

export interface EmptyStateContent {
  title: string;
  description: string;
  primaryAction: {
    label: string;
    action: string;
    icon?: string;
  };
  secondaryAction?: {
    label: string;
    action: string;
    icon?: string;
  };
  benefits: string[];
  examples: string[];
}

// =====================================================================
// 🔔 NOTIFICATIONS & ACTIVITY
// =====================================================================

export interface Notification {
  id: string;
  user_id: string;
  type:
    | 'connection_request'
    | 'organization_invite'
    | 'project_invite'
    | 'payment_received'
    | 'milestone_completed'
    | 'mention'
    | 'system';
  title: string;
  message: string;

  // Related entities
  related_entity_type?: 'user' | 'organization' | 'project' | 'transaction';
  related_entity_id?: string;

  // Status
  read: boolean;
  action_required: boolean;
  action_url?: string;

  // Metadata
  created_at: string;
  read_at?: string;
  expires_at?: string;
}

export interface ActivityFeed {
  id: string;
  user_id: string;
  type: 'connection' | 'organization' | 'project' | 'transaction' | 'achievement';
  action: string;
  description: string;

  // Related entities
  related_entities: Array<{
    type: 'user' | 'organization' | 'project';
    id: string;
    name: string;
    image_url?: string;
  }>;

  // Metadata
  created_at: string;
  visibility: 'public' | 'connections' | 'private';
}

// =====================================================================
// ORGANIZATION APPLICATION TYPES (NEW)
// =====================================================================

export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';

export interface OrganizationApplication {
  id: string;
  organization_id: string;
  applicant_id: string;
  application_data: Record<string, any>;
  status: ApplicationStatus;
  message?: string;
  responses: Record<string, any>;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export interface ApplicationFormData {
  message?: string;
  responses: Record<string, any>;
  bio?: string;
  motivation?: string;
  experience?: string;
  availability?: string;
}

export interface ApplicationWithDetails extends OrganizationApplication {
  organization: Organization;
  applicant: {
    id: string;
    username?: string;
    name?: string;
    avatar_url?: string;
    bio?: string;
  };
  reviewer?: {
    id: string;
    username?: string;
    name?: string;
  };
}

// =====================================================================
// ORGANIZATION INVITATION TYPES (NEW)
// =====================================================================

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'withdrawn';

export interface OrganizationInvitation {
  id: string;
  organization_id: string;
  inviter_id: string;
  invitee_id?: string;
  invitee_email?: string;
  role: MembershipRole;
  title?: string;
  message?: string;
  invitation_token: string;
  status: InvitationStatus;
  permissions: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  expires_at: string;
  accepted_at?: string;
}

export interface InvitationFormData {
  invitee_id?: string;
  invitee_email?: string;
  role: MembershipRole;
  title?: string;
  message?: string;
  expires_in_days?: number;
  permissions?: Record<string, any>;
}

export interface InvitationWithDetails extends OrganizationInvitation {
  organization: Organization;
  inviter: {
    id: string;
    username?: string;
    name?: string;
    avatar_url?: string;
  };
  invitee?: {
    id: string;
    username?: string;
    name?: string;
    avatar_url?: string;
  };
}

// =====================================================================
// BITCOIN COLLABORATION TYPES (NEW)
// =====================================================================

export type CollaborationType =
  | 'split_payment'
  | 'joint_funding'
  | 'shared_wallet'
  | 'payment_request';
export type CollaborationStatus = 'pending' | 'active' | 'completed' | 'cancelled' | 'expired';
export type PaymentStatus = 'pending' | 'confirmed' | 'failed' | 'refunded';

export interface CollaborationParticipant {
  user_id: string;
  username?: string;
  name?: string;
  avatar_url?: string;
  amount: number;
  percentage?: number;
  payment_address?: string;
  has_paid?: boolean;
  paid_amount?: number;
}

export interface BitcoinCollaboration {
  id: string;
  collaboration_type: CollaborationType;
  initiator_id: string;
  participants: CollaborationParticipant[];
  title: string;
  description?: string;
  total_amount: number;
  currency: string;
  target_address?: string;
  funding_page_id?: string;
  status: CollaborationStatus;
  payment_deadline?: string;
  collaboration_data: Record<string, any>;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface CollaborationPayment {
  id: string;
  collaboration_id: string;
  payer_id: string;
  amount: number;
  expected_amount: number;
  transaction_hash?: string;
  payment_address: string;
  status: PaymentStatus;
  created_at: string;
  confirmed_at?: string;
}

export interface CollaborationFormData {
  collaboration_type: CollaborationType;
  title: string;
  description?: string;
  total_amount: number;
  target_address?: string;
  funding_page_id?: string;
  payment_deadline?: string;
  participants: {
    user_id: string;
    amount?: number;
    percentage?: number;
  }[];
}

export interface CollaborationWithDetails extends BitcoinCollaboration {
  initiator: {
    id: string;
    username?: string;
    name?: string;
    avatar_url?: string;
  };
  payments: CollaborationPayment[];
  funding_page?: {
    id: string;
    title: string;
    slug?: string;
  };
}
