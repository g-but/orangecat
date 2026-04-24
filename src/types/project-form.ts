/**
 * Project Form Types
 *
 * TypeScript definitions for the project creation form and its drafts.
 */

// ==================== PROJECT FORM DATA ====================

export interface ProjectFormData {
  // Basic Information
  title: string;
  description: string;
  category: string;

  // Financial Details
  goal: number;
  currency: 'BTC' | 'USD';

  // Bitcoin Details
  bitcoin_address?: string;

  // Media
  image_url?: string;
  banner_url?: string;

  // Project Settings
  duration_days?: number;
  is_public: boolean;

  // Optional Fields
  tags?: string[];
  location?: string;
  website_url?: string;
  social_links?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };

  // Rich Content
  story?: string;

  // Metadata
  created_at?: string;
  updated_at?: string;
}

/**
 * Project draft data (subset of full project)
 */
export interface ProjectDraftData {
  title?: string;
  description?: string;
  category?: string;
  categories?: string[];
  goal?: number;
  goal_amount?: number | string;
  currency?: 'BTC' | 'USD';
  bitcoin_address?: string;
  lightning_address?: string;
  image_url?: string;
  banner_url?: string;
  duration_days?: number;
  is_public?: boolean;
  tags?: string[];
  location?: string;
  website_url?: string;
  social_links?: ProjectFormData['social_links'];
  story?: string;
  current_step?: number;
  last_saved?: string;
}

export function safeParseProjectGoal(value: unknown): number | null {
  if (typeof value === 'number' && isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return null;
}
