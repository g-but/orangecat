import getSupabaseClient from '@/services/supabase/client'
import type { Organization, OrganizationSearchParams, OrganizationFilters, QueryOptions } from './types'

export class OrganizationReader {
  static async getById(id: string): Promise<Organization | null> {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      return null
    }
  }

  static async search(params: OrganizationSearchParams): Promise<Organization[]> {
    try {
      const supabase = getSupabaseClient()
      let query = supabase
        .from('organizations')
        .select('*')

      if (params.query) {
        query = query.or(`name.ilike.%${params.query}%,description.ilike.%${params.query}%`)
      }

      if (params.verified !== undefined) {
        query = query.eq('verified', params.verified)
      }

      const limit = params.limit || 20
      const offset = params.offset || 0

      query = query.range(offset, offset + limit - 1)

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      return []
    }
  }

  static async getAll(filters?: OrganizationFilters, options?: QueryOptions): Promise<Organization[]> {
    try {
      const supabase = getSupabaseClient()
      let query = supabase
        .from('organizations')
        .select('*')

      if (filters?.verified !== undefined) {
        query = query.eq('verified', filters.verified)
      }

      if (filters?.has_website !== undefined) {
        if (filters.has_website) {
          query = query.not('website', 'is', null)
        } else {
          query = query.is('website', null)
        }
      }

      if (options?.orderBy) {
        query = query.order(options.orderBy, { ascending: options.orderDirection === 'asc' })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      if (options?.limit) {
        const offset = options.offset || 0
        query = query.range(offset, offset + options.limit - 1)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      return []
    }
  }
}




