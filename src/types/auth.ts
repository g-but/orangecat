export interface AuthUser {
  id: string
  email: string
  username?: string
  metadata?: Record<string, any>
}

export interface AuthState {
  user: AuthUser | null
  session: any | null
  isLoading: boolean
  error: string | null
}

export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  updateProfile: (data: Partial<AuthUser>) => Promise<void>
} 