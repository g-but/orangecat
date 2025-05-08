import { createClient } from './client'
import type { Profile } from '@/types/profile'

export async function getProfiles() {
  const supabase = createClient()
  return supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
}

export async function getProfile(id: string) {
  const supabase = createClient()
  return supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()
}

export async function updateProfile(id: string, updates: Partial<Profile>) {
  const supabase = createClient()
  return supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
} 