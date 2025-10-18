/**
 * SOCIAL PAGES UI TESTS
 * 
 * Comprehensive test suite for People, Organizations, and Projects page components
 * including empty states, search functionality, and user interactions.
 * 
 * Created: 2025-01-08
 * Last Modified: 2025-01-08
 * Last Modified Summary: Complete UI test coverage for social collaboration pages
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import PeoplePage from '@/app/(authenticated)/people/page'
import OrganizationsPage from '@/app/(authenticated)/organizations/page'
import ProjectsPage from '@/app/(authenticated)/projects/page'
import React from 'react'
import '@testing-library/jest-dom'

// Mock the auth context
const mockAuthContext = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com'
  },
  profile: {
    id: 'test-user-id',
    username: 'testuser',
    full_name: 'Test User'
  },
  loading: false,
  hydrated: true
}

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext
}))

// Mock the social services
const mockPeopleService = {
  searchPeople: jest.fn(() => Promise.resolve([])),
  getConnections: jest.fn(() => Promise.resolve([])),
  sendConnectionRequest: jest.fn(() => Promise.resolve({ id: 'conn-1', status: 'pending' }))
}

const mockOrganizationService = {
  getUserOrganizations: jest.fn(() => Promise.resolve([])),
  searchOrganizations: jest.fn(() => Promise.resolve([])),
  joinOrganization: jest.fn(() => Promise.resolve())
}

const mockProjectService = {
  getUserProjects: jest.fn(() => Promise.resolve([])),
  searchProjects: jest.fn(() => Promise.resolve([])),
  joinProject: jest.fn(() => Promise.resolve())
}

const mockEmptyStateService = {
  getEmptyStateContent: jest.fn((section: string) => ({
    title: `No ${section.charAt(0).toUpperCase() + section.slice(1)} Yet`,
    description: `You haven't connected with any ${section} yet.`,
    primaryAction: {
      label: `Search ${section.charAt(0).toUpperCase() + section.slice(1)}`,
      action: `/${section}/search`
    },
    secondaryAction: {
      label: 'Complete Profile',
      action: '/profile/edit'
    },
    benefits: [
      'Collaborate on Bitcoin projects',
      'Join organizations and DAOs',
      'Share knowledge and resources'
    ],
    examples: [
      'Connect with Bitcoin developers',
      'Find co-founders for startup',
      'Join local Bitcoin meetups'
    ]
  }))
}

jest.mock('@/services/socialService', () => ({
  PeopleService: mockPeopleService,
  OrganizationService: mockOrganizationService,
  ProjectService: mockProjectService,
  EmptyStateService: mockEmptyStateService
}))

// Mock UI components
interface MockButtonProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  [key: string]: any
}

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, ...props }: MockButtonProps) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  )
}))

jest.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, placeholder, ...props }: any) => (
    <input 
      value={value} 
      onChange={onChange} 
      placeholder={placeholder} 
      {...props} 
    />
  )
}))

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>
}))

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span className={`badge ${variant} ${className}`}>{children}</span>
  )
}))

jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: any) => (
    <div className={`avatar ${className}`}>{children}</div>
  ),
  AvatarImage: ({ src, alt }: any) => (
    <img src={src} alt={alt} />
  ),
  AvatarFallback: ({ children, className }: any) => (
    <div className={`avatar-fallback ${className}`}>{children}</div>
  )
}))

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-testid="tabs" data-value={value}>
      {children}
    </div>
  ),
  TabsList: ({ children }: any) => (
    <div data-testid="tabs-list">{children}</div>
  ),
  TabsTrigger: ({ children, value, onClick }: any) => (
    <button data-testid={`tab-${value}`} onClick={onClick}>
      {children}
    </button>
  ),
  TabsContent: ({ children, value }: any) => (
    <div data-testid={`tab-content-${value}`}>{children}</div>
  )
}))

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: any) => (
    <div className={`progress ${className}`} data-value={value}>
      <div style={{ width: `${value}%` }} />
    </div>
  )
}))

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Search: () => <span data-testid="search-icon">🔍</span>,
  Users: () => <span data-testid="users-icon">👥</span>,
  UserPlus: () => <span data-testid="user-plus-icon">➕👤</span>,
  Filter: () => <span data-testid="filter-icon">🔽</span>,
  MapPin: () => <span data-testid="map-pin-icon">📍</span>,
  Star: () => <span data-testid="star-icon">⭐</span>,
  Building: () => <span data-testid="building-icon">🏢</span>,
  Plus: () => <span data-testid="plus-icon">➕</span>,
  Bitcoin: () => <span data-testid="bitcoin-icon">₿</span>,
  Wallet: () => <span data-testid="wallet-icon">💰</span>,
  Globe: () => <span data-testid="globe-icon">🌍</span>,
  Rocket: () => <span data-testid="rocket-icon">🚀</span>,
  Target: () => <span data-testid="target-icon">🎯</span>,
  Calendar: () => <span data-testid="calendar-icon">📅</span>,
  TrendingUp: () => <span data-testid="trending-up-icon">📈</span>
}))

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('PeoplePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render page header correctly', async () => {
    render(
      <TestWrapper>
        <PeoplePage />
      </TestWrapper>
    )

    expect(screen.getByText('People')).toBeInTheDocument()
    expect(screen.getByText('Connect with Bitcoin enthusiasts, builders, and changemakers worldwide')).toBeInTheDocument()
  })

  it('should display empty state when no connections', async () => {
    render(
      <TestWrapper>
        <PeoplePage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('No People Yet')).toBeInTheDocument()
      expect(screen.getByText('Search People')).toBeInTheDocument()
      expect(screen.getByText('Complete Profile')).toBeInTheDocument()
    })
  })

  it('should display benefits and examples in empty state', async () => {
    render(
      <TestWrapper>
        <PeoplePage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Why Connect?')).toBeInTheDocument()
      expect(screen.getByText('Connection Examples')).toBeInTheDocument()
      expect(screen.getByText('Collaborate on Bitcoin projects')).toBeInTheDocument()
      expect(screen.getByText('Connect with Bitcoin developers')).toBeInTheDocument()
    })
  })

  it('should handle search functionality', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper>
        <PeoplePage />
      </TestWrapper>
    )

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search people/i)).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/search people/i)
    const searchButton = screen.getByText('Search')

    await user.type(searchInput, 'bitcoin developer')
    await user.click(searchButton)

    expect(mockPeopleService.searchPeople).toHaveBeenCalledWith({
      query: 'bitcoin developer',
      limit: 20
    })
  })

  it('should handle connection requests', async () => {
    const mockPeople = [
      {
        id: 'user-1',
        username: 'bitcoindev',
        full_name: 'Bitcoin Developer',
        display_name: 'Bitcoin Developer',
        avatar_url: 'https://example.com/avatar.jpg',
        bio: 'Bitcoin core contributor',
        location: 'San Francisco',
        connections_count: 150,
        skills: ['Bitcoin', 'Lightning', 'JavaScript'],
        verification_status: 'verified'
      }
    ]

    mockPeopleService.searchPeople.mockResolvedValue(mockPeople)

    render(
      <TestWrapper>
        <PeoplePage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Bitcoin Developer')).toBeInTheDocument()
      expect(screen.getByText('@bitcoindev')).toBeInTheDocument()
    })

    const connectButton = screen.getByText('Connect')
    fireEvent.click(connectButton)

    expect(mockPeopleService.sendConnectionRequest).toHaveBeenCalledWith({
      recipient_id: 'user-1',
      message: 'Hi! I would like to connect with you on OrangeCat.'
    })
  })

  it('should display person cards with correct information', async () => {
    const mockPeople = [
      {
        id: 'user-1',
        username: 'bitcoindev',
        full_name: 'Bitcoin Developer',
        display_name: 'Bitcoin Developer',
        avatar_url: 'https://example.com/avatar.jpg',
        bio: 'Bitcoin core contributor and Lightning Network enthusiast',
        location: 'San Francisco, CA',
        connections_count: 150,
        skills: ['Bitcoin', 'Lightning', 'JavaScript', 'Go', 'Rust'],
        verification_status: 'verified'
      }
    ]

    mockPeopleService.searchPeople.mockResolvedValue(mockPeople)

    render(
      <TestWrapper>
        <PeoplePage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Bitcoin Developer')).toBeInTheDocument()
      expect(screen.getByText('@bitcoindev')).toBeInTheDocument()
      expect(screen.getByText('Bitcoin core contributor and Lightning Network enthusiast')).toBeInTheDocument()
      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument()
      expect(screen.getByText('150 connections')).toBeInTheDocument()
      expect(screen.getByText('Bitcoin')).toBeInTheDocument()
      expect(screen.getByText('Lightning')).toBeInTheDocument()
      expect(screen.getByText('JavaScript')).toBeInTheDocument()
      expect(screen.getByText('+2 more')).toBeInTheDocument() // Shows only first 3 skills
      expect(screen.getByText('Verified')).toBeInTheDocument()
    })
  })

  it('should handle loading states', async () => {
    // Mock a delayed response
    mockPeopleService.searchPeople.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve([]), 100))
    )

    render(
      <TestWrapper>
        <PeoplePage />
      </TestWrapper>
    )

    expect(screen.getByText('Loading people...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByText('Loading people...')).not.toBeInTheDocument()
    })
  })
})

describe('OrganizationsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render page header correctly', async () => {
    render(
      <TestWrapper>
        <OrganizationsPage />
      </TestWrapper>
    )

    expect(screen.getByText('Organizations')).toBeInTheDocument()
    expect(screen.getByText('Join or create organizations with shared Bitcoin wallets and collaborative governance')).toBeInTheDocument()
  })

  it('should display empty state for organizations', async () => {
    render(
      <TestWrapper>
        <OrganizationsPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('No Organizations Yet')).toBeInTheDocument()
      expect(screen.getByText('Create Organization')).toBeInTheDocument()
      expect(screen.getByText('Browse Organizations')).toBeInTheDocument()
    })
  })

  it('should display organization cards with Bitcoin wallet info', async () => {
    const mockOrganizations = [
      {
        id: 'org-1',
        name: 'Bitcoin Builders Collective',
        description: 'A community of Bitcoin developers and educators',
        type: 'community',
        status: 'active',
        member_count: 25,
        total_raised: 500000000, // 5 BTC in satoshis
        bitcoin_address: 'bc1qorg123456789abcdef',
        location: 'Global',
        logo_url: 'https://example.com/org-logo.jpg'
      }
    ]

    mockOrganizationService.searchOrganizations.mockResolvedValue(mockOrganizations)

    render(
      <TestWrapper>
        <OrganizationsPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Bitcoin Builders Collective')).toBeInTheDocument()
      expect(screen.getByText('A community of Bitcoin developers and educators')).toBeInTheDocument()
      expect(screen.getByText('community')).toBeInTheDocument()
      expect(screen.getByText('25 members')).toBeInTheDocument()
      expect(screen.getByText('5.00 BTC raised')).toBeInTheDocument()
      expect(screen.getByText('Global')).toBeInTheDocument()
      expect(screen.getByText('bc1qorg12...6789abcdef')).toBeInTheDocument() // Truncated address
      expect(screen.getByText('active')).toBeInTheDocument()
    })
  })

  it('should handle organization join requests', async () => {
    const mockOrganizations = [
      {
        id: 'org-1',
        name: 'Bitcoin Builders',
        description: 'Bitcoin community',
        type: 'community',
        status: 'active',
        member_count: 10,
        total_raised: 100000000,
        bitcoin_address: 'bc1qtest123',
        location: 'Global'
      }
    ]

    mockOrganizationService.searchOrganizations.mockResolvedValue(mockOrganizations)

    render(
      <TestWrapper>
        <OrganizationsPage />
      </TestWrapper>
    )

    await waitFor(() => {
      const joinButton = screen.getByText('Join')
      fireEvent.click(joinButton)
    })

    expect(mockOrganizationService.joinOrganization).toHaveBeenCalledWith('org-1')
  })

  it('should switch between discover and my organizations tabs', async () => {
    render(
      <TestWrapper>
        <OrganizationsPage />
      </TestWrapper>
    )

    expect(screen.getByTestId('tab-discover')).toBeInTheDocument()
    expect(screen.getByTestId('tab-my-orgs')).toBeInTheDocument()

    const myOrgsTab = screen.getByTestId('tab-my-orgs')
    fireEvent.click(myOrgsTab)

    expect(mockOrganizationService.getUserOrganizations).toHaveBeenCalledWith('test-user-id')
  })
})

describe('ProjectsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render page header correctly', async () => {
    render(
      <TestWrapper>
        <ProjectsPage />
      </TestWrapper>
    )

    expect(screen.getByText('Projects')).toBeInTheDocument()
    expect(screen.getByText('Discover and support Bitcoin-powered projects with dedicated fundraising wallets')).toBeInTheDocument()
  })

  it('should display empty state for projects', async () => {
    render(
      <TestWrapper>
        <ProjectsPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('No Projects Yet')).toBeInTheDocument()
      expect(screen.getByText('Create Project')).toBeInTheDocument()
      expect(screen.getByText('Explore Projects')).toBeInTheDocument()
    })
  })

  it('should display project cards with funding progress', async () => {
    const mockProjects = [
      {
        id: 'project-1',
        name: 'Bitcoin Education Platform',
        description: 'Interactive learning platform for Bitcoin newcomers',
        category: 'education',
        status: 'active',
        team_size: 5,
        funding_goal: 500000000, // 5 BTC in satoshis
        total_raised: 150000000, // 1.5 BTC in satoshis
        deadline: '2025-06-30T23:59:59Z',
        tags: ['education', 'bitcoin', 'learning'],
        logo_url: 'https://example.com/project-logo.jpg'
      }
    ]

    mockProjectService.searchProjects.mockResolvedValue(mockProjects)

    render(
      <TestWrapper>
        <ProjectsPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Bitcoin Education Platform')).toBeInTheDocument()
      expect(screen.getByText('Interactive learning platform for Bitcoin newcomers')).toBeInTheDocument()
      expect(screen.getByText('education')).toBeInTheDocument()
      expect(screen.getByText('5 members')).toBeInTheDocument()
      expect(screen.getByText('30.0%')).toBeInTheDocument() // Funding progress
      expect(screen.getByText('0.1500 BTC raised')).toBeInTheDocument()
      expect(screen.getByText('Goal: 5.0000 BTC')).toBeInTheDocument()
      expect(screen.getByText('6/30/2025')).toBeInTheDocument() // Deadline
      expect(screen.getByText('active')).toBeInTheDocument()
    })
  })

  it('should display project tags correctly', async () => {
    const mockProjects = [
      {
        id: 'project-1',
        name: 'Test Project',
        description: 'Test description',
        category: 'development',
        status: 'active',
        team_size: 3,
        tags: ['bitcoin', 'lightning', 'education', 'community', 'development'],
        deadline: '2025-12-31T23:59:59Z'
      }
    ]

    mockProjectService.searchProjects.mockResolvedValue(mockProjects)

    render(
      <TestWrapper>
        <ProjectsPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('bitcoin')).toBeInTheDocument()
      expect(screen.getByText('lightning')).toBeInTheDocument()
      expect(screen.getByText('+3')).toBeInTheDocument() // Shows only first 2 tags, then +count
    })
  })
  
  it('should handle project join requests', async () => {
    const mockProjects = [
      {
        id: 'project-1',
        name: 'Test Project',
        description: 'Test description',
        category: 'development',
        status: 'active',
        team_size: 3,
        tags: ['bitcoin'],
        deadline: '2025-12-31T23:59:59Z'
      }
    ]

    mockProjectService.searchProjects.mockResolvedValue(mockProjects)

    render(
      <TestWrapper>
        <ProjectsPage />
      </TestWrapper>
    )

    await waitFor(() => {
      const joinButton = screen.getByText('Join')
      fireEvent.click(joinButton)
    })

    expect(mockProjectService.joinProject).toHaveBeenCalledWith('project-1')
  })

  it('should display funding progress bar correctly', async () => {
    const mockProjects = [
      {
        id: 'project-1',
        name: 'Funded Project',
        description: 'A well-funded project',
        category: 'development',
        status: 'active',
        team_size: 3,
        funding_goal: 100000000, // 1 BTC
        total_raised: 75000000, // 0.75 BTC (75% funded)
        tags: ['bitcoin'],
        deadline: '2025-12-31T23:59:59Z'
      }
    ]

    mockProjectService.searchProjects.mockResolvedValue(mockProjects)

    render(
      <TestWrapper>
        <ProjectsPage />
      </TestWrapper>
    )

    await waitFor(() => {
      const progressBar = screen.getByTestId('progress')
      expect(progressBar).toHaveAttribute('data-value', '75')
      expect(screen.getByText('75.0%')).toBeInTheDocument()
    })
  })

  it('should switch between discover and my projects tabs', async () => {
    render(
      <TestWrapper>
        <ProjectsPage />
      </TestWrapper>
    )

    expect(screen.getByTestId('tab-discover')).toBeInTheDocument()
    expect(screen.getByTestId('tab-my-projects')).toBeInTheDocument()

    const myProjectsTab = screen.getByTestId('tab-my-projects')
    fireEvent.click(myProjectsTab)

    expect(mockProjectService.getUserProjects).toHaveBeenCalledWith('test-user-id')
  })
})

// Integration Tests
describe('Social Pages Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should handle navigation between pages', async () => {
    // Test that empty state buttons work correctly
    render(
      <TestWrapper>
        <PeoplePage />
      </TestWrapper>
    )

    await waitFor(() => {
      const searchButton = screen.getByText('Search People')
      expect(searchButton).toBeInTheDocument()
      
      // Simulate clicking the button (would navigate in real app)
      fireEvent.click(searchButton)
    })
  })

  it('should maintain consistent empty state design across pages', async () => {
    const pages = [
      { component: PeoplePage, title: 'No People Yet' },
      { component: OrganizationsPage, title: 'No Organizations Yet' },
      { component: ProjectsPage, title: 'No Projects Yet' }
    ]

    for (const { component: PageComponent, title } of pages) {
      const { unmount } = render(
        <TestWrapper>
          <PageComponent />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(title)).toBeInTheDocument()
        expect(screen.getByText('Why Connect?' || 'Organization Benefits' || 'Project Benefits')).toBeInTheDocument()
      })

      unmount()
    }
  })

  it('should handle error states gracefully', async () => {
    // Mock service errors
    mockPeopleService.searchPeople.mockRejectedValue(new Error('Network error'))
    mockOrganizationService.searchOrganizations.mockRejectedValue(new Error('Network error'))
    mockProjectService.searchProjects.mockRejectedValue(new Error('Network error'))

    const { unmount: unmountPeople } = render(
      <TestWrapper>
        <PeoplePage />
      </TestWrapper>
    )

    // Should still show empty state even with errors
    await waitFor(() => {
      expect(screen.getByText('No People Yet')).toBeInTheDocument()
    })

    unmountPeople()

    const { unmount: unmountOrgs } = render(
      <TestWrapper>
        <OrganizationsPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('No Organizations Yet')).toBeInTheDocument()
    })

    unmountOrgs()

    render(
      <TestWrapper>
        <ProjectsPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('No Projects Yet')).toBeInTheDocument()
    })
  })
})

// Accessibility Tests
describe('Accessibility Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should have proper heading structure', async () => {
    render(
      <TestWrapper>
        <PeoplePage />
      </TestWrapper>
    )

    const mainHeading = screen.getByRole('heading', { level: 1 })
    expect(mainHeading).toHaveTextContent('People')

    await waitFor(() => {
      const subHeadings = screen.getAllByRole('heading', { level: 3 })
      expect(subHeadings.length).toBeGreaterThan(0)
    })
  })

  it('should have accessible form controls', async () => {
    render(
      <TestWrapper>
        <PeoplePage />
      </TestWrapper>
    )

    const searchInput = screen.getByRole('textbox')
    expect(searchInput).toHaveAttribute('placeholder')

    const searchButton = screen.getByRole('button', { name: /search/i })
    expect(searchButton).toBeInTheDocument()
  })

  it('should have proper button labels', async () => {
    const mockPeople = [
      {
        id: 'user-1',
        username: 'testuser',
        full_name: 'Test User',
        display_name: 'Test User',
        connections_count: 0,
        skills: []
      }
    ]

    mockPeopleService.searchPeople.mockResolvedValue(mockPeople)

    render(
      <TestWrapper>
        <PeoplePage />
      </TestWrapper>
    )

    await waitFor(() => {
      const connectButton = screen.getByRole('button', { name: /connect/i })
      expect(connectButton).toBeInTheDocument()
    })
  })
})

// Performance Tests
describe('Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render large lists efficiently', async () => {
    // Mock large dataset
    const largePeopleList = Array.from({ length: 100 }, (_, i) => ({
      id: `user-${i}`,
      username: `user${i}`,
      full_name: `User ${i}`,
      display_name: `User ${i}`,
      connections_count: i * 10,
      skills: ['Bitcoin', 'Lightning']
    }))

    mockPeopleService.searchPeople.mockResolvedValue(largePeopleList)

    const startTime = performance.now()
    
    render(
      <TestWrapper>
        <PeoplePage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('User 0')).toBeInTheDocument()
    })

    const endTime = performance.now()
    const renderTime = endTime - startTime

    // Should render within reasonable time (adjust threshold as needed)
    expect(renderTime).toBeLessThan(2000) // 2 seconds
  })

  it('should handle rapid user interactions', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper>
        <PeoplePage />
      </TestWrapper>
    )

    const searchInput = screen.getByPlaceholderText(/search people/i)
    
    // Rapid typing should not cause issues
    await user.type(searchInput, 'bitcoin developer lightning network')
    
    expect(searchInput).toHaveValue('bitcoin developer lightning network')
  })
})

// Mock the auth store
jest.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    user: { id: '1', email: 'test@example.com' },
    profile: null
  })
}))

describe('Social Pages', () => {
  describe('OrganizationsPage', () => {
    it('renders organizations page', () => {
      render(<OrganizationsPage />)
      expect(screen.getByText('Organizations')).toBeInTheDocument()
    })

    it('shows create organization button', () => {
      render(<OrganizationsPage />)
      expect(screen.getByText('Create Organization')).toBeInTheDocument()
    })
  })

  describe('PeoplePage', () => {
    it('renders people page', () => {
      render(<PeoplePage />)
      expect(screen.getByText('People')).toBeInTheDocument()
    })

    it('shows search functionality', () => {
      render(<PeoplePage />)
      expect(screen.getByPlaceholderText('Search people...')).toBeInTheDocument()
    })
  })

  describe('ProjectsPage', () => {
    it('renders projects page', () => {
      render(<ProjectsPage />)
      expect(screen.getByText('Projects')).toBeInTheDocument()
    })

    it('shows submit project button', () => {
      render(<ProjectsPage />)
      expect(screen.getByText('Submit Project')).toBeInTheDocument()
    })
  })
}) 