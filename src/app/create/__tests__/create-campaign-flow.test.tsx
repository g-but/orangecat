import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import CreatePage from '../page'
import { useAuth } from '@/hooks/useAuth'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn()
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}))

// Mock UI components
jest.mock('@/components/ui/Card', () => ({
  __esModule: true,
  default: ({ children, className }: any) => <div data-testid="card" className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div data-testid="card-content" className={className}>{children}</div>
}))

jest.mock('@/components/ui/Input', () => ({
  __esModule: true,
  default: ({ label, ...props }: any) => (
    <div>
      {label && <label>{label}</label>}
      <input data-testid={`input-${props.name || props.id}`} {...props} />
    </div>
  )
}))

jest.mock('@/components/ui/Button', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, type, variant, className }: any) => (
    <button 
      data-testid={`button-${children?.props?.children || children}`}
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={className}
    >
      {children}
    </button>
  )
}))

// Mock categories
jest.mock('@/config/categories', () => ({
  simpleCategories: [
    { value: 'health', label: 'Health', icon: '🏥', description: 'Medical expenses' },
    { value: 'creative', label: 'Creative', icon: '🎨', description: 'Art, music, writing' },
    { value: 'technology', label: 'Technology', icon: '💻', description: 'Apps, websites' },
    { value: 'community', label: 'Community', icon: '🏘️', description: 'Local initiatives' }
  ]
}))

describe('Create Campaign Flow - Comprehensive Test Suite', () => {
  const mockPush = jest.fn()
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: { full_name: 'Test User' }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush
    })
    ;(useAuth as jest.Mock).mockReturnValue({
      user: mockUser
    })
  })

  describe('🔐 Authentication Requirements', () => {
    it('redirects to auth page when user is not authenticated', () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        user: null
      })

      render(<CreatePage />)

      expect(mockPush).toHaveBeenCalledWith('/auth?mode=login')
    })

    it('renders create form when user is authenticated', () => {
      render(<CreatePage />)

      expect(screen.getByText('Create Campaign')).toBeInTheDocument()
      expect(screen.getByText('Step 1 of 3')).toBeInTheDocument()
      expect(screen.getByText('Project Details')).toBeInTheDocument()
    })
  })

  describe('📝 Step 1: Project Details', () => {
    it('renders all required form fields', () => {
      render(<CreatePage />)

      expect(screen.getByTestId('input-title')).toBeInTheDocument()
      expect(screen.getByTestId('input-description')).toBeInTheDocument()
      expect(screen.getByText('Categories')).toBeInTheDocument()
      
      // Check category buttons
      expect(screen.getByText('Health')).toBeInTheDocument()
      expect(screen.getByText('Creative')).toBeInTheDocument()
      expect(screen.getByText('Technology')).toBeInTheDocument()
      expect(screen.getByText('Community')).toBeInTheDocument()
    })

    it('validates required title field for Continue button', async () => {
      render(<CreatePage />)

      const continueButton = screen.getByTestId('button-Continue')
      expect(continueButton).toBeDisabled()

      // Add title
      const titleInput = screen.getByTestId('input-title')
      await userEvent.type(titleInput, 'Test Campaign')

      expect(continueButton).not.toBeDisabled()
    })

    it('allows category selection and deselection', async () => {
      render(<CreatePage />)

      const healthCategory = screen.getByText('Health').closest('button')!
      
      // Select category
      await userEvent.click(healthCategory)
      expect(healthCategory).toHaveClass('border-teal-500')

      // Deselect category
      await userEvent.click(healthCategory)
      expect(healthCategory).not.toHaveClass('border-teal-500')
    })

    it('proceeds to step 2 when continue button is clicked', async () => {
      render(<CreatePage />)

      // Fill required fields
      const titleInput = screen.getByTestId('input-title')
      await userEvent.type(titleInput, 'Test Campaign')

      const continueButton = screen.getByTestId('button-Continue')
      await userEvent.click(continueButton)

      expect(screen.getByText('Step 2 of 3')).toBeInTheDocument()
      expect(screen.getByText('Payment Setup')).toBeInTheDocument()
    })
  })

  describe('₿ Step 2: Payment Setup', () => {
    beforeEach(async () => {
      render(<CreatePage />)
      
      // Navigate to step 2
      const titleInput = screen.getByTestId('input-title')
      await userEvent.type(titleInput, 'Test Campaign')
      
      const continueButton = screen.getByTestId('button-Continue')
      await userEvent.click(continueButton)
    })

    it('renders Bitcoin payment fields', () => {
      expect(screen.getByText('Bitcoin Address')).toBeInTheDocument()
      expect(screen.getByText('Lightning Address (Optional)')).toBeInTheDocument()
      expect(screen.getByTestId('input-bitcoin_address')).toBeInTheDocument()
      expect(screen.getByTestId('input-lightning_address')).toBeInTheDocument()
    })

    it('allows navigation back to step 1', async () => {
      const backButton = screen.getByTestId('button-Back')
      await userEvent.click(backButton)

      expect(screen.getByText('Step 1 of 3')).toBeInTheDocument()
      expect(screen.getByText('Project Details')).toBeInTheDocument()
    })

    it('proceeds to step 3 when continue button is clicked', async () => {
      const continueButton = screen.getByTestId('button-Continue')
      await userEvent.click(continueButton)

      expect(screen.getByText('Step 3 of 3')).toBeInTheDocument()
      expect(screen.getByText('Final Details')).toBeInTheDocument()
    })
  })

  describe('🎯 Step 3: Final Details', () => {
    beforeEach(async () => {
      render(<CreatePage />)
      
      // Navigate to step 3
      const titleInput = screen.getByTestId('input-title')
      await userEvent.type(titleInput, 'Test Campaign')
      
      // Step 1 -> 2
      let continueButton = screen.getByTestId('button-Continue')
      await userEvent.click(continueButton)
      
      // Step 2 -> 3
      continueButton = screen.getByTestId('button-Continue')
      await userEvent.click(continueButton)
    })

    it('renders final detail fields', () => {
      expect(screen.getByText('Website or Social Media')).toBeInTheDocument()
      expect(screen.getByText('Funding Goal (Optional)')).toBeInTheDocument()
      expect(screen.getByTestId('input-website_url')).toBeInTheDocument()
      expect(screen.getByTestId('input-goal_amount')).toBeInTheDocument()
    })

    it('shows Launch Campaign button instead of Continue', () => {
      expect(screen.getByTestId('button-Launch Campaign')).toBeInTheDocument()
      expect(screen.queryByTestId('button-Continue')).not.toBeInTheDocument()
    })

    it('allows navigation back to step 2', async () => {
      const backButton = screen.getByTestId('button-Back')
      await userEvent.click(backButton)

      expect(screen.getByText('Step 2 of 3')).toBeInTheDocument()
      expect(screen.getByText('Payment Setup')).toBeInTheDocument()
    })
  })

  describe('🚀 Form Submission', () => {
    it('successfully submits campaign and redirects to dashboard', async () => {
      render(<CreatePage />)
      
      // Fill out complete form
      const titleInput = screen.getByTestId('input-title')
      await userEvent.type(titleInput, 'Test Campaign')
      
      const descriptionInput = screen.getByTestId('input-description')
      await userEvent.type(descriptionInput, 'This is a test campaign description')
      
      // Navigate through steps
      let continueButton = screen.getByTestId('button-Continue')
      await userEvent.click(continueButton)
      
      // Step 2: Add Bitcoin address
      const bitcoinInput = screen.getByTestId('input-bitcoin_address')
      await userEvent.type(bitcoinInput, 'bc1qtest123address')
      
      continueButton = screen.getByTestId('button-Continue')
      await userEvent.click(continueButton)
      
      // Step 3: Submit
      const launchButton = screen.getByTestId('button-Launch Campaign')
      await userEvent.click(launchButton)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('🎉 Campaign created successfully!')
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('validates title requirement on submission', async () => {
      render(<CreatePage />)
      
      // Try to proceed without title
      const continueButton = screen.getByTestId('button-Continue')
      expect(continueButton).toBeDisabled()
    })
  })

  describe('💾 Draft Functionality', () => {
    it('saves draft when Save Draft button is clicked', async () => {
      const localStorageMock = {
        setItem: jest.fn()
      }
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock
      })

      render(<CreatePage />)
      
      // Add title to enable save draft
      const titleInput = screen.getByTestId('input-title')
      await userEvent.type(titleInput, 'Test Campaign')
      
      const saveDraftButton = screen.getByTestId('button-Save Draft')
      expect(saveDraftButton).not.toBeDisabled()
      
      await userEvent.click(saveDraftButton)
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `campaign-draft-${mockUser.id}`,
        expect.stringContaining('Test Campaign')
      )
      expect(toast.success).toHaveBeenCalledWith('Draft saved')
    })

    it('disables save draft when no title is provided', () => {
      render(<CreatePage />)
      
      const saveDraftButton = screen.getByTestId('button-Save Draft')
      expect(saveDraftButton).toBeDisabled()
    })
  })

  describe('🧭 Navigation', () => {
    it('allows canceling and returning to dashboard', async () => {
      render(<CreatePage />)
      
      const cancelButton = screen.getByTestId('button-Cancel')
      await userEvent.click(cancelButton)
      
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  describe('📊 Progress Tracking', () => {
    it('shows correct progress percentage for each step', async () => {
      render(<CreatePage />)
      
      // Step 1: 33%
      expect(screen.getByText('33% complete')).toBeInTheDocument()
      
      // Navigate to step 2
      const titleInput = screen.getByTestId('input-title')
      await userEvent.type(titleInput, 'Test Campaign')
      
      let continueButton = screen.getByTestId('button-Continue')
      await userEvent.click(continueButton)
      
      // Step 2: 67%
      expect(screen.getByText('67% complete')).toBeInTheDocument()
      
      // Navigate to step 3
      continueButton = screen.getByTestId('button-Continue')
      await userEvent.click(continueButton)
      
      // Step 3: 100%
      expect(screen.getByText('100% complete')).toBeInTheDocument()
    })
  })
}) 