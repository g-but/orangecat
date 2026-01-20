/**
 * Auth smoke test
 * Verifies that public home redirects authenticated users to /dashboard
 * and that unauthenticated users see the public client.
 *
 * This is a lightweight guard for “fast login” regressions.
 */

import { redirect } from 'next/navigation'

describe('auth smoke', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  it('renders public home when not authenticated', async () => {
    await jest.isolateModulesAsync(async () => {
      jest.doMock('next/navigation', () => ({
        redirect: jest.fn(),
      }))
      jest.doMock('@/lib/supabase/server', () => ({
        createServerClient: () =>
          Promise.resolve({
            auth: {
              getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
            },
          }),
      }))

      const { default: Home } = await import('@/app/page')
      await Home()
      const { redirect } = await import('next/navigation')
      expect((redirect as jest.Mock)).not.toHaveBeenCalled()
    })
  })

  it('redirects to dashboard when authenticated', async () => {
    await jest.isolateModulesAsync(async () => {
      jest.doMock('next/navigation', () => ({
        redirect: jest.fn(),
      }))
      jest.doMock('@/lib/supabase/server', () => ({
        createServerClient: () =>
          Promise.resolve({
            auth: {
              getUser: jest.fn().mockResolvedValue({ data: { user: { id: '123' } } }),
            },
            from: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { onboarding_completed: true },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
      }))

      const { default: Home } = await import('@/app/page')
      await Home()
      const { redirect } = await import('next/navigation')
      expect((redirect as jest.Mock)).toHaveBeenCalled()
    })
  })
})

