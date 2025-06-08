/**
 * Campaign Types - Proper TypeScript Definitions
 * 
 * Replaces 'any' types in Campaign services with proper type definitions
 * for form data, API responses, and campaign operations
 * 
 * Created: 2025-06-08
 * Last Modified: 2025-06-08
 * Last Modified Summary: Initial creation of Campaign types for TypeScript cleanup
 */

import type { FormValue, SupabaseResponse } from '@/types/common'

// ==================== CAMPAIGN FORM DATA ====================

/**
 * Campaign form data structure
 * Replaces: formData: any in campaign services
 */
export interface CampaignFormData {
  // Basic Information
  title: string
  description: string
  category: string
  
  // Financial Details
  goal: number
  currency: 'BTC' | 'USD'
  
  // Bitcoin Details
  bitcoin_address?: string
  
  // Media
  image_url?: string
  banner_url?: string
  
  // Campaign Settings
  duration_days?: number
  is_public: boolean
  
  // Optional Fields
  tags?: string[]
  location?: string
  website_url?: string
  social_links?: {
    twitter?: string
    facebook?: string
    instagram?: string
    linkedin?: string
  }
  
  // Rich Content
  story?: string
  
  // Metadata
  created_at?: string
  updated_at?: string
}

/**
 * Campaign draft data (subset of full campaign)
 * Replaces: draftData: any
 */
export interface CampaignDraftData {
  title?: string
  description?: string
  category?: string
  categories?: string[] // Array format used in actual code
  goal?: number
  goal_amount?: number | string // Used in actual code
  currency?: 'BTC' | 'USD'
  bitcoin_address?: string
  lightning_address?: string // Used in actual code
  image_url?: string
  banner_url?: string
  duration_days?: number
  is_public?: boolean
  tags?: string[]
  location?: string
  website_url?: string
  social_links?: CampaignFormData['social_links']
  story?: string
  current_step?: number
  last_saved?: string
}

/**
 * Safe number parsing for campaign goals
 * Replaces: safeParseFloat(value: any)
 */
export function safeParseCampaignGoal(value: unknown): number | null {
  if (typeof value === 'number' && isFinite(value) && value > 0) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    if (isFinite(parsed) && parsed > 0) {
      return parsed
    }
  }
  return null
}