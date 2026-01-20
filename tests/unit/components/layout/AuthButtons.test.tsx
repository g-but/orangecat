/**
 * AuthButtons Component Tests
 * Testing critical authentication UI component for the Bitcoin platform
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AuthButtons from '@/components/layout/AuthButtons';
import { useAuth } from '@/hooks/useAuth';

// Mock useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) {
    return <a href={href} className={className}>{children}</a>;
  };
});

// Mock Button component
jest.mock('@/components/ui/Button', () => {
  return function MockButton({ children, variant, className }: { children: React.ReactNode; variant?: string; className?: string }) {
    return <button data-variant={variant} className={className}>{children}</button>;
  };
});

// Mock UserProfileDropdown component
jest.mock('@/components/ui/UserProfileDropdown', () => {
  return function MockUserProfileDropdown({ variant }: { variant?: string }) {
    return <div data-testid="user-profile-dropdown" data-variant={variant}>User Profile Dropdown</div>;
  };
});

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Loader2: ({ className }: { className?: string }) => (
    <div data-testid="loader2-icon" className={className}>Loading</div>
  )
}));

const mockUseAuth = useAuth as jest.Mock;

describe('🔐 AuthButtons Component Tests', () => {
  beforeEach(() => {
    mockUseAuth.mockClear();
  });

  describe('✅ Hydration & Loading States', () => {
    test('should show hydration loading indicator when not hydrated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        hydrated: false
      });

      render(<AuthButtons />);
      
      const pulseDiv = document.querySelector('.animate-pulse');
      expect(pulseDiv).toBeInTheDocument();
      // Component uses smaller indicator (w-3 h-3) for compact loading
      expect(pulseDiv).toHaveClass('w-3', 'h-3', 'bg-gray-200', 'rounded-full', 'animate-pulse');
    });

    test('should show loading spinner when hydrated but loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        session: null,
        isLoading: true,
        hydrated: true
      });

      render(<AuthButtons />);
      
      expect(screen.getByTestId('loader2-icon')).toBeInTheDocument();
      // Component uses h-4 w-4 for compact spinner size
      expect(screen.getByTestId('loader2-icon')).toHaveClass('h-4', 'w-4', 'animate-spin', 'text-tiffany-500');
    });

    test('should apply custom className to hydration indicator', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        hydrated: false
      });

      render(<AuthButtons className="custom-class" />);
      
      const container = document.querySelector('.custom-class');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('flex', 'items-center', 'justify-center', 'custom-class');
    });
  });

  describe('🔑 Authenticated User States', () => {
    test('should render UserProfileDropdown when user is authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '123', email: 'user@example.com' },
        session: { access_token: 'token' },
        isLoading: false,
        hydrated: true
      });

      render(<AuthButtons />);
      
      const dropdown = screen.getByTestId('user-profile-dropdown');
      expect(dropdown).toBeInTheDocument();
      expect(dropdown).toHaveAttribute('data-variant', 'advanced');
    });

    test('should render login buttons when only user exists (requires both user AND session)', () => {
      // Component requires BOTH user AND session to show dropdown
      // This prevents showing dropdown with stale data
      mockUseAuth.mockReturnValue({
        user: { id: '123', email: 'user@example.com' },
        session: null,
        isLoading: false,
        hydrated: true
      });

      render(<AuthButtons />);

      // Should show login buttons, not dropdown
      expect(screen.queryByTestId('user-profile-dropdown')).not.toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    test('should render login buttons when only session exists (requires both user AND session)', () => {
      // Component requires BOTH user AND session to show dropdown
      mockUseAuth.mockReturnValue({
        user: null,
        session: { access_token: 'token', user: { id: '123' } },
        isLoading: false,
        hydrated: true
      });

      render(<AuthButtons />);

      // Should show login buttons, not dropdown
      expect(screen.queryByTestId('user-profile-dropdown')).not.toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });
  });

  describe('🚫 Unauthenticated User States', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        hydrated: true
      });
    });

    test('should render login and register buttons when not authenticated', () => {
      render(<AuthButtons />);
      
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByText('Get Started')).toBeInTheDocument();
    });

    test('should have correct href attributes for auth buttons', () => {
      render(<AuthButtons />);
      
      const loginLink = screen.getByText('Sign In').closest('a');
      const registerLink = screen.getByText('Get Started').closest('a');
      
      expect(loginLink).toHaveAttribute('href', '/auth?mode=login');
      expect(registerLink).toHaveAttribute('href', '/auth?mode=register');
    });

    test('should use ghost variant for login button', () => {
      render(<AuthButtons />);
      
      const loginButton = screen.getByText('Sign In');
      expect(loginButton).toHaveAttribute('data-variant', 'ghost');
    });

    test('should have minimum touch target size for buttons', () => {
      render(<AuthButtons />);

      const loginButton = screen.getByText('Sign In');
      const registerButton = screen.getByText('Get Started');

      // Component uses 36px minimum height for compact buttons
      expect(loginButton).toHaveClass('min-h-[36px]');
      expect(registerButton).toHaveClass('min-h-[36px]');
    });
  });

  describe('📱 Mobile Navigation Layout', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        hydrated: true
      });
    });

    test('should detect mobile navigation layout from className', () => {
      render(<AuthButtons className="flex-col mobile-nav" />);

      const container = screen.getByText('Sign In').closest('div');
      // Component uses space-y-2 for mobile layout
      expect(container).toHaveClass('flex-col', 'space-y-2', 'w-full');
      // Mobile layout uses space-y-2 instead of space-x-2
      expect(container).not.toHaveClass('space-x-2');
    });

    test('should apply full width styling to links in mobile layout', () => {
      render(<AuthButtons className="flex-col" />);
      
      const loginLink = screen.getByText('Sign In').closest('a');
      const registerLink = screen.getByText('Get Started').closest('a');
      
      expect(loginLink).toHaveClass('w-full');
      expect(registerLink).toHaveClass('w-full');
    });

    test('should apply full width and center styling to buttons in mobile layout', () => {
      render(<AuthButtons className="flex-col" />);
      
      const loginButton = screen.getByText('Sign In');
      const registerButton = screen.getByText('Get Started');
      
      expect(loginButton).toHaveClass('w-full', 'justify-center');
      expect(registerButton).toHaveClass('w-full', 'justify-center');
    });
  });

  describe('🔄 State Transitions', () => {
    test('should transition from hydration to loading state', () => {
      const { rerender } = render(<AuthButtons />);
      
      mockUseAuth.mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        hydrated: false
      });
      rerender(<AuthButtons />);
      
      const pulseDiv = document.querySelector('.animate-pulse');
      expect(pulseDiv).toBeInTheDocument();
      expect(pulseDiv).toHaveClass('animate-pulse');
      
      mockUseAuth.mockReturnValue({
        user: null,
        session: null,
        isLoading: true,
        hydrated: true
      });
      rerender(<AuthButtons />);
      
      expect(screen.getByTestId('loader2-icon')).toHaveClass('animate-spin');
    });

    test('should transition from loading to unauthenticated state', () => {
      const { rerender } = render(<AuthButtons />);
      
      mockUseAuth.mockReturnValue({
        user: null,
        session: null,
        isLoading: true,
        hydrated: true
      });
      rerender(<AuthButtons />);
      
      expect(screen.getByTestId('loader2-icon')).toBeInTheDocument();
      
      mockUseAuth.mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        hydrated: true
      });
      rerender(<AuthButtons />);
      
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByText('Get Started')).toBeInTheDocument();
    });

    test('should transition from unauthenticated to authenticated state', () => {
      const { rerender } = render(<AuthButtons />);
      
      mockUseAuth.mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        hydrated: true
      });
      rerender(<AuthButtons />);
      
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      
      mockUseAuth.mockReturnValue({
        user: { id: '123', email: 'user@example.com' },
        session: { access_token: 'token' },
        isLoading: false,
        hydrated: true
      });
      rerender(<AuthButtons />);
      
      expect(screen.getByTestId('user-profile-dropdown')).toBeInTheDocument();
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
    });
  });

  describe('♿ Accessibility', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        hydrated: true
      });
    });

    test('should have accessible button text', () => {
      render(<AuthButtons />);
      
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Get Started' })).toBeInTheDocument();
    });

    test('should have proper link semantics', () => {
      render(<AuthButtons />);
      
      const loginLink = screen.getByRole('link', { name: 'Sign In' });
      const registerLink = screen.getByRole('link', { name: 'Get Started' });
      
      expect(loginLink).toHaveAttribute('href', '/auth?mode=login');
      expect(registerLink).toHaveAttribute('href', '/auth?mode=register');
    });

    test('should maintain minimum touch target sizes', () => {
      render(<AuthButtons />);

      const loginButton = screen.getByText('Sign In');
      const registerButton = screen.getByText('Get Started');

      // Component uses 36px minimum height for compact buttons
      expect(loginButton).toHaveClass('min-h-[36px]');
      expect(registerButton).toHaveClass('min-h-[36px]');
    });
  });

  describe('🔧 Edge Cases & Error Handling', () => {
    test('should handle undefined auth hook return', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        hydrated: true
      });
      
      expect(() => render(<AuthButtons />)).not.toThrow();
    });

    test('should handle empty auth hook return', () => {
      mockUseAuth.mockReturnValue({});
      
      expect(() => render(<AuthButtons />)).not.toThrow();
    });

    test('should handle partial auth state', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        session: null,
      });
      
      expect(() => render(<AuthButtons />)).not.toThrow();
    });

    test('should handle className edge cases', () => {
      const edgeCases = ['', '   ', 'flex-col-something', 'not-flex-col'];
      
      edgeCases.forEach(className => {
        mockUseAuth.mockReturnValue({
          user: null,
          session: null,
          isLoading: false,
          hydrated: true
        });
        
        const { unmount } = render(<AuthButtons className={className} />);
        expect(screen.getByText('Sign In')).toBeInTheDocument();
        unmount();
      });
    });
  });
});
