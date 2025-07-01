/**
 * DATABASE TYPES - SCALABLE SCHEMA
 * 
 * Comprehensive type definitions for the scalable profile system
 * with Bitcoin-native features, analytics, and extensibility.
 * 
 * Created: 2025-01-08
 * Last Modified: 2025-01-08
 * Last Modified Summary: Updated for scalable schema with comprehensive features
 */

// =====================================================================
// 🎯 CORE PROFILE INTERFACE
// =====================================================================

export interface Profile {
  // Core identity fields
  id: string
  username: string | null
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  banner_url: string | null
  website: string | null
  created_at: string
  updated_at: string
  
  // Bitcoin fields (for backward compatibility)
  bitcoin_address: string | null
  lightning_address: string | null
}

// =====================================================================
// 🚀 SCALABLE PROFILE INTERFACE
// =====================================================================

export interface ScalableProfile extends Profile {
  // Contact & Location
  email: string | null
  phone: string | null
  location: string | null
  timezone: string | null
  language: string | null
  currency: string | null
  
  // Bitcoin-native features
  bitcoin_public_key: string | null
  lightning_node_id: string | null
  payment_preferences: Record<string, any> | null
  bitcoin_balance: number | null
  lightning_balance: number | null
  
  // Analytics & Engagement
  profile_views: number | null
  follower_count: number | null
  following_count: number | null
  campaign_count: number | null
  total_raised: number | null
  total_donated: number | null
  
  // Verification & Security
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected' | null
  verification_level: number | null
  kyc_status: 'none' | 'pending' | 'approved' | 'rejected' | null
  two_factor_enabled: boolean | null
  last_login_at: string | null
  login_count: number | null
  
  // Customization & Branding
  theme_preferences: Record<string, any> | null
  custom_css: string | null
  profile_color: string | null
  cover_image_url: string | null
  profile_badges: any[] | null
  
  // Status & Temporal
  status: 'active' | 'inactive' | 'suspended' | 'deleted' | null
  last_active_at: string | null
  profile_completed_at: string | null
  onboarding_completed: boolean | null
  terms_accepted_at: string | null
  privacy_policy_accepted_at: string | null
  
  // Extensibility (JSON fields)
  social_links: Record<string, any> | null
  preferences: Record<string, any> | null
  metadata: Record<string, any> | null
  verification_data: Record<string, any> | null
  privacy_settings: Record<string, any> | null
}

// =====================================================================
// 📝 FORM DATA INTERFACES
// =====================================================================

export interface ProfileFormData {
  // Core fields
  username?: string
  display_name?: string
  bio?: string
  avatar_url?: string
  banner_url?: string
  website?: string
  
  // Bitcoin fields
  bitcoin_address?: string
  lightning_address?: string
}

export interface ScalableProfileFormData extends ProfileFormData {
  // Contact & Location
  email?: string
  phone?: string
  location?: string
  timezone?: string
  language?: string
  currency?: string
  
  // Bitcoin-native features
  bitcoin_public_key?: string
  lightning_node_id?: string
  payment_preferences?: Record<string, any>
  
  // Customization
  profile_color?: string
  cover_image_url?: string
  theme_preferences?: Record<string, any>
  
  // Extensibility
  social_links?: Record<string, any>
  preferences?: Record<string, any>
  privacy_settings?: Record<string, any>
}

// =====================================================================
// 🔍 SEARCH & FILTER INTERFACES
// =====================================================================

export interface ProfileSearchOptions {
  limit?: number
  offset?: number
  status?: 'active' | 'inactive' | 'suspended' | 'deleted'
  verification_status?: 'unverified' | 'pending' | 'verified' | 'rejected'
  verification_level?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
  location?: string
  language?: string
  currency?: string
}

export interface ProfileSearchResult {
  id: string
  username: string | null
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  verification_status: string | null
  follower_count: number | null
  rank?: number
}

// =====================================================================
// 📊 ANALYTICS INTERFACES
// =====================================================================

export interface ProfileAnalytics {
  profile_views: number
  follower_count: number
  following_count: number
  campaign_count: number
  total_raised: number
  total_donated: number
}

export interface ProfileAnalyticsUpdate {
  profile_views?: number
  follower_count?: number
  following_count?: number
  campaign_count?: number
  total_raised?: number
  total_donated?: number
}

// =====================================================================
// 🔒 VERIFICATION INTERFACES
// =====================================================================

export interface VerificationData {
  type: 'identity' | 'bitcoin' | 'lightning' | 'social' | 'kyc'
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
  reviewed_at?: string
  reviewer_id?: string
  documents?: string[]
  notes?: string
  metadata?: Record<string, any>
}

export interface ProfileVerification {
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected'
  verification_level: number
  kyc_status: 'none' | 'pending' | 'approved' | 'rejected'
  verification_data: Record<string, VerificationData>
}

// =====================================================================
// 💰 BITCOIN INTERFACES
// =====================================================================

export interface BitcoinProfile {
  bitcoin_address: string | null
  lightning_address: string | null
  bitcoin_public_key: string | null
  lightning_node_id: string | null
  bitcoin_balance: number
  lightning_balance: number
  payment_preferences: {
    preferred_method: 'bitcoin' | 'lightning' | 'both'
    auto_accept_payments: boolean
    payment_notifications: boolean
    minimum_amount?: number
    maximum_amount?: number
    fee_preference: 'low' | 'medium' | 'high'
  }
}

// =====================================================================
// 🎨 CUSTOMIZATION INTERFACES
// =====================================================================

export interface ProfileCustomization {
  theme_preferences: {
    theme: 'light' | 'dark' | 'auto'
    accent_color: string
    font_family: string
    font_size: 'small' | 'medium' | 'large'
    compact_mode: boolean
  }
  profile_color: string
  cover_image_url: string | null
  custom_css: string | null
  profile_badges: Array<{
    id: string
    type: 'verification' | 'achievement' | 'custom'
    name: string
    icon: string
    color: string
    earned_at: string
  }>
}

// =====================================================================
// 🔗 SOCIAL LINKS INTERFACE
// =====================================================================

export interface SocialLinks {
  twitter?: string
  github?: string
  linkedin?: string
  instagram?: string
  youtube?: string
  tiktok?: string
  discord?: string
  telegram?: string
  nostr?: string
  mastodon?: string
  custom?: Array<{
    name: string
    url: string
    icon?: string
  }>
}

// =====================================================================
// ⚙️ PREFERENCES INTERFACE
// =====================================================================

export interface ProfilePreferences {
  notifications: {
    email_notifications: boolean
    push_notifications: boolean
    campaign_updates: boolean
    follower_notifications: boolean
    payment_notifications: boolean
    security_alerts: boolean
  }
  privacy: {
    profile_visibility: 'public' | 'followers' | 'private'
    show_email: boolean
    show_phone: boolean
    show_location: boolean
    show_bitcoin_address: boolean
    show_analytics: boolean
  }
  display: {
    show_verification_badge: boolean
    show_follower_count: boolean
    show_campaign_count: boolean
    show_total_raised: boolean
  }
}

// =====================================================================
// 📈 PROFILE STATISTICS INTERFACE
// =====================================================================

export interface ProfileStatistics {
  total_profiles: number
  active_profiles: number
  verified_profiles: number
  new_profiles_30d: number
  active_profiles_7d: number
  avg_followers: number
  total_platform_raised: number
  total_platform_donated: number
}

// =====================================================================
// 🔄 API RESPONSE INTERFACES
// =====================================================================

export interface ProfileResponse {
  success: boolean
  profile?: ScalableProfile
  error?: string
  warning?: string
}

export interface ProfileListResponse {
  success: boolean
  profiles: ScalableProfile[]
  total_count: number
  has_more: boolean
  error?: string
}

export interface ProfileSearchResponse {
  success: boolean
  results: ProfileSearchResult[]
  total_count: number
  has_more: boolean
  error?: string
}

// =====================================================================
// 🛠️ UTILITY TYPES
// =====================================================================

export type ProfileStatus = 'active' | 'inactive' | 'suspended' | 'deleted'
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected'
export type KYCStatus = 'none' | 'pending' | 'approved' | 'rejected'

// Partial update types
export type ProfileUpdate = Partial<ScalableProfile>
export type ProfileFormUpdate = Partial<ScalableProfileFormData>

// Database table types (for Supabase)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ScalableProfile
        Insert: Partial<ScalableProfile>
        Update: Partial<ScalableProfile>
      }
    }
  }
}

// =====================================================================
// 📋 EXPORT ALL TYPES
// =====================================================================

// Note: All interfaces are already exported inline above
// Removed duplicate export type declarations to fix TypeScript errors
