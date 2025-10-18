import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '../page';

// Mock the useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

const mockUseAuth = require('@/hooks/useAuth').useAuth;

describe('Home', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state when not hydrated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      hydrated: false,
    });

    render(<Home />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders loading state when checking authentication', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: true,
      hydrated: true,
    });

    render(<Home />);
    expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
  });

  it('renders the landing page for non-authenticated users', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      hydrated: true,
    });

    render(<Home />);
    
    // Check for the main heading
    const heading = screen.getByRole('heading', { name: /the bitcoin yellow pages/i });
    expect(heading).toBeInTheDocument();
    
    // Check for other key elements
    expect(screen.getByText(/just like the yellow pages had phone numbers/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /get started free/i })).toBeInTheDocument();
  });

  it('renders loading state when user is authenticated (redirecting)', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '123' },
      isLoading: false,
      hydrated: true,
    });

    render(<Home />);
    expect(screen.getByText('Redirecting to dashboard...')).toBeInTheDocument();
  });
}); 