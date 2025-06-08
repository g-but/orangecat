/**
 * SUPABASE TYPES - COMPREHENSIVE TYPE DEFINITIONS
 * 
 * This file provides type safety for all Supabase operations,
 * replacing dangerous 'any' types with proper interfaces.
 * 
 * Created: 2025-06-08
 * Last Modified: 2025-06-08
 * Last Modified Summary: Initial creation with auth, profile, and campaign types
 */

import { Session, User } from '@supabase/supabase-js'

// ==================== AUTH TYPES ====================

export interface AuthResponse {
  data: {
    user: User | null
    session: Session | null
  }
  error: Error | null
}

export interface SignInRequest {
  email: string
  password: string
}

export interface SignUpRequest {
  email: string
  password: string
  emailRedirectTo?: string
}

export interface AuthError extends Error {
  message: string
  status?: number
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordUpdateRequest {
  newPassword: string
}

// ==================== PROFILE TYPES ====================

export interface Profile {
  id: string
  username?: string | null
  display_name?: string | null
  bio?: string | null
  avatar_url?: string | null
  banner_url?: string | null
  bitcoin_address?: string | null
  lightning_address?: string | null
  created_at: string
  updated_at: string
}

export interface ProfileUpdateData {
  username?: string | null
  display_name?: string | null
  bio?: string | null
  avatar_url?: string | null
  banner_url?: string | null
  bitcoin_address?: string | null
  lightning_address?: string | null
  updated_at?: string
}

export interface ProfileResponse {
  data: Profile | null
  error: Error | null
}

export interface ProfileUpdateResponse {
  data: Profile | null
  error: Error | null
  status?: string | number
}

// ==================== CAMPAIGN/FUNDING PAGE TYPES ====================

export interface FundingPage {
  id: string
  user_id: string
  title: string
  description?: string | null
  goal_amount?: number | null
  current_amount: number
  bitcoin_address?: string | null
  lightning_address?: string | null
  website_url?: string | null
  category?: string | null
  tags?: string[] | null
  currency: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  is_active: boolean
  is_public: boolean
  total_funding: number
  contributor_count: number
  created_at: string
  updated_at: string
}

export interface FundingPageCreateData {
  title: string
  description?: string | null
  goal_amount?: number | string | null
  bitcoin_address?: string | null
  lightning_address?: string | null
  website_url?: string | null
  categories?: string[]
  currency?: string
}

export interface FundingPageUpdateData extends Partial<FundingPageCreateData> {
  status?: 'draft' | 'active' | 'paused' | 'completed'
  is_active?: boolean
  is_public?: boolean
  updated_at?: string
}

export interface FundingPageResponse {
  data: FundingPage | null
  error: Error | null
}

export interface FundingPageListResponse {
  data: FundingPage[]
  error: Error | null
}

export interface CreateUpdateOptions {
  isDraft?: boolean
  pageId?: string
  userId: string
}

// ==================== STORAGE TYPES ====================

export interface StorageItem {
  key: string
  value: any
}

export interface AuthStorage {
  getItem: (key: string) => any
  setItem: (key: string, value: any) => void
  removeItem: (key: string) => void
}

// ==================== UTILITY TYPES ====================

export interface DatabaseResponse<T = any> {
  data: T | null
  error: Error | null
}

export interface DatabaseListResponse<T = any> {
  data: T[]
  error: Error | null
}

export interface EnvironmentConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  siteUrl: string
  nodeEnv: string
}

export interface ConnectionTestResult {
  success: boolean
  responseTime: number
  error?: string
}

// ==================== ERROR TYPES ====================

export interface SupabaseError extends Error {
  message: string
  code?: string
  details?: string
  hint?: string
  status?: number
}

export interface ValidationError extends Error {
  field?: string
  value?: any
}

// ==================== TYPE GUARDS ====================

export function isAuthError(error: any): error is AuthError {
  return error && typeof error.message === 'string'
}

export function isSupabaseError(error: any): error is SupabaseError {
  return error && typeof error.message === 'string' && 'code' in error
}

export function isValidProfile(data: any): data is Profile {
  return data && 
         typeof data.id === 'string' &&
         typeof data.created_at === 'string' &&
         typeof data.updated_at === 'string'
}

export function isValidFundingPage(data: any): data is FundingPage {
  return data &&
         typeof data.id === 'string' &&
         typeof data.user_id === 'string' &&
         typeof data.title === 'string' &&
         typeof data.created_at === 'string'
}

// ==================== EXPORT ALL TYPES ====================

export type {
  Session,
  User
} from '@supabase/supabase-js' 