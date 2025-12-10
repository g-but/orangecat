import { logger } from '@/utils/logger'
import { supabase } from '@/lib/supabase/browser'
import type { User } from '@supabase/supabase-js'

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    logger.error('Error getting current user:', error)
    return null
  }
  return user
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    logger.error('Error signing out:', error)
    throw error
  }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) {throw error}
  return data
}

export async function signUp(email: string, password: string, metadata?: any) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  })
  if (error) {throw error}
  return data
}
