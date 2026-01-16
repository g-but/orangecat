'use client'

// Mock credentials type for auth methods
interface MockCredentials {
  email?: string
  password?: string
}

// Mock auth state callback type
type AuthStateCallback = (event: string, session: unknown) => void

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
      signIn: async (_credentials: MockCredentials) => {
        await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate network delay
        return {
          data: { user: mockUser, session: mockSession },
          error: null
        }
      },
      signUp: async (_credentials: MockCredentials) => {
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
      onAuthStateChange: (callback: AuthStateCallback) => {
        callback('INITIAL_SESSION', null)
        return {
          data: { subscription: { unsubscribe: () => {} } }
        }
      },
      resetPasswordForEmail: async (_email: string) => {
        return { data: {}, error: null }
      }
    },
    from: (_table: string) => ({
      select: (_columns?: string) => ({
        eq: (_column: string, _value: unknown) => ({
          single: async () => ({ data: null, error: null }),
          limit: (_count: number) => ({ data: [], error: null })
        }),
        limit: (_count: number) => ({ data: [], error: null })
      }),
      insert: (_data: Record<string, unknown>) => ({
        select: () => ({
          single: async () => ({ data: null, error: null })
        })
      }),
      update: (_data: Record<string, unknown>) => ({
        eq: (_column: string, _value: unknown) => ({
          select: () => ({
            single: async () => ({ data: null, error: null })
          })
        })
      }),
      delete: () => ({
        eq: (_column: string, _value: unknown) => ({ data: null, error: null })
      })
    }),
    storage: {
      from: (_bucket: string) => ({
        upload: async (path: string, _file: File | Blob) => {
          return { data: { path }, error: null }
        },
        getPublicUrl: (path: string) => {
          return { data: { publicUrl: `mock://storage/${path}` } }
        }
      })
    }
  }
}