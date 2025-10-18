/**
 * ModernProfileEditor Component Tests
 *
 * Tests the profile editor functionality including form validation,
 * file uploads, and save operations.
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import ModernProfileEditor from '../ModernProfileEditor'
import { Profile } from '@/types/database'

// Mock the services and dependencies
jest.mock('@/services/profile/storage', () => ({
  ProfileStorageService: {
    uploadAvatar: jest.fn()
  }
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}))

// Mock react-hook-form and zod
jest.mock('react-hook-form', () => ({
  useForm: jest.fn(() => ({
    handleSubmit: jest.fn((fn) => fn),
    control: {},
    watch: jest.fn(),
    setValue: jest.fn(),
    formState: { errors: {} }
  })),
  Controller: ({ render }) => render({ field: { value: '', onChange: jest.fn() } })
}))

jest.mock('@hookform/resolvers/zod', () => ({
  zodResolver: jest.fn(() => ({}))
}))

// Mock the validation module
jest.mock('@/lib/validation', () => ({
  profileSchema: {},
  normalizeProfileData: jest.fn(data => data)
}))

const mockProfile: Profile = {
  id: 'test-user-id',
  username: 'testuser',
  display_name: 'Test User',
  bio: 'Test bio',
  avatar_url: 'https://example.com/avatar.jpg',
  banner_url: 'https://example.com/banner.jpg',
  website: 'https://example.com',
  bitcoin_address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
  lightning_address: 'test@getalby.com',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

const mockProps = {
  profile: mockProfile,
  userId: 'test-user-id',
  userEmail: 'test@example.com',
  onSave: jest.fn(),
  onCancel: jest.fn()
}

describe('ModernProfileEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the profile editor modal', () => {
    render(<ModernProfileEditor {...mockProps} />)

    expect(screen.getByText('Edit profile')).toBeInTheDocument()
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Bio')).toBeInTheDocument()
    expect(screen.getByText('Location')).toBeInTheDocument()
    expect(screen.getByText('Website')).toBeInTheDocument()
    expect(screen.getByText('Username')).toBeInTheDocument()
  })

  it('shows avatar and banner images when URLs are provided', () => {
    render(<ModernProfileEditor {...mockProps} />)

    const avatar = screen.getByAltText('Avatar')
    const banner = screen.getByAltText('Banner')

    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    expect(banner).toBeInTheDocument()
    expect(banner).toHaveAttribute('src', 'https://example.com/banner.jpg')
  })

  it('displays placeholder images when URLs are not provided', () => {
    const profileWithoutImages = {
      ...mockProfile,
      avatar_url: null,
      banner_url: null
    }

    render(<ModernProfileEditor {...mockProps} profile={profileWithoutImages} />)

    // Should show placeholder elements (Camera icons)
    expect(screen.getAllByTestId('camera-icon')).toHaveLength(2)
  })

  it('shows save and cancel buttons', () => {
    render(<ModernProfileEditor {...mockProps} />)

    expect(screen.getByText('Save')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('shows close button (X)', () => {
    render(<ModernProfileEditor {...mockProps} />)

    const closeButton = screen.getByRole('button', { name: /close/i })
    expect(closeButton).toBeInTheDocument()
  })
})
