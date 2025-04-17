import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime'
import { NextRouter } from 'next/router'
import { ReactNode } from 'react'

interface TestWrapperProps {
  children: ReactNode
  router?: Partial<NextRouter>
}

const createRouter = (router?: Partial<NextRouter>): NextRouter => ({
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  reload: jest.fn(),
  forward: jest.fn(),
  pathname: '/',
  route: '/',
  query: {},
  asPath: '/',
  basePath: '',
  isLocaleDomain: false,
  isReady: true,
  isPreview: false,
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
  isFallback: false,
  beforePopState: jest.fn(),
  ...router,
})

export function TestWrapper({ children, router }: TestWrapperProps) {
  const mockRouter = createRouter(router)
  
  if (typeof window !== 'undefined') {
    // @ts-ignore - Set global mockRouter for tests
    window.mockRouter = mockRouter
  }

  return (
    <RouterContext.Provider value={mockRouter}>
      {children}
    </RouterContext.Provider>
  )
} 