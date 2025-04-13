import { render, screen } from '../__tests__/utils'
import CreatePageForm from '../components/CreatePageForm'
import userEvent from '@testing-library/user-event'

declare global {
  var mockRouter: {
    push: jest.Mock
    replace: jest.Mock
    prefetch: jest.Mock
    back: jest.Mock
    forward: jest.Mock
    refresh: jest.Mock
    pathname: string
    query: Record<string, string>
    asPath: string
  }
}

describe('CreatePageForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders form fields', () => {
    render(<CreatePageForm />)
    
    expect(screen.getByLabelText(/bitcoin wallet address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/project title/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create page/i })).toBeInTheDocument()
  })

  it('handles form submission', async () => {
    render(<CreatePageForm />)
    
    const addressInput = screen.getByLabelText(/bitcoin wallet address/i)
    const titleInput = screen.getByLabelText(/project title/i)
    const descriptionInput = screen.getByLabelText(/project description/i)
    const submitButton = screen.getByRole('button', { name: /create page/i })

    // Fill in the form
    await userEvent.type(addressInput, 'bc1q...')
    await userEvent.type(titleInput, 'Test Page')
    await userEvent.type(descriptionInput, 'Test Description')

    // Submit the form
    await userEvent.click(submitButton)

    // Verify the form submission
    expect(global.mockRouter.push).toHaveBeenCalledWith('/success')
  })
}) 