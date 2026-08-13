/**
 * Home page composition: hero plus the three first moves.
 * Long-form marketing sections live on /how-it-works, not here.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@/components/home/sections/HeroSectionStatic', () => {
  return function MockHeroSection() {
    return (
      <section data-testid="hero-section">
        <h1>Turn who you are into income.</h1>
        <a href="/auth">Meet your Cat</a>
      </section>
    );
  };
});

jest.mock('@/components/home/sections/FirstMoveSection', () => {
  return function MockFirstMoveSection() {
    return <div data-testid="first-move-section" />;
  };
});

import HomePublic from '@/components/home/HomePublic';

describe('HomePublic', () => {
  it('renders the hero and the three first moves', () => {
    render(<HomePublic />);
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    expect(screen.getByTestId('first-move-section')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /turn who you are into income/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /meet your cat/i })).toBeInTheDocument();
  });

  it('has a minimum height container', () => {
    const { container } = render(<HomePublic />);
    expect(container.firstChild).toHaveClass('min-h-screen');
  });
});
