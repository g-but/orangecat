/**
 * Card Component Tests
 * 
 * Testing critical card component used throughout the Bitcoin platform
 * Essential for displaying campaigns, transactions, and user information
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

describe('🎴 Card Component Suite - UI Foundation Tests', () => {
  describe('✅ Card Base Component', () => {
    test('should render card with children successfully', () => {
      render(
        <Card>
          <div>Test card content</div>
        </Card>
      );
      expect(screen.getByText('Test card content')).toBeInTheDocument();
    });

    test('should apply default variant styles', () => {
      render(<Card data-testid="card">Default card</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bg-white', 'rounded-2xl', 'border', 'border-gray-100', 'shadow-sm');
    });

    test('should apply elevated variant styles', () => {
      render(<Card variant="elevated" data-testid="card">Elevated card</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bg-white', 'rounded-2xl', 'border-0', 'shadow-lg');
    });

    test('should apply minimal variant styles', () => {
      render(<Card variant="minimal" data-testid="card">Minimal card</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bg-white', 'rounded-xl', 'border', 'border-gray-100');
    });

    test('should apply gradient variant styles', () => {
      render(<Card variant="gradient" data-testid="card">Gradient card</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bg-gradient-to-br', 'from-white', 'via-gray-50', 'to-gray-100');
    });

    test('should include interactive hover/transition styles', () => {
      render(<Card data-testid="card">Interactive card</Card>);
      const card = screen.getByTestId('card');
      // Card uses hover shadow and smooth transitions for interactivity
      expect(card).toHaveClass('hover:shadow-lg', 'transition-all', 'duration-300');
    });

    test('should apply custom className', () => {
      render(<Card className="custom-card-class" data-testid="card">Custom card</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-card-class');
    });

    test('should spread additional props', () => {
      render(<Card data-testid="card" role="article" aria-label="Test card">Card with props</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('role', 'article');
      expect(card).toHaveAttribute('aria-label', 'Test card');
    });

    test('should handle click events', () => {
      const handleClick = jest.fn();
      render(<Card onClick={handleClick} data-testid="card">Clickable card</Card>);
      const card = screen.getByTestId('card');
      
      fireEvent.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('should render as div element', () => {
      render(<Card data-testid="card">Card element test</Card>);
      const card = screen.getByTestId('card');
      expect(card.tagName).toBe('DIV');
    });
  });

  describe('📋 CardHeader Component', () => {
    test('should render header with children', () => {
      render(
        <CardHeader>
          <span>Header content</span>
        </CardHeader>
      );
      expect(screen.getByText('Header content')).toBeInTheDocument();
    });

    test('should apply default padding styles', () => {
      render(<CardHeader data-testid="header">Header test</CardHeader>);
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('p-6');
    });

    test('should apply custom className', () => {
      render(<CardHeader className="custom-header" data-testid="header">Custom header</CardHeader>);
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('custom-header', 'p-6');
    });

    test('should spread additional props', () => {
      render(<CardHeader data-testid="header" role="banner">Header with props</CardHeader>);
      const header = screen.getByTestId('header');
      expect(header).toHaveAttribute('role', 'banner');
    });

    test('should render as div element', () => {
      render(<CardHeader data-testid="header">Header element test</CardHeader>);
      const header = screen.getByTestId('header');
      expect(header.tagName).toBe('DIV');
    });
  });

  describe('🏷️ CardTitle Component', () => {
    test('should render title with children', () => {
      render(
        <CardTitle>Bitcoin Campaign Title</CardTitle>
      );
      expect(screen.getByText('Bitcoin Campaign Title')).toBeInTheDocument();
    });

    test('should apply title styles', () => {
      render(<CardTitle data-testid="title">Title test</CardTitle>);
      const title = screen.getByTestId('title');
      expect(title).toHaveClass('text-lg', 'font-semibold', 'leading-tight', 'text-gray-900');
    });

    test('should apply custom className', () => {
      render(<CardTitle className="custom-title" data-testid="title">Custom title</CardTitle>);
      const title = screen.getByTestId('title');
      expect(title).toHaveClass('custom-title', 'text-lg', 'font-semibold');
    });

    test('should spread additional props', () => {
      render(<CardTitle data-testid="title" id="main-title">Title with props</CardTitle>);
      const title = screen.getByTestId('title');
      expect(title).toHaveAttribute('id', 'main-title');
    });

    test('should render as h3 element', () => {
      render(<CardTitle data-testid="title">Title element test</CardTitle>);
      const title = screen.getByTestId('title');
      expect(title.tagName).toBe('H3');
    });

    test('should be accessible with proper heading level', () => {
      render(<CardTitle>Campaign Title</CardTitle>);
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('Campaign Title');
    });
  });

  describe('📝 CardDescription Component', () => {
    test('should render description with children', () => {
      render(
        <CardDescription>This is a Bitcoin fundraising campaign description</CardDescription>
      );
      expect(screen.getByText('This is a Bitcoin fundraising campaign description')).toBeInTheDocument();
    });

    test('should apply description styles', () => {
      render(<CardDescription data-testid="description">Description test</CardDescription>);
      const description = screen.getByTestId('description');
      expect(description).toHaveClass('text-sm', 'text-gray-600', 'leading-relaxed', 'mt-1');
    });

    test('should apply custom className', () => {
      render(<CardDescription className="custom-description" data-testid="description">Custom description</CardDescription>);
      const description = screen.getByTestId('description');
      expect(description).toHaveClass('custom-description', 'text-sm', 'text-gray-600');
    });

    test('should spread additional props', () => {
      render(<CardDescription data-testid="description" aria-label="Campaign description">Description with props</CardDescription>);
      const description = screen.getByTestId('description');
      expect(description).toHaveAttribute('aria-label', 'Campaign description');
    });

    test('should render as p element', () => {
      render(<CardDescription data-testid="description">Description element test</CardDescription>);
      const description = screen.getByTestId('description');
      expect(description.tagName).toBe('P');
    });
  });

  describe('📄 CardContent Component', () => {
    test('should render content with children', () => {
      render(
        <CardContent>
          <div>Campaign details and donation info</div>
        </CardContent>
      );
      expect(screen.getByText('Campaign details and donation info')).toBeInTheDocument();
    });

    test('should apply content padding styles', () => {
      render(<CardContent data-testid="content">Content test</CardContent>);
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('p-6', 'pt-0');
    });

    test('should apply custom className', () => {
      render(<CardContent className="custom-content" data-testid="content">Custom content</CardContent>);
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('custom-content', 'p-6', 'pt-0');
    });

    test('should spread additional props', () => {
      render(<CardContent data-testid="content" role="main">Content with props</CardContent>);
      const content = screen.getByTestId('content');
      expect(content).toHaveAttribute('role', 'main');
    });

    test('should render as div element', () => {
      render(<CardContent data-testid="content">Content element test</CardContent>);
      const content = screen.getByTestId('content');
      expect(content.tagName).toBe('DIV');
    });
  });

  describe('🚀 Bitcoin Platform Integration Tests', () => {
    test('should create a complete campaign card structure', () => {
      render(
        <Card variant="elevated" data-testid="campaign-card">
          <CardHeader>
            <CardTitle>Bitcoin Education Initiative</CardTitle>
            <CardDescription>Supporting Bitcoin education worldwide</CardDescription>
          </CardHeader>
          <CardContent>
            <div>Target: 1 BTC</div>
            <div>Raised: 0.5 BTC</div>
          </CardContent>
        </Card>
      );

      expect(screen.getByTestId('campaign-card')).toBeInTheDocument();
      expect(screen.getByText('Bitcoin Education Initiative')).toBeInTheDocument();
      expect(screen.getByText('Supporting Bitcoin education worldwide')).toBeInTheDocument();
      expect(screen.getByText('Target: 1 BTC')).toBeInTheDocument();
      expect(screen.getByText('Raised: 0.5 BTC')).toBeInTheDocument();
    });

    test('should create a transaction card structure', () => {
      render(
        <Card variant="minimal" data-testid="transaction-card">
          <CardHeader>
            <CardTitle>Transaction #1234</CardTitle>
            <CardDescription>Bitcoin payment confirmation</CardDescription>
          </CardHeader>
          <CardContent>
            <div>Amount: 0.001 BTC</div>
            <div>Status: Confirmed</div>
            <div>Confirmations: 6/6</div>
          </CardContent>
        </Card>
      );

      const card = screen.getByTestId('transaction-card');
      expect(card).toHaveClass('bg-white', 'rounded-xl', 'border');
      expect(screen.getByText('Transaction #1234')).toBeInTheDocument();
      expect(screen.getByText('Amount: 0.001 BTC')).toBeInTheDocument();
      expect(screen.getByText('Status: Confirmed')).toBeInTheDocument();
    });

    test('should create a user profile card', () => {
      render(
        <Card variant="gradient" data-testid="profile-card">
          <CardHeader>
            <CardTitle>Satoshi Nakamoto</CardTitle>
            <CardDescription>Bitcoin Creator</CardDescription>
          </CardHeader>
          <CardContent>
            <div>Transparency Score: 95%</div>
            <div>Campaigns Created: 5</div>
            <div>Total Raised: 10.5 BTC</div>
          </CardContent>
        </Card>
      );

      const card = screen.getByTestId('profile-card');
      expect(card).toHaveClass('bg-gradient-to-br');
      expect(screen.getByText('Satoshi Nakamoto')).toBeInTheDocument();
      expect(screen.getByText('Transparency Score: 95%')).toBeInTheDocument();
    });

    test('should handle interactive card with Bitcoin amount', () => {
      const handleCardClick = jest.fn();
      render(
        <Card onClick={handleCardClick} data-testid="interactive-card">
          <CardHeader>
            <CardTitle>Donation Card</CardTitle>
          </CardHeader>
          <CardContent>
            <div>Click to donate 0.01 BTC</div>
          </CardContent>
        </Card>
      );

      const card = screen.getByTestId('interactive-card');
      fireEvent.click(card);
      expect(handleCardClick).toHaveBeenCalledTimes(1);
    });

    test('should display lightning network info card', () => {
      render(
        <Card variant="elevated" data-testid="lightning-card">
          <CardHeader>
            <CardTitle>⚡ Lightning Payment</CardTitle>
            <CardDescription>Instant Bitcoin transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div>Fee: 1 satoshi</div>
            <div>Speed: Instant</div>
            <div>Network: Lightning</div>
          </CardContent>
        </Card>
      );

      expect(screen.getByText('⚡ Lightning Payment')).toBeInTheDocument();
      expect(screen.getByText('Fee: 1 satoshi')).toBeInTheDocument();
      expect(screen.getByText('Speed: Instant')).toBeInTheDocument();
    });
  });

  describe('🎨 Styling & Accessibility Tests', () => {
    test('should have proper hover and transition styles', () => {
      render(<Card data-testid="card">Transition test</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('hover:shadow-lg', 'transition-all', 'duration-300');
    });

    test('should be keyboard navigable when interactive', () => {
      const handleClick = jest.fn();
      const handleKeyDown = jest.fn();
      
      render(
        <Card 
          onClick={handleClick} 
          onKeyDown={handleKeyDown}
          tabIndex={0}
          data-testid="keyboard-card"
        >
          Keyboard accessible card
        </Card>
      );

      const card = screen.getByTestId('keyboard-card');
      expect(card).toHaveAttribute('tabIndex', '0');
      
      fireEvent.keyDown(card, { key: 'Enter' });
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
    });

    test('should maintain semantic structure', () => {
      render(
        <Card role="article" aria-labelledby="card-title" data-testid="semantic-card">
          <CardHeader>
            <CardTitle id="card-title">Semantic Card Title</CardTitle>
            <CardDescription>This card follows semantic HTML principles</CardDescription>
          </CardHeader>
          <CardContent>
            <div>Card content here</div>
          </CardContent>
        </Card>
      );

      const card = screen.getByTestId('semantic-card');
      expect(card).toHaveAttribute('role', 'article');
      expect(card).toHaveAttribute('aria-labelledby', 'card-title');
      
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveAttribute('id', 'card-title');
    });

    test('should handle empty content gracefully', () => {
      render(
        <Card data-testid="empty-card">
          <CardHeader>
            <CardTitle></CardTitle>
            <CardDescription></CardDescription>
          </CardHeader>
          <CardContent></CardContent>
        </Card>
      );

      const card = screen.getByTestId('empty-card');
      expect(card).toBeInTheDocument();
    });

    test('should work with complex nested content', () => {
      render(
        <Card data-testid="complex-card">
          <CardHeader>
            <CardTitle>
              Complex <strong>Bitcoin</strong> Campaign
            </CardTitle>
            <CardDescription>
              With <em>formatting</em> and <span>nested elements</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <ul>
                <li>Item 1</li>
                <li>Item 2</li>
              </ul>
              <button>Action Button</button>
            </div>
          </CardContent>
        </Card>
      );

      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
      expect(screen.getByText('formatting')).toBeInTheDocument();
      expect(screen.getByText('Action Button')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('🔧 Edge Cases & Error Handling', () => {
    test('should handle undefined variant gracefully', () => {
      render(<Card variant={undefined as any} data-testid="card">Undefined variant</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bg-white', 'rounded-2xl'); // Should fallback to default
    });

    test('should handle invalid variant gracefully', () => {
      render(<Card variant={'invalid' as any} data-testid="card">Invalid variant</Card>);
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument(); // Should still render
    });

    test('should handle very long content', () => {
      const longText = 'a'.repeat(1000);
      render(
        <Card data-testid="long-content-card">
          <CardHeader>
            <CardTitle>{longText}</CardTitle>
          </CardHeader>
        </Card>
      );

      expect(screen.getByTestId('long-content-card')).toBeInTheDocument();
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    test('should handle special characters in content', () => {
      const specialContent = '₿ 💰 🚀 !@#$%^&*()';
      render(
        <Card>
          <CardTitle>{specialContent}</CardTitle>
        </Card>
      );

      expect(screen.getByText(specialContent)).toBeInTheDocument();
    });

    test('should not break with null children', () => {
      render(
        <Card data-testid="null-children-card">
          {null}
        </Card>
      );

      expect(screen.getByTestId('null-children-card')).toBeInTheDocument();
    });
  });
}); 