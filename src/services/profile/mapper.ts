/**
 * PROFILE MAPPER MODULE
 * 
 * Created: 2025-01-09
 * Last Modified: 2025-01-09
 * Last Modified Summary: Extracted from profileService.ts for modular architecture - handles schema mapping
 */

import type { ScalableProfile, ScalableProfileFormData } from './types'

// =====================================================================
// 🔄 SCHEMA MAPPING UTILITIES
// =====================================================================

export class ProfileMapper {
  /**
   * Map database row to scalable profile interface
   */
  static mapDatabaseToProfile(dbRow: any): ScalableProfile {
    if (!dbRow) return null;
    
    // Parse JSON fields safely
    const parseJSON = (field: any, defaultValue: any = null) => {
      if (typeof field === 'string') {
        try {
          return JSON.parse(field);
        } catch {
          return defaultValue;
        }
      }
      return field || defaultValue;
    };
    
    // Extract extended data from website field (JSON storage hack)
    let extendedData: any = {};
    if (dbRow.website && dbRow.website.startsWith('{')) {
      try {
        extendedData = JSON.parse(dbRow.website);
      } catch {
        // If parsing fails, treat as regular website
        extendedData = { website: dbRow.website };
      }
    } else if (dbRow.website) {
      extendedData = { website: dbRow.website };
    }
    
    return {
      // Core database fields
      id: dbRow.id,
      username: dbRow.username,
      full_name: dbRow.full_name,
      avatar_url: dbRow.avatar_url,
      website: extendedData.website || dbRow.website,
      created_at: dbRow.created_at,
      updated_at: dbRow.updated_at,
      
      // Mapped fields
      display_name: dbRow.full_name || extendedData.display_name || null,
      bio: extendedData.bio || null,
      banner_url: extendedData.banner_url || null,
      bitcoin_address: extendedData.bitcoin_address || null,
      lightning_address: extendedData.lightning_address || null,
      
      // Contact & Location
      email: extendedData.email || null,
      phone: extendedData.phone || null,
      location: extendedData.location || null,
      timezone: extendedData.timezone || 'UTC',
      language: extendedData.language || 'en',
      currency: extendedData.currency || 'USD',
      
      // Bitcoin-native features
      bitcoin_public_key: extendedData.bitcoin_public_key || null,
      lightning_node_id: extendedData.lightning_node_id || null,
      payment_preferences: parseJSON(extendedData.payment_preferences, {}),
      bitcoin_balance: extendedData.bitcoin_balance || 0,
      lightning_balance: extendedData.lightning_balance || 0,
      
      // Analytics & Engagement
      profile_views: extendedData.profile_views || 0,
      follower_count: extendedData.follower_count || 0,
      following_count: extendedData.following_count || 0,
      campaign_count: extendedData.campaign_count || 0,
      total_raised: extendedData.total_raised || 0,
      total_donated: extendedData.total_donated || 0,
      
      // Verification & Security
      verification_status: extendedData.verification_status || 'unverified',
      verification_level: extendedData.verification_level || 0,
      kyc_status: extendedData.kyc_status || 'none',
      two_factor_enabled: extendedData.two_factor_enabled || false,
      last_login_at: extendedData.last_login_at || null,
      login_count: extendedData.login_count || 0,
      
      // Customization & Branding
      theme_preferences: parseJSON(extendedData.theme_preferences, {}),
      custom_css: extendedData.custom_css || null,
      profile_color: extendedData.profile_color || null,
      cover_image_url: extendedData.cover_image_url || null,
      profile_badges: parseJSON(extendedData.profile_badges, []),
      
      // Status & Temporal
      status: extendedData.status || 'active',
      last_active_at: extendedData.last_active_at || null,
      profile_completed_at: extendedData.profile_completed_at || null,
      onboarding_completed: extendedData.onboarding_completed || false,
      terms_accepted_at: extendedData.terms_accepted_at || null,
      privacy_policy_accepted_at: extendedData.privacy_policy_accepted_at || null,
      
      // Extensibility (JSON fields)
      social_links: parseJSON(extendedData.social_links, {}),
      preferences: parseJSON(extendedData.preferences, {}),
      metadata: parseJSON(extendedData.metadata, {}),
      verification_data: parseJSON(extendedData.verification_data, {}),
      privacy_settings: parseJSON(extendedData.privacy_settings, {})
    };
  }

  /**
   * Map profile object to database format
   */
  static mapProfileToDatabase(profile: Partial<ScalableProfile>): any {
    // Core fields that go directly to database columns
    const coreFields: any = {
      username: profile.username || null,
      full_name: profile.full_name || profile.display_name || null,
      avatar_url: profile.avatar_url || null,
      updated_at: new Date().toISOString()
    };

    // Extended fields that get stored as JSON in website field
    const extendedFields: any = {
      website: profile.website || null,
      bio: profile.bio || null,
      banner_url: profile.banner_url || null,
      bitcoin_address: profile.bitcoin_address || null,
      lightning_address: profile.lightning_address || null,
      email: profile.email || null,
      phone: profile.phone || null,
      location: profile.location || null,
      timezone: profile.timezone || null,
      language: profile.language || null,
      currency: profile.currency || null,
      bitcoin_public_key: profile.bitcoin_public_key || null,
      lightning_node_id: profile.lightning_node_id || null,
      payment_preferences: profile.payment_preferences || null,
      bitcoin_balance: profile.bitcoin_balance || null,
      lightning_balance: profile.lightning_balance || null,
      profile_views: profile.profile_views || null,
      follower_count: profile.follower_count || null,
      following_count: profile.following_count || null,
      campaign_count: profile.campaign_count || null,
      total_raised: profile.total_raised || null,
      total_donated: profile.total_donated || null,
      verification_status: profile.verification_status || null,
      verification_level: profile.verification_level || null,
      kyc_status: profile.kyc_status || null,
      two_factor_enabled: profile.two_factor_enabled || null,
      last_login_at: profile.last_login_at || null,
      login_count: profile.login_count || null,
      theme_preferences: profile.theme_preferences || null,
      custom_css: profile.custom_css || null,
      profile_color: profile.profile_color || null,
      cover_image_url: profile.cover_image_url || null,
      profile_badges: profile.profile_badges || null,
      status: profile.status || null,
      last_active_at: profile.last_active_at || null,
      profile_completed_at: profile.profile_completed_at || null,
      onboarding_completed: profile.onboarding_completed || null,
      terms_accepted_at: profile.terms_accepted_at || null,
      privacy_policy_accepted_at: profile.privacy_policy_accepted_at || null,
      social_links: profile.social_links || null,
      preferences: profile.preferences || null,
      metadata: profile.metadata || null,
      verification_data: profile.verification_data || null,
      privacy_settings: profile.privacy_settings || null
    };
    
    // Store extended fields as JSON in website field if we have extended data
    const hasExtendedData = Object.keys(extendedFields).some(key => 
      key !== 'website' && extendedFields[key] !== null && extendedFields[key] !== undefined
    );
    
    if (hasExtendedData) {
      coreFields.website = JSON.stringify(extendedFields);
    } else if (profile.website) {
      coreFields.website = profile.website;
    }
    
    return coreFields;
  }
} 