import { signIn, signUp, signOut } from '@/services/supabase/auth'
import * as loggerUtils from '@/utils/logger'

// Mock Supabase client and its auth methods
const mockSignInWithPassword = jest.fn()
const mockSignUp = jest.fn()
const mockSignOut = jest.fn()
const mockGetSession = jest.fn()

jest.mock('@/services/supabase/client', () => {
  return {
    __esModule: true,
    default: {
      auth: {
        signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
        signUp: (...args: unknown[]) => mockSignUp(...args),
        signOut: (...args: unknown[]) => mockSignOut(...args),
        getSession: (...args: unknown[]) => mockGetSession(...args),
      },
    },
  }
})

describe('Supabase auth service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('signIn returns data on success & logs without leaking password', async () => {
    const fakeUser = { id: '123', email: 'test@example.com' }
    const fakeSession = { user: fakeUser }
    mockSignInWithPassword.mockResolvedValue({ data: { user: fakeUser, session: fakeSession }, error: null })

    // Spy on logAuth
    const logSpy = jest.spyOn(loggerUtils, 'logAuth')

    const { data, error } = await signIn({ email: 'test@example.com', password: 'super-secret' })

    expect(error).toBeNull()
    expect(data).toEqual({ user: fakeUser, session: fakeSession })
    expect(mockSignInWithPassword).toHaveBeenCalledWith({ email: 'test@example.com', password: 'super-secret' })

    // Ensure no call to logAuth contains the raw password
    const leaked = (logSpy.mock.calls as unknown[][]).some(([, meta]) => JSON.stringify(meta).includes('super-secret'))
    expect(leaked).toBe(false)
  })

  it('signIn returns error when supabase returns error', async () => {
    const supabaseError = { message: 'Invalid credentials' }
    mockSignInWithPassword.mockResolvedValue({ data: { user: null, session: null }, error: supabaseError })

    const { data, error } = await signIn({ email: 'foo@bar.com', password: 'wrong' })

    expect(error).toEqual(supabaseError)
    expect(data?.user).toBeNull()
  })

  it('signUp returns user/session on success', async () => {
    const fakeUser = { id: '42', email: 'new@user.com' }
    const fakeSession = { user: fakeUser }
    mockSignUp.mockResolvedValue({ data: { user: fakeUser, session: fakeSession }, error: null })

    const { data, error } = await signUp({ email: fakeUser.email, password: 'Pa55w0rd' })

    expect(error).toBeNull()
    expect(data?.user).toEqual(fakeUser)
    expect(mockSignUp).toHaveBeenCalled()
  })

  it('signOut propagates supabase error', async () => {
    const supabaseError = { message: 'network error' }
    mockSignOut.mockResolvedValue({ error: supabaseError })

    const { error } = await signOut()

    expect(error).toEqual(supabaseError)
  })
}) 