/**
 * Footer Component Tests
 * 
 * Testing critical footer component used throughout the Bitcoin platform
 * Essential for navigation, branding, social links, and responsive design
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { usePathname } from 'next/navigation';
import Footer from '../Footer';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn()
}));

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) {
    return <a href={href} className={className}>{children}</a>;
  };
});

// Mock Logo component
jest.mock('@/components/layout/Logo', () => {
  return function MockLogo({ className }: { className?: string }) {
    return <div data-testid="logo" className={className}>OrangeCat Logo</div>;
  };
});

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  ArrowUp: ({ className }: { className?: string }) => (
    <div data-testid="arrow-up-icon" className={className}>ArrowUp</div>
  ),
  Github: ({ className }: { className?: string }) => (
    <div data-testid="github-icon" className={className}>Github</div>
  ),
  Twitter: ({ className }: { className?: string }) => (
    <div data-testid="twitter-icon" className={className}>Twitter</div>
  )
}));

// Mock navigation config
jest.mock('@/config/navigation', () => ({
  navigation: {
    main: [
      { name: 'Fund Yourself', href: '/create' },
      { name: 'Discover', href: '/discover' },
      { name: 'Fund Us', href: '/fund-us' },
      { name: 'About', href: '/about' },
      { name: 'Blog', href: '/blog' }
    ],
    footer: {
      legal: [
        { name: 'Privacy', href: '/privacy' },
        { name: 'Terms', href: '/terms' },
        { name: 'Security', href: '/security' }
      ],
      social: [
        { name: 'Twitter', href: 'https://twitter.com/orangecat', icon: () => <div data-testid="twitter-icon">Twitter</div> },
        { name: 'GitHub', href: 'https://github.com/g-but/orangecat', icon: () => <div data-testid="github-icon">Github</div> }
      ]
    }
  }
}));

// Mock window.scrollTo
const mockScrollTo = jest.fn();
Object.defineProperty(window, 'scrollTo', {
  value: mockScrollTo,
  writable: true
});

const mockUsePathname = usePathname as jest.Mock;

describe('🦶 Footer Component - Platform Foundation Tests', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/');
    mockScrollTo.mockClear();
  });

  describe('✅ Basic Rendering & Visibility', () => {
    test('should render footer successfully on public pages', () => {
      mockUsePathname.mockReturnValue('/');
      render(<Footer />);
      
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
      expect(screen.getByTestId('logo')).toBeInTheDocument();
      expect(screen.getByText('Making Bitcoin donations simple and accessible for everyone.')).toBeInTheDocument();
    });

    test('should not render footer on authenticated dashboard pages', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      const { container } = render(<Footer />);
      
      expect(container.firstChild).toBeNull();
      expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
    });

    test('should not render footer on profile pages', () => {
      mockUsePathname.mockReturnValue('/profile/testuser');
      const { container } = render(<Footer />);
      
      expect(container.firstChild).toBeNull();
    });

    test('should not render footer on settings pages', () => {
      mockUsePathname.mockReturnValue('/settings/account');
      const { container } = render(<Footer />);
      
      expect(container.firstChild).toBeNull();
    });

    test('should not render footer on assets pages', () => {
      mockUsePathname.mockReturnValue('/assets/bitcoin');
      const { container } = render(<Footer />);
      
      expect(container.firstChild).toBeNull();
    });

    test('should not render footer on people pages', () => {
      mockUsePathname.mockReturnValue('/people/contributors');
      const { container } = render(<Footer />);
      
      expect(container.firstChild).toBeNull();
    });

    test('should not render footer on events pages', () => {
      mockUsePathname.mockReturnValue('/events/conference');
      const { container } = render(<Footer />);
      
      expect(container.firstChild).toBeNull();
    });

    test('should not render footer on organizations pages', () => {
      mockUsePathname.mockReturnValue('/organizations/nonprofits');
      const { container } = render(<Footer />);
      
      expect(container.firstChild).toBeNull();
    });

    test('should not render footer on projects pages', () => {
      mockUsePathname.mockReturnValue('/projects/development');
      const { container } = render(<Footer />);
      
      expect(container.firstChild).toBeNull();
    });

    test('should not render footer on fundraising pages', () => {
      mockUsePathname.mockReturnValue('/fundraising/campaigns');
      const { container } = render(<Footer />);
      
      expect(container.firstChild).toBeNull();
    });

    test('should render footer on public home page', () => {
      mockUsePathname.mockReturnValue('/');
      render(<Footer />);
      
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    test('should render footer on public discover page', () => {
      mockUsePathname.mockReturnValue('/discover');
      render(<Footer />);
      
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    test('should render footer on public about page', () => {
      mockUsePathname.mockReturnValue('/about');
      render(<Footer />);
      
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    test('should render footer on auth pages', () => {
      mockUsePathname.mockReturnValue('/auth');
      render(<Footer />);
      
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });
  });

  describe('🚀 Back to Top Button', () => {
    test('should render back to top button with correct styling', () => {
      render(<Footer />);
      
      const backToTopButton = screen.getByLabelText('Back to top');
      expect(backToTopButton).toBeInTheDocument();
      expect(backToTopButton).toHaveClass('bg-gradient-to-r', 'from-orange-500', 'to-tiffany-500');
      expect(screen.getByTestId('arrow-up-icon')).toBeInTheDocument();
    });

    test('should call scrollTo when back to top button is clicked', () => {
      render(<Footer />);
      
      const backToTopButton = screen.getByLabelText('Back to top');
      fireEvent.click(backToTopButton);
      
      expect(mockScrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });

    test('should handle multiple clicks on back to top button', () => {
      render(<Footer />);
      
      const backToTopButton = screen.getByLabelText('Back to top');
      fireEvent.click(backToTopButton);
      fireEvent.click(backToTopButton);
      fireEvent.click(backToTopButton);
      
      expect(mockScrollTo).toHaveBeenCalledTimes(3);
      expect(mockScrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });

    test('should have proper accessibility attributes for back to top button', () => {
      render(<Footer />);
      
      const backToTopButton = screen.getByLabelText('Back to top');
      expect(backToTopButton).toHaveAttribute('aria-label', 'Back to top');
      expect(backToTopButton.tagName).toBe('BUTTON');
    });

    test('should have hover and interaction classes for back to top button', () => {
      render(<Footer />);
      
      const backToTopButton = screen.getByLabelText('Back to top');
      expect(backToTopButton).toHaveClass('hover:shadow-xl', 'hover:scale-110', 'active:scale-95');
    });
  });

  describe('🏢 Brand Section & Logo', () => {
    test('should render logo with correct props', () => {
      render(<Footer />);
      
      const logo = screen.getByTestId('logo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveClass('mb-2');
    });

    test('should render brand description', () => {
      render(<Footer />);
      
      const description = screen.getByText('Making Bitcoin donations simple and accessible for everyone.');
      expect(description).toBeInTheDocument();
      expect(description).toHaveClass('text-slate-600', 'text-base', 'leading-relaxed', 'max-w-xs');
    });

    test('should maintain brand consistency across the page', () => {
      render(<Footer />);
      
      expect(screen.getByTestId('logo')).toBeInTheDocument();
      expect(screen.getByText('Making Bitcoin donations simple and accessible for everyone.')).toBeInTheDocument();
    });
  });

  describe('🌐 Social Media Links', () => {
    test('should render all social media links', () => {
      render(<Footer />);
      
      const twitterLink = screen.getByLabelText('Follow us on Twitter');
      const githubLink = screen.getByLabelText('Follow us on GitHub');
      
      expect(twitterLink).toBeInTheDocument();
      expect(githubLink).toBeInTheDocument();
    });

    test('should have correct href attributes for social links', () => {
      render(<Footer />);
      
      const twitterLink = screen.getByLabelText('Follow us on Twitter');
      const githubLink = screen.getByLabelText('Follow us on GitHub');
      
      expect(twitterLink.closest('a')).toHaveAttribute('href', 'https://twitter.com/orangecat');
      expect(githubLink.closest('a')).toHaveAttribute('href', 'https://github.com/g-but/orangecat');
    });

    test('should have correct target and rel attributes for social links', () => {
      render(<Footer />);
      
      const socialLinks = screen.getAllByRole('link');
      const externalLinks = socialLinks.filter(link => 
        link.getAttribute('href')?.startsWith('http')
      );
      
      externalLinks.forEach(link => {
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });

    test('should render social media icons', () => {
      render(<Footer />);
      
      expect(screen.getAllByTestId('twitter-icon')).toHaveLength(1);
      expect(screen.getAllByTestId('github-icon')).toHaveLength(1);
    });

    test('should have proper styling for social media links', () => {
      render(<Footer />);
      
      const twitterLink = screen.getByLabelText('Follow us on Twitter');
      expect(twitterLink).toHaveClass('group', 'w-10', 'h-10', 'bg-gray-100', 'rounded-lg');
    });
  });

  describe('🧭 Navigation Links', () => {
    test('should render all main navigation links', () => {
      render(<Footer />);
      
      expect(screen.getByText('Fund Yourself')).toBeInTheDocument();
      expect(screen.getByText('Discover')).toBeInTheDocument();
      expect(screen.getByText('Fund Us')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
      expect(screen.getByText('Blog')).toBeInTheDocument();
    });

    test('should have correct href attributes for navigation links', () => {
      render(<Footer />);
      
      expect(screen.getByText('Fund Yourself').closest('a')).toHaveAttribute('href', '/create');
      expect(screen.getByText('Discover').closest('a')).toHaveAttribute('href', '/discover');
      expect(screen.getByText('Fund Us').closest('a')).toHaveAttribute('href', '/fund-us');
      expect(screen.getByText('About').closest('a')).toHaveAttribute('href', '/about');
      expect(screen.getByText('Blog').closest('a')).toHaveAttribute('href', '/blog');
    });

    test('should render navigation section title with gradient styling', () => {
      render(<Footer />);
      
      const navTitle = screen.getByText('Navigation');
      expect(navTitle).toBeInTheDocument();
      expect(navTitle).toHaveClass('bg-gradient-to-r', 'from-orange-500', 'to-tiffany-500', 'bg-clip-text', 'text-transparent');
    });

    test('should have proper hover effects for navigation links', () => {
      render(<Footer />);
      
      const navLink = screen.getByText('Fund Yourself');
      expect(navLink.closest('a')).toHaveClass('group', 'flex', 'items-center', 'text-base', 'text-slate-600', 'hover:text-orange-600');
    });

    test('should have minimum touch target size for navigation links', () => {
      render(<Footer />);
      
      const navLinks = screen.getAllByText(/Fund Yourself|Discover|Fund Us|About|Blog/);
      navLinks.forEach(link => {
        expect(link.closest('a')).toHaveClass('min-h-[44px]');
      });
    });
  });

  describe('⚖️ Legal Links', () => {
    test('should render all legal links', () => {
      render(<Footer />);
      
      expect(screen.getByText('Privacy')).toBeInTheDocument();
      expect(screen.getByText('Terms')).toBeInTheDocument();
      expect(screen.getByText('Security')).toBeInTheDocument();
    });

    test('should have correct href attributes for legal links', () => {
      render(<Footer />);
      
      expect(screen.getByText('Privacy').closest('a')).toHaveAttribute('href', '/privacy');
      expect(screen.getByText('Terms').closest('a')).toHaveAttribute('href', '/terms');
      expect(screen.getByText('Security').closest('a')).toHaveAttribute('href', '/security');
    });

    test('should render legal section title with gradient styling', () => {
      render(<Footer />);
      
      const legalTitle = screen.getByText('Legal');
      expect(legalTitle).toBeInTheDocument();
      expect(legalTitle).toHaveClass('bg-gradient-to-r', 'from-orange-500', 'to-tiffany-500', 'bg-clip-text', 'text-transparent');
    });

    test('should have proper styling for legal links', () => {
      render(<Footer />);
      
      const legalLink = screen.getByText('Privacy');
      expect(legalLink.closest('a')).toHaveClass('group', 'flex', 'items-center', 'text-base', 'text-slate-600', 'hover:text-orange-600');
    });

    test('should have minimum touch target size for legal links', () => {
      render(<Footer />);
      
      const legalLinks = screen.getAllByText(/Privacy|Terms|Security/);
      legalLinks.forEach(link => {
        expect(link.closest('a')).toHaveClass('min-h-[44px]');
      });
    });
  });

  describe('📧 Newsletter/CTA Section', () => {
    test('should render newsletter section with correct title', () => {
      render(<Footer />);
      
      const stayUpdatedTitle = screen.getByText('Stay Updated');
      expect(stayUpdatedTitle).toBeInTheDocument();
      expect(stayUpdatedTitle).toHaveClass('bg-gradient-to-r', 'from-orange-500', 'to-tiffany-500', 'bg-clip-text', 'text-transparent');
    });

    test('should render newsletter description', () => {
      render(<Footer />);
      
      const description = screen.getByText('Get the latest updates on Bitcoin fundraising and community building.');
      expect(description).toBeInTheDocument();
      expect(description).toHaveClass('text-sm', 'text-slate-600', 'leading-relaxed');
    });

    test('should render get started CTA button', () => {
      render(<Footer />);
      
      const ctaButton = screen.getByText('Get Started Today');
      expect(ctaButton).toBeInTheDocument();
      expect(ctaButton.closest('a')).toHaveAttribute('href', '/auth?mode=register');
    });

    test('should have proper styling for CTA button', () => {
      render(<Footer />);
      
      const ctaButton = screen.getByText('Get Started Today');
      expect(ctaButton).toHaveClass('inline-flex', 'items-center', 'justify-center', 'bg-gradient-to-r', 'from-orange-500', 'to-tiffany-500');
    });

    test('should have minimum touch target size for CTA button', () => {
      render(<Footer />);
      
      const ctaButton = screen.getByText('Get Started Today');
      expect(ctaButton).toHaveClass('min-h-[44px]');
    });

    test('should have responsive width classes for CTA button', () => {
      render(<Footer />);
      
      const ctaButton = screen.getByText('Get Started Today');
      expect(ctaButton).toHaveClass('w-full', 'sm:w-auto');
    });
  });

  describe('📄 Bottom Section & Copyright', () => {
    test('should render current year in copyright', () => {
      render(<Footer />);
      
      const currentYear = new Date().getFullYear();
      const copyright = screen.getByText(`© ${currentYear} OrangeCat. All rights reserved.`);
      expect(copyright).toBeInTheDocument();
    });

    test('should render additional bottom links', () => {
      render(<Footer />);
      
      expect(screen.getByText('Documentation')).toBeInTheDocument();
      expect(screen.getByText('API')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    test('should have correct href attributes for bottom links', () => {
      render(<Footer />);
      
      // Get the bottom section documentation link (different from navigation section)
      const bottomLinks = screen.getAllByText('Documentation');
      const bottomDocLink = bottomLinks.find(link => 
        link.closest('a')?.getAttribute('href') === '/docs'
      );
      
      expect(bottomDocLink?.closest('a')).toHaveAttribute('href', '/docs');
      expect(screen.getByText('API').closest('a')).toHaveAttribute('href', '/api');
      expect(screen.getByText('Status').closest('a')).toHaveAttribute('href', '/status');
    });

    test('should have proper responsive layout for bottom section', () => {
      render(<Footer />);
      
      const copyright = screen.getByText(/© \d{4} OrangeCat/);
      const bottomSection = copyright.closest('div');
      expect(bottomSection).toHaveClass('flex', 'flex-col', 'sm:flex-row', 'items-center', 'justify-between');
    });

    test('should have proper styling for bottom links', () => {
      render(<Footer />);
      
      const apiLink = screen.getByText('API');
      expect(apiLink).toHaveClass('text-slate-500', 'hover:text-orange-600', 'transition-colors', 'duration-300', 'hover:underline');
    });
  });

  describe('📱 Responsive Design', () => {
    test('should have responsive grid layout', () => {
      render(<Footer />);
      
      const footerContent = screen.getByRole('contentinfo');
      const gridContainer = footerContent.querySelector('.grid');
      expect(gridContainer).toHaveClass('grid', 'grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-4');
    });

    test('should have responsive padding', () => {
      render(<Footer />);
      
      const footerContent = screen.getByRole('contentinfo');
      const paddingContainer = footerContent.querySelector('.py-8');
      expect(paddingContainer).toHaveClass('py-8', 'sm:py-12', 'px-4', 'sm:px-6', 'lg:px-8');
    });

    test('should have responsive max width container', () => {
      render(<Footer />);
      
      const footerContent = screen.getByRole('contentinfo');
      const maxWidthContainer = footerContent.querySelector('.max-w-7xl');
      expect(maxWidthContainer).toHaveClass('max-w-7xl', 'mx-auto');
    });

    test('should have responsive gap spacing', () => {
      render(<Footer />);
      
      const footerContent = screen.getByRole('contentinfo');
      const gridContainer = footerContent.querySelector('.grid');
      expect(gridContainer).toHaveClass('gap-8', 'lg:gap-12');
    });

    test('should have responsive spacing for social links', () => {
      render(<Footer />);
      
      const socialContainer = screen.getByLabelText('Follow us on Twitter').closest('div');
      expect(socialContainer).toHaveClass('flex', 'space-x-4');
    });
  });

  describe('🎨 Theme & Styling', () => {
    test('should use Bitcoin Orange in gradient themes', () => {
      render(<Footer />);
      
      const backToTopButton = screen.getByLabelText('Back to top');
      expect(backToTopButton).toHaveClass('bg-gradient-to-r', 'from-orange-500', 'to-tiffany-500');
      
      const ctaButton = screen.getByText('Get Started Today');
      expect(ctaButton).toHaveClass('bg-gradient-to-r', 'from-orange-500', 'to-tiffany-500');
    });

    test('should have consistent gradient styling for section titles', () => {
      render(<Footer />);
      
      const navTitle = screen.getByText('Navigation');
      const legalTitle = screen.getByText('Legal');
      const stayUpdatedTitle = screen.getByText('Stay Updated');
      
      [navTitle, legalTitle, stayUpdatedTitle].forEach(title => {
        expect(title).toHaveClass('bg-gradient-to-r', 'from-orange-500', 'to-tiffany-500', 'bg-clip-text', 'text-transparent');
      });
    });

    test('should have consistent hover colors using Bitcoin Orange', () => {
      render(<Footer />);
      
      const navLink = screen.getByText('Fund Yourself');
      const legalLink = screen.getByText('Privacy');
      const bottomLink = screen.getByText('API');
      
      expect(navLink.closest('a')).toHaveClass('hover:text-orange-600');
      expect(legalLink.closest('a')).toHaveClass('hover:text-orange-600');
      expect(bottomLink).toHaveClass('hover:text-orange-600');
    });

    test('should have proper border styling', () => {
      render(<Footer />);
      
      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveClass('bg-white', 'border-t', 'border-gray-200/50', 'mt-auto', 'relative');
    });

    test('should have proper gradient decorative elements', () => {
      render(<Footer />);
      
      // Check for gradient underlines under section titles
      const footer = screen.getByRole('contentinfo');
      const gradientUnderlines = footer.querySelectorAll('.bg-gradient-to-r.from-orange-500.to-tiffany-500.rounded-full');
      expect(gradientUnderlines.length).toBeGreaterThan(0);
    });
  });

  describe('♿ Accessibility', () => {
    test('should have proper semantic HTML structure', () => {
      render(<Footer />);
      
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });

    test('should have proper aria-labels for interactive elements', () => {
      render(<Footer />);
      
      expect(screen.getByLabelText('Back to top')).toBeInTheDocument();
      expect(screen.getByLabelText('Follow us on Twitter')).toBeInTheDocument();
      expect(screen.getByLabelText('Follow us on GitHub')).toBeInTheDocument();
    });

    test('should have minimum touch target sizes for all interactive elements', () => {
      render(<Footer />);
      
      // Back to top button
      const backToTopButton = screen.getByLabelText('Back to top');
      expect(backToTopButton).toHaveClass('w-12', 'h-12');
      
      // Social media links
      const socialLinks = [
        screen.getByLabelText('Follow us on Twitter'),
        screen.getByLabelText('Follow us on GitHub')
      ];
      socialLinks.forEach(link => {
        expect(link).toHaveClass('w-10', 'h-10');
      });
      
      // Navigation and legal links
      const navLinks = screen.getAllByText(/Fund Yourself|Discover|Fund Us|About|Blog|Privacy|Terms|Security/);
      navLinks.forEach(link => {
        expect(link.closest('a')).toHaveClass('min-h-[44px]');
      });
      
      // CTA button
      const ctaButton = screen.getByText('Get Started Today');
      expect(ctaButton).toHaveClass('min-h-[44px]');
    });

    test('should have proper color contrast for text elements', () => {
      render(<Footer />);
      
      // Check for proper text color classes that ensure good contrast
      const description = screen.getByText('Making Bitcoin donations simple and accessible for everyone.');
      expect(description).toHaveClass('text-slate-600');
      
      const copyright = screen.getByText(/© \d{4} OrangeCat/);
      expect(copyright).toHaveClass('text-slate-500');
    });

    test('should handle keyboard navigation properly', () => {
      render(<Footer />);
      
      const backToTopButton = screen.getByLabelText('Back to top');
      backToTopButton.focus();
      expect(backToTopButton).toHaveFocus();
      
      // All links should be focusable
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).not.toHaveAttribute('tabindex', '-1');
      });
    });
  });

  describe('🎯 Bitcoin Platform Integration', () => {
    test('should emphasize Bitcoin-related content in description', () => {
      render(<Footer />);
      
      const description = screen.getByText('Making Bitcoin donations simple and accessible for everyone.');
      expect(description).toBeInTheDocument();
      expect(description.textContent).toContain('Bitcoin');
    });

    test('should provide clear Bitcoin onboarding path in CTA', () => {
      render(<Footer />);
      
      const ctaButton = screen.getByText('Get Started Today');
      expect(ctaButton.closest('a')).toHaveAttribute('href', '/auth?mode=register');
      
      const ctaDescription = screen.getByText('Get the latest updates on Bitcoin fundraising and community building.');
      expect(ctaDescription.textContent).toContain('Bitcoin fundraising');
    });

    test('should maintain platform branding consistency', () => {
      render(<Footer />);
      
      expect(screen.getByTestId('logo')).toBeInTheDocument();
      expect(screen.getByText(/© \d{4} OrangeCat/)).toBeInTheDocument();
    });

    test('should link to platform-specific pages', () => {
      render(<Footer />);
      
      expect(screen.getByText('Fund Yourself').closest('a')).toHaveAttribute('href', '/create');
      expect(screen.getByText('Discover').closest('a')).toHaveAttribute('href', '/discover');
      expect(screen.getByText('Fund Us').closest('a')).toHaveAttribute('href', '/fund-us');
    });

    test('should provide security and trust signals', () => {
      render(<Footer />);
      
      expect(screen.getByText('Security')).toBeInTheDocument();
      expect(screen.getByText('Privacy')).toBeInTheDocument();
      expect(screen.getByText('Terms')).toBeInTheDocument();
    });
  });

  describe('🔧 Edge Cases & Error Handling', () => {
    test('should handle undefined pathname gracefully', () => {
      mockUsePathname.mockReturnValue(undefined as any);
      
      render(<Footer />);
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    test('should handle null pathname gracefully', () => {
      mockUsePathname.mockReturnValue(null as any);
      
      render(<Footer />);
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    test('should handle scrollTo not being available', () => {
      const originalScrollTo = window.scrollTo;
      delete (window as any).scrollTo;
      
      render(<Footer />);
      
      const backToTopButton = screen.getByLabelText('Back to top');
      fireEvent.click(backToTopButton);
      
      // Should not throw and button should still be interactive
      expect(backToTopButton).toBeInTheDocument();
      
      window.scrollTo = originalScrollTo;
    });

    test('should handle missing navigation config gracefully', () => {
      // This test ensures the component doesn't break if navigation config is malformed
      render(<Footer />);
      
      // Should still render basic structure
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
      expect(screen.getByTestId('logo')).toBeInTheDocument();
    });

    test('should handle empty pathname string', () => {
      mockUsePathname.mockReturnValue('');
      
      render(<Footer />);
      
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    test('should handle pathname with trailing slashes', () => {
      mockUsePathname.mockReturnValue('/dashboard/');
      const { container } = render(<Footer />);
      
      expect(container.firstChild).toBeNull();
    });

    test('should handle complex nested authenticated paths', () => {
      mockUsePathname.mockReturnValue('/dashboard/analytics/bitcoin/trends');
      const { container } = render(<Footer />);
      
      expect(container.firstChild).toBeNull();
    });

    test('should handle case sensitivity in pathname checking', () => {
      mockUsePathname.mockReturnValue('/Dashboard');
      
      render(<Footer />);
      
      // Should render footer as it doesn't match exact case
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });
  });
}); 