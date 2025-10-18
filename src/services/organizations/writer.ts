import getSupabaseClient from '@/services/supabase/client'
import type { Organization, CreateOrganizationInput, UpdateOrganizationInput } from './types'

export class OrganizationWriter {
  static async create(input: CreateOrganizationInput): Promise<Organization | null> {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('organizations')
        .insert({
          ...input,
          verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {throw error}
      return data
    } catch (error) {
      return null
    }
  }

  static async update(id: string, updates: UpdateOrganizationInput): Promise<Organization | null> {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('organizations')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {throw error}
      return data
    } catch (error) {
      return null
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id)

      if (error) {throw error}
      return true
    } catch (error) {
      return false
    }
  }

  static async verify(id: string): Promise<Organization | null> {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('organizations')
        .update({
          verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {throw error}
      return data
    } catch (error) {
      return null
    }
  }
}




