/**
 * CIRCLES SYSTEM TYPES
 *
 * Comprehensive type definitions for the community circles/groups system.
 * Enables users to form groups with shared wallets, activities, and governance.
 */

export type CircleVisibility = 'public' | 'members_only' | 'private';

export type CircleJoinPolicy = 'open' | 'invite_only' | 'closed';

export type CircleCategory = 'family' | 'friends' | 'business' | 'investment' | 'community' | 'project' | 'other';

export type CircleRole = 'owner' | 'admin' | 'moderator' | 'member';

export type CircleMemberStatus = 'active' | 'inactive' | 'suspended' | 'left';

export type CircleInvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export type CircleWalletPurpose = 'general' | 'projects' | 'investment' | 'community' | 'emergency' | 'other';

export type CircleActivityType =
  | 'joined'
  | 'left'
  | 'invited_member'
  | 'created_wallet'
  | 'funded_wallet'
  | 'created_project'
  | 'posted_update'
  | 'made_offer'
  | 'received_offer';

// ==================== DATABASE TYPES ====================

export interface Circle {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  cover_image_url?: string;
  is_public: boolean;
  join_policy: CircleJoinPolicy;
  visibility: CircleVisibility;
  category?: CircleCategory;
  tags?: string[];
  created_by: string;
  rules?: string;
  member_count: number;
  total_balance_sats: number;
  total_projects: number;
  created_at: string;
  updated_at: string;
}

export interface CircleMember {
  id: string;
  circle_id: string;
  user_id: string;
  role: CircleRole;
  joined_at: string;
  invited_by?: string;
  status: CircleMemberStatus;
  status_changed_at: string;
  can_invite_members: boolean;
  can_manage_wallets: boolean;
  can_create_projects: boolean;
  can_manage_settings: boolean;
  last_activity_at: string;
  contribution_score: number;
}

export interface CircleWallet {
  id: string;
  circle_id: string;
  name: string;
  description?: string;
  purpose?: CircleWalletPurpose;
  bitcoin_address?: string;
  lightning_address?: string;
  total_received_sats: number;
  total_sent_sats: number;
  current_balance_sats: number;
  is_active: boolean;
  created_by: string;
  authorized_users?: string[];
  required_signatures: number;
  total_signers: number;
  created_at: string;
  updated_at: string;
}

export interface CircleInvitation {
  id: string;
  circle_id: string;
  invited_by: string;
  invited_user_id?: string;
  invited_email?: string;
  role: CircleRole;
  message?: string;
  expires_at: string;
  status: CircleInvitationStatus;
  responded_at?: string;
  created_at: string;
}

export interface CircleActivity {
  id: string;
  circle_id: string;
  user_id: string;
  activity_type: CircleActivityType;
  description: string;
  related_wallet_id?: string;
  related_project_id?: string;
  related_loan_id?: string;
  related_amount_sats?: number;
  metadata?: Record<string, any>;
  created_at: string;
}

// ==================== AGGREGATED TYPES ====================

export interface UserCircleSummary {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  member_count: number;
  role: CircleRole;
  joined_at: string;
  is_public: boolean;
  total_balance_sats: number;
  recent_activity_count: number;
}

export interface CircleMemberDetail {
  user_id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  role: CircleRole;
  joined_at: string;
  last_activity_at: string;
  contribution_score: number;
  is_online?: boolean;
}

export interface CircleWalletSummary {
  id: string;
  name: string;
  description?: string;
  purpose?: CircleWalletPurpose;
  bitcoin_address?: string;
  lightning_address?: string;
  current_balance_sats: number;
  is_active: boolean;
  can_access: boolean;
  authorized_users_count: number;
}

export interface CircleDashboardData {
  circle: Circle;
  myMembership: CircleMember;
  members: CircleMemberDetail[];
  wallets: CircleWalletSummary[];
  recentActivities: CircleActivity[];
  stats: {
    totalBalance: number;
    activeProjects: number;
    pendingOffers: number;
    monthlyGrowth: number;
  };
}

// ==================== FORM TYPES ====================

export interface CreateCircleRequest {
  name: string;
  description?: string;
  category?: CircleCategory;
  tags?: string[];
  is_public?: boolean;
  join_policy?: CircleJoinPolicy;
  visibility?: CircleVisibility;
  rules?: string;
}

export interface UpdateCircleRequest extends Partial<CreateCircleRequest> {
  avatar_url?: string;
  cover_image_url?: string;
}

export interface CreateCircleWalletRequest {
  circle_id: string;
  name: string;
  description?: string;
  purpose?: CircleWalletPurpose;
  bitcoin_address?: string;
  lightning_address?: string;
  authorized_users?: string[];
  required_signatures?: number;
  total_signers?: number;
}

export interface UpdateCircleWalletRequest extends Partial<CreateCircleWalletRequest> {
  is_active?: boolean;
}

export interface InviteToCircleRequest {
  circle_id: string;
  invited_user_id?: string;
  invited_email?: string;
  role?: CircleRole;
  message?: string;
}

export interface UpdateCircleMemberRequest {
  role?: CircleRole;
  can_invite_members?: boolean;
  can_manage_wallets?: boolean;
  can_create_projects?: boolean;
  can_manage_settings?: boolean;
  status?: CircleMemberStatus;
}

// ==================== API RESPONSE TYPES ====================

export interface CircleResponse {
  success: boolean;
  circle?: Circle;
  error?: string;
}

export interface CirclesListResponse {
  success: boolean;
  circles?: Circle[];
  total?: number;
  error?: string;
}

export interface CircleMembersResponse {
  success: boolean;
  members?: CircleMemberDetail[];
  total?: number;
  error?: string;
}

export interface CircleWalletsResponse {
  success: boolean;
  wallets?: CircleWalletSummary[];
  error?: string;
}

export interface CircleActivitiesResponse {
  success: boolean;
  activities?: CircleActivity[];
  total?: number;
  error?: string;
}

export interface CircleInvitationResponse {
  success: boolean;
  invitation?: CircleInvitation;
  error?: string;
}

// ==================== PAGINATION & FILTERING ====================

export interface CirclesQuery {
  category?: CircleCategory;
  is_public?: boolean;
  visibility?: CircleVisibility;
  member_count_min?: number;
  member_count_max?: number;
  sort_by?: 'created_at' | 'member_count' | 'name' | 'total_balance_sats';
  sort_order?: 'asc' | 'desc';
}

export interface CircleActivitiesQuery {
  activity_type?: CircleActivityType;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: 'created_at';
  sort_order?: 'asc' | 'desc';
}

export interface CirclesPagination extends Pagination {
  query?: CirclesQuery;
}

export interface CircleActivitiesPagination extends Pagination {
  query?: CircleActivitiesQuery;
}

// ==================== DISPLAY TYPES ====================

export interface CircleCardData extends Circle {
  myRole?: CircleRole;
  myJoinedAt?: string;
  previewMembers?: CircleMemberDetail[];
  isJoined?: boolean;
  canJoin?: boolean;
  recentActivity?: CircleActivity[];
}

export interface CircleInvitationCardData extends CircleInvitation {
  circle?: Circle;
  invited_by_profile?: {
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
  invited_user_profile?: {
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
}

// ==================== PERMISSIONS & ACCESS CONTROL ====================

export interface CirclePermissions {
  canView: boolean;
  canJoin: boolean;
  canInvite: boolean;
  canManageMembers: boolean;
  canManageWallets: boolean;
  canCreateProjects: boolean;
  canManageSettings: boolean;
  canDelete: boolean;
}

export interface CircleRolePermissions {
  [CircleRole.owner]: CirclePermissions;
  [CircleRole.admin]: CirclePermissions;
  [CircleRole.moderator]: CirclePermissions;
  [CircleRole.member]: CirclePermissions;
}

// Default permissions by role
export const DEFAULT_CIRCLE_PERMISSIONS: CircleRolePermissions = {
  owner: {
    canView: true,
    canJoin: true,
    canInvite: true,
    canManageMembers: true,
    canManageWallets: true,
    canCreateProjects: true,
    canManageSettings: true,
    canDelete: true,
  },
  admin: {
    canView: true,
    canJoin: true,
    canInvite: true,
    canManageMembers: true,
    canManageWallets: true,
    canCreateProjects: true,
    canManageSettings: true,
    canDelete: false,
  },
  moderator: {
    canView: true,
    canJoin: true,
    canInvite: true,
    canManageMembers: false,
    canManageWallets: false,
    canCreateProjects: true,
    canManageSettings: false,
    canDelete: false,
  },
  member: {
    canView: true,
    canJoin: true,
    canInvite: false,
    canManageMembers: false,
    canManageWallets: false,
    canCreateProjects: false,
    canManageSettings: false,
    canDelete: false,
  },
};

// ==================== VALIDATION TYPES ====================

export interface CircleValidationError {
  field: keyof CreateCircleRequest;
  message: string;
}

export interface CircleValidationResult {
  valid: boolean;
  errors: CircleValidationError[];
}

// ==================== UTILITY TYPES ====================

export type CircleFormMode = 'create' | 'edit' | 'view';

export type CircleMemberFormMode = 'invite' | 'edit';

export interface CircleFilters {
  categories?: CircleCategory[];
  visibility?: CircleVisibility[];
  memberRange?: [number, number];
  hasWallets?: boolean;
  joinedOnly?: boolean;
}

export interface CircleSortOption {
  label: string;
  value: string;
  field: string;
  direction: 'asc' | 'desc';
}

// ==================== HOOK TYPES ====================

export interface UseCirclesOptions {
  query?: CirclesQuery;
  pagination?: Pagination;
  enabled?: boolean;
}

export interface UseCircleOptions {
  circleId: string;
  enabled?: boolean;
}

export interface UseCircleMembersOptions {
  circleId: string;
  enabled?: boolean;
}

export interface UseCircleWalletsOptions {
  circleId: string;
  enabled?: boolean;
}

export interface UseCircleActivitiesOptions {
  circleId: string;
  query?: CircleActivitiesQuery;
  pagination?: Pagination;
  enabled?: boolean;
}

export interface UseCreateCircleOptions {
  onSuccess?: (circle: Circle) => void;
  onError?: (error: string) => void;
}

export interface UseUpdateCircleOptions extends UseCreateCircleOptions {
  circleId: string;
}


























