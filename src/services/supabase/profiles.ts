import supabaseBrowserClient from './client'
import type { Profile } from '@/types/database'

export async function getProfiles() {
  return supabaseBrowserClient
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
}

export async function getProfile(id: string) {
  return supabaseBrowserClient
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()
} 