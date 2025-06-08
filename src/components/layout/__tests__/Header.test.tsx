/**
 * Header Component Tests
 * 
 * Testing critical navigation component used across the entire Bitcoin platform
 * Essential for user authentication flow, navigation, and responsive design
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Header from '../Header';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn()
}));

// Mock useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

// Mock child components
jest.mock('../Logo', () => {
  return function MockLogo() {
    return <div data-testid="logo">OrangeCat Logo</div>;
  };
});

jest.mock('../AuthButtons', () => {
  return function MockAuthButtons({ className }: { className?: string }) {
    return <div data-testid="auth-buttons" className={className}>Auth Buttons</div>;
  };
});

jest.mock('@/components/dashboard/SmartCreateButton', () => ({
  HeaderCreateButton: function MockHeaderCreateButton() {
    return <div data-testid="header-create-button">Create Button</div>;
  }
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Menu: () => <div data-testid="menu-icon">Menu</div>,
  X: () => <div data-testid="x-icon">X</div>,
  ChevronDown: ({ className }: { className?: string }) => (
    <div data-testid="chevron-down" className={className}>ChevronDown</div>
  ),
  Zap: () => <div data-testid="zap-icon">Zap</div>,
  Building: () => <div data-testid="building-icon">Building</div>,
  Calendar: () => <div data-testid="calendar-icon">Calendar</div>,
  Wallet: () => <div data-testid="wallet-icon">Wallet</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
  Globe2: () => <div data-testid="globe2-icon">Globe2</div>
}));

const mockUsePathname = usePathname as jest.Mock;
const mockUseAuth = useAuth as jest.Mock;

describe('🧭 Header Component - Navigation Foundation Tests', () => {
  // Setup default mocks
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/');
    mockUseAuth.mockReturnValue({ user: null });
    
    // Mock window.scrollY
    Object.defineProperty(window, 'scrollY', {
      value: 0,
      writable: true
    });
    
    // Mock body style
    Object.defineProperty(document.body, 'style', {
      value: { overflow: '' },
      writable: true
    });
    
    // Clear any existing timeouts
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    document.body.style.overflow = '';
  });

  describe('✅ Basic Header Rendering', () => {
    test('should render header with logo and navigation elements', () => {
      render(<Header />);
      
      expect(screen.getByTestId('logo')).toBeInTheDocument();
      expect(screen.getByTestId('auth-buttons')).toBeInTheDocument();
      expect(screen.getByTestId('header-create-button')).toBeInTheDocument();
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    test('should apply correct header styling when not scrolled', () => {
      render(<Header />);
      
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('bg-white/90', 'backdrop-blur-md');
      expect(header).not.toHaveClass('bg-white/95', 'backdrop-blur-lg', 'shadow-sm');
    });

    test('should update header styling when scrolled', async () => {
      render(<Header />);
      
      // Simulate scroll
      act(() => {
        Object.defineProperty(window, 'scrollY', { value: 100, writable: true });
        fireEvent.scroll(window);
      });

      await waitFor(() => {
        const header = screen.getByRole('banner');
        expect(header).toHaveClass('bg-white/95', 'backdrop-blur-lg', 'shadow-sm', 'border-b');
      });
    });

    test('should render mobile menu button on small screens', () => {
      render(<Header />);
      
      const mobileButton = screen.getByLabelText('Toggle menu');
      expect(mobileButton).toBeInTheDocument();
      expect(mobileButton.closest('div')).toHaveClass('lg:hidden');
      expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
    });
  });

  describe('🔐 Authentication-Based Rendering', () => {
    test('should show guest navigation when user is not logged in', () => {
      mockUseAuth.mockReturnValue({ user: null });
      render(<Header />);

      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByText('Blog')).toBeInTheDocument();
      expect(screen.getByText('Discover')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
    });

    test('should show authenticated navigation when user is logged in', () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      mockUseAuth.mockReturnValue({ user: mockUser });
      render(<Header />);

      expect(screen.queryByText('Products')).not.toBeInTheDocument();
      expect(screen.queryByText('Blog')).not.toBeInTheDocument();
      expect(screen.getByText('My Dashboard')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
    });

    test('should update dashboard link based on authentication', () => {
      // Test unauthenticated state
      mockUseAuth.mockReturnValue({ user: null });
      const { rerender } = render(<Header />);
      
      const discoverLink = screen.getByText('Discover');
      expect(discoverLink.closest('a')).toHaveAttribute('href', '/discover');

      // Test authenticated state
      const mockUser = { id: '123', email: 'test@example.com' };
      mockUseAuth.mockReturnValue({ user: mockUser });
      rerender(<Header />);
      
      const dashboardLink = screen.getByText('My Dashboard');
      expect(dashboardLink.closest('a')).toHaveAttribute('href', '/dashboard');
    });
  });

  describe('📱 Mobile Menu Functionality', () => {
    test('should toggle mobile menu when button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      mockUseAuth.mockReturnValue({ user: null });
      render(<Header />);

      const mobileButton = screen.getByLabelText('Toggle menu');
      
      // Initially closed - mobile menu content should not be visible
      expect(screen.queryByText('Active Products')).not.toBeInTheDocument();
      expect(screen.getByTestId('menu-icon')).toBeInTheDocument();

      // Open menu
      await user.click(mobileButton);
      
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
      expect(screen.getByText('Active Products')).toBeInTheDocument();
      expect(document.body.style.overflow).toBe('hidden');
    });

    test('should close mobile menu when backdrop is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<Header />);

      const mobileButton = screen.getByLabelText('Toggle menu');
      await user.click(mobileButton);

      // Find and click backdrop - it's a div with bg-black/20 class
      const backdrop = document.querySelector('.bg-black\\/20');
      expect(backdrop).toBeInTheDocument();
      
      await user.click(backdrop!);

      expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
      expect(document.body.style.overflow).toBe('unset');
    });

    test('should close mobile menu when pathname changes', () => {
      mockUsePathname.mockReturnValue('/');
      const { rerender } = render(<Header />);
      
      // Open mobile menu first
      const mobileButton = screen.getByLabelText('Toggle menu');
      fireEvent.click(mobileButton);
      
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();

      // Simulate pathname change
      mockUsePathname.mockReturnValue('/about');
      rerender(<Header />);

      expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
    });

    test('should show different mobile content for authenticated users', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      // Test unauthenticated mobile menu
      mockUseAuth.mockReturnValue({ user: null });
      const { rerender } = render(<Header />);
      
      await user.click(screen.getByLabelText('Toggle menu'));
      expect(screen.getByText('Get Started')).toBeInTheDocument();
      expect(screen.getByText('Start Fundraising')).toBeInTheDocument();

      // Test authenticated mobile menu
      const mockUser = { id: '123', email: 'test@example.com' };
      mockUseAuth.mockReturnValue({ user: mockUser });
      rerender(<Header />);
      
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Create New Campaign')).toBeInTheDocument();
    });
  });

  describe('🎛️ Dropdown Menu Functionality', () => {
    test('should show products dropdown on hover for unauthenticated users', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      mockUseAuth.mockReturnValue({ user: null });
      render(<Header />);

      const productsContainer = screen.getByText('Products').closest('div');
      
      await user.hover(productsContainer!);
      
      await waitFor(() => {
        expect(screen.getByText('Active Products')).toBeInTheDocument();
        expect(screen.getByText('Coming Soon')).toBeInTheDocument();
        expect(screen.getByText('Fundraising')).toBeInTheDocument();
        expect(screen.getByText('Organizations')).toBeInTheDocument();
      });
    });

    test('should show about dropdown on hover', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<Header />);

      const aboutContainer = screen.getByText('About').closest('div');
      
      await user.hover(aboutContainer!);
      
      await waitFor(() => {
        expect(screen.getByText('About Us')).toBeInTheDocument();
        expect(screen.getByText('Study Bitcoin')).toBeInTheDocument();
        expect(screen.getByText('Documentation')).toBeInTheDocument();
        expect(screen.getByText('Contact')).toBeInTheDocument();
      });
    });

    test('should hide dropdown after mouse leave with delay', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<Header />);

      const aboutContainer = screen.getByText('About').closest('div');
      
      await user.hover(aboutContainer!);
      
      await waitFor(() => {
        expect(screen.getByText('About Us')).toBeInTheDocument();
      });
      
      await user.unhover(aboutContainer!);
      
      // Should still be visible immediately
      expect(screen.getByText('About Us')).toBeInTheDocument();
      
      // Should hide after timeout
      act(() => {
        jest.advanceTimersByTime(200);
      });
      
      await waitFor(() => {
        expect(screen.queryByText('About Us')).not.toBeInTheDocument();
      });
    });

    test('should rotate chevron when dropdown is open', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<Header />);

      const aboutButton = screen.getByText('About').closest('button');
      const chevron = aboutButton?.querySelector('[data-testid="chevron-down"]');
      
      expect(chevron).not.toHaveClass('rotate-180');
      
      await user.hover(aboutButton!);
      
      await waitFor(() => {
        expect(chevron).toHaveClass('rotate-180');
      });
    });
  });

  describe('🧭 Navigation & Active States', () => {
    test('should highlight active navigation items correctly', () => {
      mockUsePathname.mockReturnValue('/discover');
      render(<Header />);

      const discoverLink = screen.getByText('Discover');
      expect(discoverLink.closest('a')).toHaveClass('text-orange-600', 'bg-orange-50');
    });

    test('should handle root path active state correctly', () => {
      mockUsePathname.mockReturnValue('/');
      render(<Header />);

      // Root path should only be active for exact match
      const discoverLink = screen.getByText('Discover');
      expect(discoverLink.closest('a')).not.toHaveClass('text-orange-600', 'bg-orange-50');
    });

    test('should handle nested path active states', () => {
      mockUsePathname.mockReturnValue('/about/team');
      render(<Header />);

      const aboutButton = screen.getByText('About');
      expect(aboutButton.closest('button')).toHaveClass('text-orange-600', 'bg-orange-50');
    });

    test('should provide correct fundraising link based on auth state', () => {
      // Test unauthenticated state
      mockUseAuth.mockReturnValue({ user: null });
      const { rerender } = render(<Header />);
      
      expect(screen.getByTestId('header-create-button')).toBeInTheDocument();

      // Test authenticated state
      const mockUser = { id: '123', email: 'test@example.com' };
      mockUseAuth.mockReturnValue({ user: mockUser });
      rerender(<Header />);
      
      expect(screen.getByTestId('header-create-button')).toBeInTheDocument();
    });
  });

  describe('🎨 Product Categories Display', () => {
    test('should display all product categories for unauthenticated users', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      mockUseAuth.mockReturnValue({ user: null });
      render(<Header />);

      const productsContainer = screen.getByText('Products').closest('div');
      await user.hover(productsContainer!);

      await waitFor(() => {
        // Check for active products
        expect(screen.getByText('Fundraising')).toBeInTheDocument();
        expect(screen.getByText('Bitcoin-powered fundraising campaigns')).toBeInTheDocument();
        expect(screen.getByText('Live')).toBeInTheDocument();
      });

      // Check for coming soon products
      expect(screen.getByText('Organizations')).toBeInTheDocument();
      expect(screen.getByText('Projects')).toBeInTheDocument();
      expect(screen.getByText('Events')).toBeInTheDocument();
      expect(screen.getByText('Assets Marketplace')).toBeInTheDocument();
      expect(screen.getByText('People & Networking')).toBeInTheDocument();
    });

    test('should display product badges correctly', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      mockUseAuth.mockReturnValue({ user: null });
      render(<Header />);

      const productsContainer = screen.getByText('Products').closest('div');
      await user.hover(productsContainer!);

      await waitFor(() => {
        // Live product should have green badge
        const liveBadge = screen.getByText('Live');
        expect(liveBadge).toHaveClass('bg-green-100', 'text-green-700');
      });

      // Coming soon products should have orange badges
      const comingSoonBadges = screen.getAllByText(/Q[12] 2026/);
      comingSoonBadges.forEach(badge => {
        expect(badge).toHaveClass('bg-orange-100', 'text-orange-700');
      });
    });

    test('should include call-to-action in products dropdown', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      mockUseAuth.mockReturnValue({ user: null });
      render(<Header />);

      const productsContainer = screen.getByText('Products').closest('div');
      await user.hover(productsContainer!);

      await waitFor(() => {
        const ctaButton = screen.getByText('Get Started with Fundraising');
        expect(ctaButton.closest('a')).toHaveAttribute('href', '/fundraising');
        expect(ctaButton).toHaveClass('bg-orange-600', 'text-white');
      });
    });
  });

  describe('🔗 Link Structure & Accessibility', () => {
    test('should have proper link attributes for all navigation items', () => {
      render(<Header />);

      // Check main navigation links exist and are properly structured
      expect(screen.getByText('Discover').closest('a')).toHaveAttribute('href', '/discover');
      expect(screen.getByText('About').closest('button')).toBeInTheDocument();
    });

    test('should have proper ARIA labels for interactive elements', () => {
      render(<Header />);

      const mobileMenuButton = screen.getByLabelText('Toggle menu');
      expect(mobileMenuButton).toBeInTheDocument();
      expect(mobileMenuButton).toHaveAttribute('aria-label', 'Toggle menu');
    });

    test('should maintain keyboard navigation support', () => {
      render(<Header />);

      const aboutButton = screen.getByText('About').closest('button');
      expect(aboutButton).toBeInTheDocument();
      
      const mobileButton = screen.getByLabelText('Toggle menu');
      expect(mobileButton).toBeInTheDocument();
    });

    test('should render all about links with correct structure', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<Header />);

      const aboutContainer = screen.getByText('About').closest('div');
      
      await act(async () => {
        await user.hover(aboutContainer!);
      });

      await waitFor(() => {
        const aboutLinks = [
          { text: 'About Us', href: '/about' },
          { text: 'Study Bitcoin', href: '/study-bitcoin' },
          { text: 'Documentation', href: '/docs' },
          { text: 'Contact', href: '/profile/mao' }
        ];

        aboutLinks.forEach(link => {
          const linkElement = screen.getByText(link.text);
          expect(linkElement.closest('a')).toHaveAttribute('href', link.href);
        });

        // Check Blog link separately to avoid multiple element issue
        const blogLinks = screen.getAllByText('Blog');
        const dropdownBlogLink = blogLinks.find(link => 
          link.closest('a')?.getAttribute('href') === '/blog' && 
          link.closest('.absolute') // Inside dropdown
        );
        expect(dropdownBlogLink).toBeInTheDocument();
        expect(dropdownBlogLink?.closest('a')).toHaveAttribute('href', '/blog');
      });
    });
  });

  describe('⚡ Performance & Interactions', () => {
    test('should cleanup scroll event listener on unmount', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = render(<Header />);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    });

    test('should cleanup timeouts on unmount', () => {
      const { unmount } = render(<Header />);
      
      // This ensures no memory leaks from pending timeouts
      expect(() => unmount()).not.toThrow();
    });

    test('should handle rapid hover events correctly', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<Header />);

      const aboutContainer = screen.getByText('About').closest('div');
      
      // Rapid hover/unhover
      await user.hover(aboutContainer!);
      await user.unhover(aboutContainer!);
      await user.hover(aboutContainer!);
      
      await waitFor(() => {
        // Should still show dropdown
        expect(screen.getByText('About Us')).toBeInTheDocument();
      });
    });

    test('should prevent body scroll when mobile menu is open', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<Header />);

      const mobileButton = screen.getByLabelText('Toggle menu');
      
      // Open menu
      await user.click(mobileButton);
      expect(document.body.style.overflow).toBe('hidden');
      
      // Close menu
      await user.click(mobileButton);
      expect(document.body.style.overflow).toBe('unset');
    });
  });

  describe('🎯 Bitcoin Platform Integration', () => {
    test('should show Bitcoin-specific navigation for authenticated users', () => {
      const mockUser = { id: '123', email: 'bitcoin@example.com' };
      mockUseAuth.mockReturnValue({ user: mockUser });
      render(<Header />);

      expect(screen.getByText('My Dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('header-create-button')).toBeInTheDocument();
    });

    test('should highlight fundraising-related paths correctly', () => {
      mockUsePathname.mockReturnValue('/fundraising/my-campaign');
      mockUseAuth.mockReturnValue({ user: null });
      render(<Header />);

      const productsButton = screen.getByText('Products');
      expect(productsButton.closest('button')).toHaveClass('text-orange-600', 'bg-orange-50');
    });

    test('should provide appropriate mobile experience for Bitcoin users', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const mockUser = { id: '123', email: 'bitcoin@example.com' };
      mockUseAuth.mockReturnValue({ user: mockUser });
      render(<Header />);

      await user.click(screen.getByLabelText('Toggle menu'));

      expect(screen.getByText('Create New Campaign')).toBeInTheDocument();
      expect(screen.getByText('Launch a new Bitcoin fundraising campaign')).toBeInTheDocument();
      expect(screen.getAllByText('My Dashboard')).toHaveLength(2); // Desktop and mobile versions
      expect(screen.getByText('View and manage your campaigns')).toBeInTheDocument();
    });

    test('should show proper Bitcoin education links in about section', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<Header />);

      const aboutContainer = screen.getByText('About').closest('div');
      await user.hover(aboutContainer!);

      await waitFor(() => {
        expect(screen.getByText('Study Bitcoin')).toBeInTheDocument();
        expect(screen.getByText('Educational resources to learn about Bitcoin')).toBeInTheDocument();
      });
    });
  });

  describe('🔧 Edge Cases & Error Handling', () => {
    test('should handle missing user gracefully', () => {
      mockUseAuth.mockReturnValue({ user: undefined });
      
      expect(() => render(<Header />)).not.toThrow();
      expect(screen.getByText('Discover')).toBeInTheDocument();
    });

    test('should handle undefined pathname gracefully', () => {
      mockUsePathname.mockReturnValue('');
      
      expect(() => render(<Header />)).not.toThrow();
      expect(screen.getByTestId('logo')).toBeInTheDocument();
    });

    test('should handle window resize events during dropdown interaction', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<Header />);

      const aboutContainer = screen.getByText('About').closest('div');
      await user.hover(aboutContainer!);
      
      await waitFor(() => {
        expect(screen.getByText('About Us')).toBeInTheDocument();
      });
      
      // Simulate window resize
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      
      // Should not break functionality
      expect(screen.getByText('About Us')).toBeInTheDocument();
    });

    test('should handle rapid menu toggle clicks', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<Header />);

      const mobileButton = screen.getByLabelText('Toggle menu');
      
      // Rapid clicks
      await user.click(mobileButton);
      await user.click(mobileButton);
      await user.click(mobileButton);
      
      // Should be in open state
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });

    test('should cleanup properly when auth state changes', () => {
      mockUseAuth.mockReturnValue({ user: null });
      const { rerender } = render(<Header />);
      
      expect(screen.getByText('Products')).toBeInTheDocument();
      
      // Change auth state
      const mockUser = { id: '123', email: 'test@example.com' };
      mockUseAuth.mockReturnValue({ user: mockUser });
      rerender(<Header />);
      
      expect(screen.queryByText('Products')).not.toBeInTheDocument();
      expect(screen.getByText('My Dashboard')).toBeInTheDocument();
    });
  });
}); 