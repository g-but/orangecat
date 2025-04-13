import { render as rtlRender } from '@testing-library/react'
import { NextRouter } from 'next/router'
import { ReactElement } from 'react'
import { TestWrapper } from './TestWrapper'

export * from '@testing-library/react'

interface RenderOptions {
  router?: Partial<NextRouter>
  wrapper?: React.ComponentType
}

export function render(
  ui: ReactElement,
  { router, wrapper: Wrapper, ...options }: RenderOptions = {}
) {
  const WrapperComponent = Wrapper || TestWrapper
  return rtlRender(ui, { wrapper: WrapperComponent, ...options })
} 