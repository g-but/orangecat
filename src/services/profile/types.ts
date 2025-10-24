/**
 * PROFILE TYPES MODULE
 * 
 * Created: 2025-01-09
 * Last Modified: 2025-01-09
 * Last Modified Summary: Extracted from profileService.ts (808 lines) for modular architecture
 */

import type { Profile, ProfileFormData } from '@/types/database'

// =====================================================================
// 🎯 SCALABLE PROFILE INTERFACE (CURRENT SCHEMA COMPATIBLE)
// =====================================================================

export interface ScalableProfile extends Profile {
  // Core fields (existing in database)
  id: string
  username: string | null
  name: string | null
  avatar_url: string | null
  website: string | null
  created_at: string
  updated_at: string
  
  // Profile fields
  bio: string | null
  banner_url: string | null
  bitcoin_address: string | null
  lightning_address: string | null
  
  // Extended fields (stored in JSON or computed)
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
  following_count: number | null
  project_count: number | null
  total_raised: number | null
  total_donated: number | null
  
  // Verification & Security
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected' | null
  verification_level: number | null
  
  // Customization & Branding
  
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

export interface ScalableProfileFormData extends ProfileFormData {
  // All existing fields plus new ones
  email?: string
  phone?: string
  location?: string
  timezone?: string
  language?: string
  currency?: string
  bitcoin_public_key?: string
  lightning_node_id?: string
  payment_preferences?: Record<string, any>
  social_links?: Record<string, any>
  preferences?: Record<string, any>
  privacy_settings?: Record<string, any>
}

export interface ProfileAnalytics {
  following_count?: number
  project_count?: number
  total_raised?: number
  total_donated?: number
}

export interface ProfileServiceResponse<T = any> {
  success: boolean
  data?: T
  error?: string
} 