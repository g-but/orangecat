import { render as rtlRender, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import { TestWrapper } from '../TestWrapper'

// Custom render function that includes providers
function render(ui: ReactElement, options?: RenderOptions) {
  return rtlRender(ui, {
    wrapper: TestWrapper,
    ...options,
  })
}

// Re-export everything from react-testing-library
export * from '@testing-library/react'

// Override render method
export { render } 