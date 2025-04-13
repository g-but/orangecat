'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { AuthContextType, AuthState, AuthUser } from '@/types/auth'
import { User, Session } from '@supabase/supabase-js'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function mapSupabaseUserToAuthUser(user: User | null): AuthUser | null {
  if (!user) return null
  return {
    id: user.id,
    email: user.email || '',
    username: user.user_metadata?.username,
    metadata: user.user_metadata,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    error: null,
  })

  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Check active sessions and sets the user
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error

        setState(prev => ({
          ...prev,
          session,
          user: mapSupabaseUserToAuthUser(session?.user ?? null),
          isLoading: false,
        }))
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: 'Failed to get session',
          isLoading: false,
        }))
      }
    }

    getSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(prev => ({
        ...prev,
        session,
        user: mapSupabaseUserToAuthUser(session?.user ?? null),
      }))
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const signIn = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push('/dashboard')
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to sign in',
      }))
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const signUp = async (email: string, password: string, username: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      // 1. Create auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) throw authError

      // 2. Create user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: authData.user?.id,
          username,
          email,
        }])

      if (profileError) throw profileError

      // 3. Send verification email
      const { error: verificationError } = await supabase.auth.resend({
        type: 'signup',
        email,
      })

      if (verificationError) throw verificationError

      router.push('/auth/verify-email')
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to sign up',
      }))
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/')
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to sign out',
      }))
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const resetPassword = async (email: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) throw error
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to reset password',
      }))
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const updatePassword = async (newPassword: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })
      if (error) throw error
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update password',
      }))
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const updateProfile = async (data: Partial<AuthUser>) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const { error } = await supabase.auth.updateUser({
        data,
      })
      if (error) throw error
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update profile',
      }))
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const value = {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 