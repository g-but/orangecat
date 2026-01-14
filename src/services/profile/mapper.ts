/**
 * PROFILE MAPPER MODULE
 *
 * Created: 2025-01-09
 * Last Modified: 2025-01-09
 * Last Modified Summary: Extracted from profileService.ts for modular architecture - handles schema mapping
 */

import type { ScalableProfile } from './types';

// =====================================================================
// 🔄 SCHEMA MAPPING UTILITIES
// =====================================================================

export class ProfileMapper {
  /**
   * Map database row to scalable profile interface
   */
  static mapDatabaseToProfile(dbRow: any): ScalableProfile | null {
    if (!dbRow) {
      return null;
    }

    return {
      // Core database fields
      id: dbRow.id,
      username: dbRow.username,
      name: dbRow.name,
      avatar_url: dbRow.avatar_url,
      banner_url: dbRow.banner_url,
      bio: dbRow.bio,
      website: dbRow.website,
      bitcoin_address: dbRow.bitcoin_address,
      lightning_address: dbRow.lightning_address,
      created_at: dbRow.created_at,
      updated_at: dbRow.updated_at,

      // Extended fields with defaults
      email: null,
      phone: null,
      location: null,
      timezone: 'UTC',
      language: 'en',
      currency: 'USD',

      // Bitcoin-native features
      bitcoin_public_key: null,
      lightning_node_id: null,
      payment_preferences: {},
      bitcoin_balance: 0,
      lightning_balance: 0,

      // Analytics & Engagement
      following_count: 0,
      project_count: 0,
      total_raised: 0,
      total_donated: 0,

      // Verification & Security
      verification_status: 'unverified',
      verification_level: 0,

      // Customization & Branding

      // Status & Temporal
      status: 'active',
      last_active_at: null,
      profile_completed_at: null,
      onboarding_completed: false,
      terms_accepted_at: null,
      privacy_policy_accepted_at: null,

      // Extensibility (JSON fields)
      social_links: {},
      preferences: {},
      metadata: {},
      verification_data: {},
      privacy_settings: {},
    };
  }

  /**
   * Map profile object to database format
   */
  static mapProfileToDatabase(profile: Partial<ScalableProfile>): any {
    // Core fields that go directly to database columns
    const coreFields: any = {
      username: profile.username || null,
      name: profile.name || null,
      avatar_url: profile.avatar_url || null,
      banner_url: profile.banner_url || null,
      bio: profile.bio || null,
      website: profile.website || null,
      bitcoin_address: profile.bitcoin_address || null,
      lightning_address: profile.lightning_address || null,
      updated_at: new Date().toISOString(),
    };

    // Only include fields that are not null/undefined
    const cleanFields: any = {};
    Object.keys(coreFields).forEach(key => {
      if (coreFields[key] !== null && coreFields[key] !== undefined) {
        cleanFields[key] = coreFields[key];
      }
    });

    return cleanFields;
  }
}
