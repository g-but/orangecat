import React from 'react'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '../utils'

// Dynamically control the auth page mode via query param mock
let mode: 'login' | 'register' = 'register'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => ({
    get: (key: string) => (key === 'mode' ? mode : null),
  }),
}))

// Mock toast notifications to avoid side-effects in the test environment
jest.mock('sonner', () => ({ toast: { loading: jest.fn(), error: jest.fn(), success: jest.fn() } }))

// Mock useAuth and related hook behaviour
const signInMock = jest.fn().mockResolvedValue({ data: { user: { id: '1', email: 'a@b.com' }, session: {} }, error: null })
const signUpMock = jest.fn().mockResolvedValue({ data: { user: { id: '2', email: 'a@b.com' }, session: {} }, error: null })

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    signIn: (...args: unknown[]) => signInMock(...args),
    signUp: (...args: unknown[]) => signUpMock(...args),
    isLoading: false,
    hydrated: true,
    session: null,
    profile: null,
  }),
  useRedirectIfAuthenticated: () => ({ isLoading: false }),
}))

jest.mock('@/services/supabase/client', () => ({
  __esModule: true,
  default: { auth: {} },
}))

// Import after mocks are set up
import AuthPage from '@/app/auth/page'

describe('AuthPage component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows error when passwords do not match during registration', async () => {
    mode = 'register'
    const user = userEvent.setup()
    render(<AuthPage />)

    await user.type(screen.getByPlaceholderText(/Email address/i), 'test@example.com')
    await user.type(screen.getByPlaceholderText('Password'), 'password1')
    await user.type(screen.getByPlaceholderText('Confirm password'), 'password2')

    await user.click(screen.getByRole('button', { name: /Create account/i }))

    expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument()
    expect(signUpMock).not.toHaveBeenCalled()
  })

  it('invokes signIn on valid login submission', async () => {
    mode = 'login'
    const user = userEvent.setup()
    render(<AuthPage />)

    await user.type(screen.getByPlaceholderText(/Email address/i), 'login@example.com')
    await user.type(screen.getByPlaceholderText('Password'), 'super-secret')

    await user.click(screen.getByRole('button', { name: /Sign in/i }))

    await waitFor(() => expect(signInMock).toHaveBeenCalledWith('login@example.com', 'super-secret'))
  })
}) 