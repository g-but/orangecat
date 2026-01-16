import type { Profile } from '@/types/database';

export type UserRole = 'user' | 'admin' | 'moderator'

export interface AuthUser {
  id: string
  email: string
  username?: string
  role?: string
  profile?: Profile
}

export interface AuthState {
  user: AuthUser | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any | null
  isLoading: boolean
  error: string | null
}

export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<Profile>) => Promise<void>
  isAdmin: boolean
} 