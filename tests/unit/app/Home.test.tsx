/**
 * Home Page Tests
 *
 * Tests for the public home page client component.
 * HomePublicClient is a static component that renders sections.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock all dynamic imports to return simple divs
jest.mock('next/dynamic', () => {
  return function mockDynamic() {
    return function MockComponent() {
      return <div data-testid="dynamic-section" />;
    };
  };
});

// Mock the HeroSection component
jest.mock('@/components/home/sections/HeroSection', () => {
  return function MockHeroSection() {
    return (
      <section data-testid="hero-section">
        <h1>The Bitcoin Yellow Pages</h1>
        <p>Just like the yellow pages had phone numbers</p>
        <a href="/auth">Get Started Free</a>
      </section>
    );
  };
});

// Mock the useAuth hook (not used by HomePublicClient but might be used by children)
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    user: null,
    isLoading: false,
    hydrated: true,
  })),
}));

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
  redirect: jest.fn(),
}));

// Import after mocks are set up
import HomePublicClient from '@/components/home/HomePublicClient';

describe('HomePublicClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the home page with hero section', () => {
    render(<HomePublicClient />);

    // Check that the hero section is rendered
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
  });

  it('renders the main heading', () => {
    render(<HomePublicClient />);

    // Check for the main heading
    const heading = screen.getByRole('heading', { name: /the bitcoin yellow pages/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders the get started link', () => {
    render(<HomePublicClient />);

    // Check for the CTA link
    expect(screen.getByRole('link', { name: /get started free/i })).toBeInTheDocument();
  });

  it('renders dynamic sections with suspense fallback', () => {
    render(<HomePublicClient />);

    // Check that dynamic sections are present (mocked)
    const dynamicSections = screen.getAllByTestId('dynamic-section');
    expect(dynamicSections.length).toBeGreaterThan(0);
  });

  it('has a minimum height container', () => {
    const { container } = render(<HomePublicClient />);

    // The root div should have min-h-screen class
    const rootDiv = container.firstChild;
    expect(rootDiv).toHaveClass('min-h-screen');
  });
});
