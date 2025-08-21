'use client'

// Mock Supabase client for local development when external instance is unavailable
export const createMockSupabaseClient = () => {
  const mockUser = {
    id: 'mock-user-id',
    email: 'test@example.com',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    aud: 'authenticated',
    role: 'authenticated'
  }

  const mockSession = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user: mockUser
  }

  return {
    auth: {
      signIn: async (credentials: any) => {
        await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate network delay
        return {
          data: { user: mockUser, session: mockSession },
          error: null
        }
      },
      signUp: async (credentials: any) => {
        await new Promise(resolve => setTimeout(resolve, 1000))
        return {
          data: { user: mockUser, session: null },
          error: null
        }
      },
      signOut: async () => {
        return { error: null }
      },
      getSession: async () => {
        return { data: { session: null }, error: null }
      },
      getUser: async () => {
        return { data: { user: null }, error: null }
      },
      onAuthStateChange: (callback: any) => {
        callback('INITIAL_SESSION', null)
        return {
          data: { subscription: { unsubscribe: () => {} } }
        }
      },
      resetPasswordForEmail: async (email: string) => {
        return { data: {}, error: null }
      }
    },
    from: (table: string) => ({
      select: (columns?: string) => ({
        eq: (column: string, value: any) => ({
          single: async () => ({ data: null, error: null }),
          limit: (count: number) => ({ data: [], error: null })
        }),
        limit: (count: number) => ({ data: [], error: null })
      }),
      insert: (data: any) => ({
        select: () => ({
          single: async () => ({ data: null, error: null })
        })
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          select: () => ({
            single: async () => ({ data: null, error: null })
          })
        })
      }),
      delete: () => ({
        eq: (column: string, value: any) => ({ data: null, error: null })
      })
    }),
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string, file: any) => {
          return { data: { path }, error: null }
        },
        getPublicUrl: (path: string) => {
          return { data: { publicUrl: `mock://storage/${path}` } }
        }
      })
    }
  }
}