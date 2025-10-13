#!/usr/bin/env node

/**
 * DATA MIGRATION SCRIPT - OLD SCHEMA TO NORMALIZED SCHEMA
 *
 * This script migrates existing data from the old monolithic profiles table
 * to the new normalized schema with separate tables for different concerns.
 *
 * 🚨 CRITICAL: Run this BEFORE deploying the new schema
 * 📋 BACKUP: Ensure you have a database backup before running
 * ✅ VALIDATION: Script validates data integrity after migration
 *
 * Usage: node scripts/migrate-to-normalized-schema.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ohkueislstxomdjavyhs.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

class DataMigration {
  constructor() {
    this.migratedUsers = 0
    this.errors = []
    this.startTime = Date.now()
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toISOString()
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    }

    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`)

    if (type === 'error') {
      this.errors.push({ timestamp, message })
    }
  }

  async migrateUserProfile(userId) {
    try {
      // Get existing profile data
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (fetchError || !profile) {
        throw new Error(`Failed to fetch profile for user ${userId}: ${fetchError?.message}`)
      }

      this.log(`🔄 Migrating user ${userId} (${profile.username || 'no username'})`)

      // Start a transaction-like operation
      const migrationPromises = []

      // 1. Update core profiles table (only essential fields)
      const coreProfileUpdate = {
        id: profile.id,
        username: profile.username,
        full_name: profile.full_name,
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        banner_url: profile.banner_url,
        website: profile.website,
        status: profile.status,
        last_active_at: profile.last_active_at,
        profile_completed_at: profile.profile_completed_at,
        onboarding_completed: profile.onboarding_completed,
        updated_at: new Date().toISOString()
      }

      migrationPromises.push(
        supabase.from('profiles').upsert(coreProfileUpdate)
      )

      // 2. Migrate to user_preferences table
      const preferencesData = {
        user_id: profile.id,
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        timezone: profile.timezone,
        language: profile.language,
        currency: profile.currency,
        theme_preferences: profile.theme_preferences,
        custom_css: profile.custom_css,
        profile_color: profile.profile_color,
        cover_image_url: profile.cover_image_url,
        privacy_settings: profile.privacy_settings,
        preferences: profile.preferences,
        updated_at: new Date().toISOString()
      }

      migrationPromises.push(
        supabase.from('user_preferences').upsert(preferencesData)
      )

      // 3. Migrate to user_bitcoin_data table
      const bitcoinData = {
        user_id: profile.id,
        bitcoin_address: profile.bitcoin_address,
        lightning_address: profile.lightning_address,
        bitcoin_public_key: profile.bitcoin_public_key,
        lightning_node_id: profile.lightning_node_id,
        bitcoin_balance: profile.bitcoin_balance,
        lightning_balance: profile.lightning_balance,
        updated_at: new Date().toISOString()
      }

      migrationPromises.push(
        supabase.from('user_bitcoin_data').upsert(bitcoinData)
      )

      // 4. Migrate to user_analytics table
      const analyticsData = {
        user_id: profile.id,
        profile_views: profile.profile_views,
        follower_count: profile.follower_count,
        following_count: profile.following_count,
        campaign_count: profile.campaign_count,
        total_raised: profile.total_raised,
        total_donated: profile.total_donated,
        login_count: profile.login_count,
        last_login_at: profile.last_login_at,
        updated_at: new Date().toISOString()
      }

      migrationPromises.push(
        supabase.from('user_analytics').upsert(analyticsData)
      )

      // 5. Migrate to user_verification table
      const verificationData = {
        user_id: profile.id,
        verification_status: profile.verification_status,
        verification_level: profile.verification_level,
        kyc_status: profile.kyc_status,
        two_factor_enabled: profile.two_factor_enabled,
        verification_data: profile.verification_data,
        updated_at: new Date().toISOString()
      }

      migrationPromises.push(
        supabase.from('user_verification').upsert(verificationData)
      )

      // Execute all migrations
      const results = await Promise.all(migrationPromises)

      // Check for any errors
      const hasErrors = results.some(result => result.error)

      if (hasErrors) {
        const errorMessages = results
          .filter(result => result.error)
          .map(result => result.error.message)
          .join(', ')

        throw new Error(`Migration failed for user ${userId}: ${errorMessages}`)
      }

      this.migratedUsers++
      this.log(`✅ Successfully migrated user ${userId}`, 'success')

    } catch (error) {
      this.log(`❌ Failed to migrate user ${userId}: ${error.message}`, 'error')
      throw error
    }
  }

  async migrateAllProfiles() {
    try {
      this.log('🚀 STARTING DATA MIGRATION TO NORMALIZED SCHEMA', 'info')
      this.log('================================================', 'info')

      // Get all existing profiles
      const { data: profiles, error: fetchError } = await supabase
        .from('profiles')
        .select('id, username')
        .order('created_at', { ascending: true })

      if (fetchError) {
        throw new Error(`Failed to fetch profiles: ${fetchError.message}`)
      }

      if (!profiles || profiles.length === 0) {
        this.log('ℹ️ No profiles found to migrate', 'warning')
        return
      }

      this.log(`📊 Found ${profiles.length} profiles to migrate`, 'info')

      // Migrate profiles in batches to avoid overwhelming the database
      const batchSize = 10
      for (let i = 0; i < profiles.length; i += batchSize) {
        const batch = profiles.slice(i, i + batchSize)
        this.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(profiles.length / batchSize)}`, 'info')

        const batchPromises = batch.map(profile => this.migrateUserProfile(profile.id))
        await Promise.allSettled(batchPromises)

        // Small delay between batches to avoid overwhelming the database
        if (i + batchSize < profiles.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      const duration = ((Date.now() - this.startTime) / 1000).toFixed(2)
      this.log('🎉 MIGRATION COMPLETED', 'success')
      this.log(`📈 Results: ${this.migratedUsers}/${profiles.length} users migrated successfully`, 'success')
      this.log(`⏱️ Duration: ${duration} seconds`, 'success')

      if (this.errors.length > 0) {
        this.log(`⚠️ ${this.errors.length} errors occurred during migration`, 'warning')
        this.log('🔍 Check the error log above for details', 'warning')
      }

    } catch (error) {
      this.log(`💥 CRITICAL MIGRATION ERROR: ${error.message}`, 'error')
      throw error
    }
  }

  async validateMigration() {
    try {
      this.log('🔍 VALIDATING MIGRATION INTEGRITY', 'info')
      this.log('=================================', 'info')

      // Count records in each table
      const tables = ['profiles', 'user_preferences', 'user_bitcoin_data', 'user_analytics', 'user_verification']
      const counts = {}

      for (const table of tables) {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })

        if (error) {
          this.log(`⚠️ Could not count records in ${table}: ${error.message}`, 'warning')
          counts[table] = 'unknown'
        } else {
          counts[table] = count
        }
      }

      this.log('📊 TABLE RECORD COUNTS:', 'info')
      Object.entries(counts).forEach(([table, count]) => {
        this.log(`   ${table}: ${count}`, 'info')
      })

      // Check for orphaned records
      this.log('🔍 CHECKING FOR ORPHANED RECORDS', 'info')

      const orphanChecks = await Promise.all([
        supabase.from('user_preferences').select('user_id').is('user_id', null),
        supabase.from('user_bitcoin_data').select('user_id').is('user_id', null),
        supabase.from('user_analytics').select('user_id').is('user_id', null),
        supabase.from('user_verification').select('user_id').is('user_id', null)
      ])

      let totalOrphans = 0
      orphanChecks.forEach((result, index) => {
        if (result.error) {
          this.log(`⚠️ Could not check orphans in table ${index}: ${result.error.message}`, 'warning')
        } else {
          const orphanCount = result.data?.length || 0
          totalOrphans += orphanCount
          if (orphanCount > 0) {
            this.log(`⚠️ Found ${orphanCount} orphaned records in related table`, 'warning')
          }
        }
      })

      if (totalOrphans === 0) {
        this.log('✅ No orphaned records found', 'success')
      } else {
        this.log(`⚠️ ${totalOrphans} orphaned records require cleanup`, 'warning')
      }

      this.log('🎯 MIGRATION VALIDATION COMPLETE', 'success')

    } catch (error) {
      this.log(`❌ VALIDATION ERROR: ${error.message}`, 'error')
      throw error
    }
  }

  async rollbackMigration() {
    try {
      this.log('🔄 ROLLING BACK MIGRATION (DESTRUCTIVE OPERATION)', 'warning')
      this.log('=================================================', 'warning')

      const confirmation = process.argv.includes('--force')
      if (!confirmation) {
        this.log('❌ Rollback requires --force flag to prevent accidental data loss', 'error')
        return
      }

      // Delete records from new tables (keep original profiles table intact)
      const tablesToClear = ['user_preferences', 'user_bitcoin_data', 'user_analytics', 'user_verification', 'user_social_links']

      for (const table of tablesToClear) {
        this.log(`🗑️ Clearing table: ${table}`, 'warning')

        const { error } = await supabase.from(table).delete().neq('user_id', '00000000-0000-0000-0000-000000000000')

        if (error) {
          this.log(`⚠️ Failed to clear ${table}: ${error.message}`, 'warning')
        }
      }

      this.log('✅ ROLLBACK COMPLETE', 'success')

    } catch (error) {
      this.log(`❌ ROLLBACK ERROR: ${error.message}`, 'error')
      throw error
    }
  }
}

// Main execution
async function main() {
  const migration = new DataMigration()

  try {
    const command = process.argv[2]

    switch (command) {
      case 'validate':
        await migration.validateMigration()
        break
      case 'rollback':
        await migration.rollbackMigration()
        break
      case 'migrate':
      default:
        await migration.migrateAllProfiles()
        await migration.validateMigration()
        break
    }

  } catch (error) {
    console.error('💥 MIGRATION FAILED:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = DataMigration
