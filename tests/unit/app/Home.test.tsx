/**
 * Home Page Tests
 *
 * Tests for the public home page. HomePublic renders every section directly
 * in the RSC tree (no next/dynamic) so the whole page is server-rendered —
 * these tests assert all sections are present in the initial render.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock the hero section (file is HeroSectionStatic, no separate HeroSection)
jest.mock('@/components/home/sections/HeroSectionStatic', () => {
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

// Mock the below-the-fold sections to keep the test focused on composition.
const mockSection = (testId: string) => {
  const MockSection = () => <div data-testid={testId} />;
  MockSection.displayName = `MockSection(${testId})`;
  return MockSection;
};
jest.mock('@/components/home/sections/WhatCanYouDoSection', () =>
  mockSection('what-can-you-do-section')
);
jest.mock('@/components/home/sections/ProofSection', () => mockSection('proof-section'));
jest.mock('@/components/home/sections/HowItWorksSection', () =>
  mockSection('how-it-works-section')
);
jest.mock('@/components/home/sections/TransparencySection', () =>
  mockSection('transparency-section')
);
jest.mock('@/components/home/sections/TrustSection', () => mockSection('trust-section'));

// Import after mocks are set up
import HomePublic from '@/components/home/HomePublic';

describe('HomePublic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the home page with hero section', () => {
    render(<HomePublic />);

    // Check that the hero section is rendered
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
  });

  it('renders the main heading', () => {
    render(<HomePublic />);

    // Check for the main heading
    const heading = screen.getByRole('heading', { name: /the bitcoin yellow pages/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders the get started link', () => {
    render(<HomePublic />);

    // Check for the CTA link
    expect(screen.getByRole('link', { name: /get started free/i })).toBeInTheDocument();
  });

  it('renders every below-the-fold section server-side (no lazy loading)', () => {
    render(<HomePublic />);

    for (const testId of [
      'what-can-you-do-section',
      'proof-section',
      'how-it-works-section',
      'transparency-section',
      'trust-section',
    ]) {
      expect(screen.getByTestId(testId)).toBeInTheDocument();
    }
  });

  it('has a minimum height container', () => {
    const { container } = render(<HomePublic />);

    // The root div should have min-h-screen class
    const rootDiv = container.firstChild;
    expect(rootDiv).toHaveClass('min-h-screen');
  });
});
