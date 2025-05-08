import { createBrowserClient } from '@supabase/ssr' // Use createBrowserClient for client-side
import { Database } from '@/types/database'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined')
}

// Create a single, shared Supabase client instance for browser-side operations.
// This instance is created once when the module is first imported.
const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)

// Export the single instance
export default supabase

// Auth helpers (now use the exported 'supabase' instance)
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email)
  return { data, error }
}

export const updatePassword = async (newPassword: string) => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  })
  return { data, error }
}

// Profile helpers (now use the exported 'supabase' instance)
export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

export const updateProfile = async (userId: string, updates: any) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
  return { data, error }
}

// Funding page helpers (now use the exported 'supabase' instance)
export const getFundingPage = async (username: string) => {
  const { data, error } = await supabase
    .from('funding_pages')
    .select('*')
    .eq('username', username)
    .single()
  return { data, error }
}

export const createFundingPage = async (pageData: any) => {
  const { data, error } = await supabase
    .from('funding_pages')
    .insert(pageData)
    .select()
    .single()
  return { data, error }
}

export const updateFundingPage = async (pageId: string, updates: any) => {
  const { data, error } = await supabase
    .from('funding_pages')
    .update(updates)
    .eq('id', pageId)
  return { data, error }
} 