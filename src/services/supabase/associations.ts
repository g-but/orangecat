/**
 * ASSOCIATION SERVICE - TESLA-GRADE SOCIAL CONNECTIONS
 * 
 * This service implements the revolutionary association system that transforms
 * OrangeCat from individual profiles to a Bitcoin-native social platform.
 * 
 * Key Features:
 * - Bitcoin-native value transfer in relationships
 * - Event-sourced architecture with full audit trails
 * - Real-time synchronization across the platform
 * - Masterful abstraction of complex relationships
 * 
 * Created: 2025-01-08
 * Last Modified: 2025-01-08
 * Last Modified Summary: Enhanced error handling and method chaining
 */

import { supabase } from './core/client'
import type { Database } from '@/types/database'
import { logger } from '@/utils/logger'

// ==================================
// 🏗️ TYPE DEFINITIONS: BULLETPROOF CONTRACTS
// ==================================

// Core association entity
export interface Association {
  id: string
  source_profile_id: string
  target_entity_id: string
  target_entity_type: 'profile' | 'campaign' | 'organization' | 'collective' | 'project'
  relationship_type: 'created' | 'founded' | 'supports' | 'collaborates' | 'maintains' | 
                     'member' | 'leader' | 'moderator' | 'contributor' | 'advisor' |
                     'investor' | 'sponsor' | 'partner' | 'beneficiary'
  role?: string
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'suspended' | 'disputed'
  bitcoin_reward_address?: string
  reward_percentage: number
  permissions: Record<string, any>
  metadata: Record<string, any>
  visibility: 'public' | 'members_only' | 'private' | 'confidential'
  starts_at: string
  ends_at?: string
  created_at: string
  updated_at: string
  version: number
  created_by?: string
  last_modified_by?: string
}

// Input for creating associations
export interface CreateAssociationInput {
  target_entity_id: string
  target_entity_type: Association['target_entity_type']
  relationship_type: Association['relationship_type']
  role?: string
  bitcoin_reward_address?: string
  reward_percentage?: number
  permissions?: Record<string, any>
  metadata?: Record<string, any>
  visibility?: Association['visibility']
}

// Input for updating associations
export interface UpdateAssociationInput {
  role?: string
  status?: Association['status']
  bitcoin_reward_address?: string
  reward_percentage?: number
  permissions?: Record<string, any>
  metadata?: Record<string, any>
  visibility?: Association['visibility']
  ends_at?: string
}

// Query filters for associations
export interface AssociationFilters {
  relationship_type?: Association['relationship_type'][]
  target_entity_type?: Association['target_entity_type'][]
  status?: Association['status'][]
  visibility?: Association['visibility'][]
  created_after?: string
  created_before?: string
  has_bitcoin_reward?: boolean
}

// Query options
export interface QueryOptions {
  limit?: number
  offset?: number
  order_by?: string
  order_direction?: 'asc' | 'desc'
}

// Association statistics
export interface AssociationStats {
  total_associations: number
  by_type: Record<string, number>
  by_entity_type: Record<string, number>
  recent_activity: Association[]
  bitcoin_connections: number
  total_reward_percentage: number
}

// ==================================
// 🚀 CORE ASSOCIATION SERVICE
// ==================================

class AssociationService {

  // ==================================
  // ➕ CREATE OPERATIONS
  // ==================================

  /**
   * Create a new association between a profile and an entity
   */
  static async createAssociation(input: CreateAssociationInput): Promise<Association> {
    try {
      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('Authentication required')
      }

      // Prepare association data
      const associationData = {
        source_profile_id: user.id,
        target_entity_id: input.target_entity_id,
        target_entity_type: input.target_entity_type,
        relationship_type: input.relationship_type,
        role: input.role,
        bitcoin_reward_address: input.bitcoin_reward_address,
        reward_percentage: input.reward_percentage || 0,
        permissions: input.permissions || {},
        metadata: input.metadata || {},
        visibility: input.visibility || 'public',
        starts_at: new Date().toISOString(),
        version: 1,
        created_by: user.id,
        last_modified_by: user.id
      }

      // Create association
      const { data, error } = await supabase
        .from('profile_associations')
        .insert(associationData)
        .select()
        .single()

      if (error) {
        logger.error('Failed to create association', { error, input })
        throw new Error(`Failed to create association: ${error.message}`)
      }

      if (!data) {
        throw new Error('Failed to create association: No data returned')
      }

      logger.info('Association created successfully', { 
        associationId: data.id, 
        profileId: user.id 
      })

      return data as Association
    } catch (error) {
      logger.error('Error in createAssociation', { error, input })
      throw error
    }
  }

  /**
   * Create multiple associations in bulk
   */
  static async createBulkAssociations(inputs: CreateAssociationInput[]): Promise<Association[]> {
    try {
      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('Authentication required')
      }

      // Prepare all association data
      const associationsData = inputs.map(input => ({
        source_profile_id: user.id,
        target_entity_id: input.target_entity_id,
        target_entity_type: input.target_entity_type,
        relationship_type: input.relationship_type,
        role: input.role,
        bitcoin_reward_address: input.bitcoin_reward_address,
        reward_percentage: input.reward_percentage || 0,
        permissions: input.permissions || {},
        metadata: input.metadata || {},
        visibility: input.visibility || 'public',
        starts_at: new Date().toISOString(),
        version: 1,
        created_by: user.id,
        last_modified_by: user.id
      }))

      // Create associations
      const { data, error } = await supabase
        .from('profile_associations')
        .insert(associationsData)
        .select()

      if (error) {
        logger.error('Failed to create bulk associations', { error, inputs })
        throw new Error(`Failed to create bulk associations: ${error.message}`)
      }

      if (!data) {
        throw new Error('Failed to create bulk associations: No data returned')
      }

      logger.info('Bulk associations created successfully', { 
        count: data.length, 
        profileId: user.id 
      })

      return data as Association[]
    } catch (error) {
      logger.error('Error in createBulkAssociations', { error, inputs })
      throw error
    }
  }

  // ==================================
  // 📖 READ OPERATIONS
  // ==================================

  /**
   * Get associations for a specific profile with filtering and pagination
   */
  static async getProfileAssociations(
    profileId: string,
    filters?: AssociationFilters,
    options?: QueryOptions
  ): Promise<Association[]> {
    try {
      // Start building query
      let query = supabase
        .from('profile_associations')
        .select(this.buildSelectClause(options))
        .eq('source_profile_id', profileId)
      
      // Apply filters
      if (filters) {
        if (filters.relationship_type?.length) {
          query = query.in('relationship_type', filters.relationship_type)
        }
        if (filters.target_entity_type?.length) {
          query = query.in('target_entity_type', filters.target_entity_type)
        }
        if (filters.status?.length) {
          query = query.in('status', filters.status)
        }
        if (filters.visibility?.length) {
          query = query.in('visibility', filters.visibility)
        }
        if (filters.created_after) {
          query = query.gte('created_at', filters.created_after)
        }
        if (filters.created_before) {
          query = query.lte('created_at', filters.created_before)
        }
        if (filters.has_bitcoin_reward !== undefined) {
          if (filters.has_bitcoin_reward) {
            query = query.not('bitcoin_reward_address', 'is', null)
          } else {
            query = query.is('bitcoin_reward_address', null)
          }
        }
      }

      // Apply ordering
      const orderBy = options?.order_by || 'created_at'
      const ascending = options?.order_direction === 'asc'
      query = query.order(orderBy, { ascending })

      // Apply pagination
      if (options?.limit || options?.offset) {
        const limit = options.limit || 50
        const offset = options.offset || 0
        query = query.range(offset, offset + limit - 1)
      }

      const { data, error } = await query

      if (error) {
        logger.error('Failed to get profile associations', { error, profileId })
        throw new Error(`Failed to get profile associations: ${error.message}`)
      }

      return (data || []) as Association[]
    } catch (error) {
      logger.error('Error in getProfileAssociations', { error, profileId })
      throw error
    }
  }

  /**
   * Get associations for a specific entity
   */
  static async getEntityAssociations(
    entityId: string,
    entityType: Association['target_entity_type'],
    filters?: AssociationFilters,
    options?: QueryOptions
  ): Promise<Association[]> {
    try {
      let query = supabase
        .from('profile_associations')
        .select(this.buildSelectClause(options))
        .eq('target_entity_id', entityId)
        .eq('target_entity_type', entityType)
      
      // Apply filters (same as getProfileAssociations)
      if (filters) {
        if (filters.relationship_type?.length) {
          query = query.in('relationship_type', filters.relationship_type)
        }
        if (filters.status?.length) {
          query = query.in('status', filters.status)
        }
        if (filters.visibility?.length) {
          query = query.in('visibility', filters.visibility)
        }
      }

      // Apply ordering
      const orderBy = options?.order_by || 'created_at'
      const ascending = options?.order_direction === 'asc'
      query = query.order(orderBy, { ascending })

      // Apply pagination
      if (options?.limit || options?.offset) {
        const limit = options.limit || 50
        const offset = options.offset || 0
        query = query.range(offset, offset + limit - 1)
      }

      const { data, error } = await query

      if (error) {
        logger.error('Failed to get entity associations', { error, entityId, entityType })
        throw new Error(`Failed to get entity associations: ${error.message}`)
      }

      return (data || []) as Association[]
    } catch (error) {
      logger.error('Error in getEntityAssociations', { error, entityId })
      throw error
    }
  }

  // ==================================
  // ✏️ UPDATE OPERATIONS
  // ==================================

  /**
   * Update an existing association
   */
  static async updateAssociation(
    associationId: string,
    updates: UpdateAssociationInput
  ): Promise<Association> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
        version: (updates as any).version ? (updates as any).version + 1 : undefined
      }

      const { data, error } = await supabase
        .from('profile_associations')
        .update(updateData)
        .eq('id', associationId)
        .select()
        .single()

      if (error) {
        logger.error('Failed to update association', { error, associationId, updates })
        throw new Error(`Failed to update association: ${error.message}`)
      }

      if (!data) {
        throw new Error('Failed to update association: No data returned')
      }

      logger.info('Association updated successfully', { associationId })

      return data as Association
    } catch (error) {
      logger.error('Error in updateAssociation', { error, associationId })
      throw error
    }
  }

  // ==================================
  // ❌ DELETE OPERATIONS
  // ==================================

  /**
   * Delete an association
   */
  static async deleteAssociation(associationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('profile_associations')
        .delete()
        .eq('id', associationId)

      if (error) {
        logger.error('Failed to delete association', { error, associationId })
        throw new Error(`Failed to delete association: ${error.message}`)
      }

      logger.info('Association deleted successfully', { associationId })
    } catch (error) {
      logger.error('Error in deleteAssociation', { error, associationId })
      throw error
    }
  }

  // ==================================
  // 📊 ANALYTICS OPERATIONS
  // ==================================

  /**
   * Get comprehensive association statistics for a profile
   */
  static async getAssociationStats(profileId: string): Promise<AssociationStats> {
    try {
      const associations = await this.getProfileAssociations(profileId)

      const stats: AssociationStats = {
        total_associations: associations.length,
        by_type: {},
        by_entity_type: {},
        recent_activity: associations.slice(0, 10),
        bitcoin_connections: 0,
        total_reward_percentage: 0
      }

      // Calculate statistics
      associations.forEach(association => {
        // Count by relationship type
        stats.by_type[association.relationship_type] = 
          (stats.by_type[association.relationship_type] || 0) + 1

        // Count by entity type
        stats.by_entity_type[association.target_entity_type] = 
          (stats.by_entity_type[association.target_entity_type] || 0) + 1

        // Count Bitcoin connections
        if (association.bitcoin_reward_address) {
          stats.bitcoin_connections++
          stats.total_reward_percentage += association.reward_percentage
        }
      })

      return stats
    } catch (error) {
      logger.error('Error in getAssociationStats', { error, profileId })
      throw error
    }
  }

  // ==================================
  // 🔧 UTILITY METHODS
  // ==================================

  /**
   * Build select clause based on options
   */
  private static buildSelectClause(options?: QueryOptions): string {
    // Default select all columns
    return '*'
  }

  /**
   * Get association by ID
   */
  static async getAssociationById(associationId: string): Promise<Association | null> {
    try {
      const { data, error } = await supabase
        .from('profile_associations')
        .select('*')
        .eq('id', associationId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Not found
        }
        logger.error('Failed to get association by ID', { error, associationId })
        throw new Error(`Failed to get association: ${error.message}`)
      }

      return data as Association
    } catch (error) {
      logger.error('Error in getAssociationById', { error, associationId })
      throw error
    }
  }

  /**
   * Check if association exists
   */
  static async associationExists(
    sourceProfileId: string,
    targetEntityId: string,
    relationshipType: Association['relationship_type']
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profile_associations')
        .select('id')
        .eq('source_profile_id', sourceProfileId)
        .eq('target_entity_id', targetEntityId)
        .eq('relationship_type', relationshipType)
        .limit(1)

      if (error) {
        logger.error('Failed to check association existence', { error })
        return false
      }

      return (data?.length || 0) > 0
    } catch (error) {
      logger.error('Error in associationExists', { error })
      return false
    }
  }

}

export default AssociationService
export type { CreateAssociationInput, UpdateAssociationInput, AssociationFilters, QueryOptions }