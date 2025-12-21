/**
 * Button Component Tests
 * 
 * Testing core UI component used throughout the Bitcoin funding platform
 * Critical for user interaction, accessibility, and platform branding
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Button from '../Button';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

describe('🎨 Button Component - UI Foundation Tests', () => {
  describe('✅ Basic Rendering', () => {
    test('should render button with text', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    test('should render button with custom className', () => {
      render(<Button className="custom-class">Test</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    test('should have proper display name', () => {
      expect(Button.displayName).toBe('Button');
    });

    test('should render as Link when href is provided', () => {
      render(<Button href="/test">Link Button</Button>);
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/test');
    });
  });

  describe('🎨 Variant Styling - Platform Branding', () => {
    test('should apply primary variant (tiffany brand color)', () => {
      render(<Button variant="primary">Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-tiffany-600', 'text-white', 'hover:bg-tiffany-700');
    });

    test('should apply secondary variant styling', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gray-100', 'text-gray-900', 'hover:bg-gray-200');
    });

    test('should apply ghost variant styling', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-gray-100', 'text-gray-700');
    });

    test('should apply danger variant styling', () => {
      render(<Button variant="danger">Delete</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-600', 'text-white', 'hover:bg-red-700');
    });

    test('should apply outline variant styling', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border-2', 'border-gray-300', 'bg-transparent');
    });

    test('should apply gradient variant (Bitcoin orange to tiffany)', () => {
      render(<Button variant="gradient">Gradient</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gradient-to-r', 'from-tiffany-600', 'to-orange-600');
    });

    test('should default to primary variant', () => {
      render(<Button>Default</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-tiffany-600');
    });
  });

  describe('📏 Size Variants - Responsive Design', () => {
    test('should apply small size styling', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9', 'min-h-[36px]', 'px-4', 'text-sm', 'min-w-[80px]');
    });

    test('should apply medium size (default)', () => {
      render(<Button>Medium</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-11', 'min-h-[44px]', 'px-6', 'text-base', 'min-w-[100px]');
    });

    test('should apply large size styling', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-12', 'min-h-[48px]', 'px-8', 'text-lg', 'min-w-[120px]');
    });

    test('should apply extra large size styling', () => {
      render(<Button size="xl">Extra Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-14', 'min-h-[56px]', 'px-10', 'text-xl', 'min-w-[140px]');
    });
  });

  describe('🔄 Loading State - UX Enhancement', () => {
    test('should show loading spinner when isLoading is true', () => {
      render(<Button isLoading>Submit</Button>);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      // Check for spinner animation class
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    test('should disable button when loading', () => {
      render(<Button isLoading>Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    test('should not show loading text when not loading', () => {
      render(<Button>Submit</Button>);
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    test('should display original content when not loading', () => {
      render(<Button>Submit Form</Button>);
      expect(screen.getByText('Submit Form')).toBeInTheDocument();
    });
  });

  describe('🔄 Interactive States - User Experience', () => {
    test('should handle click events', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
    });

    test('should not call onClick when disabled', () => {
      const handleClick = jest.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    test('should have transform and hover effects', () => {
      render(<Button>Hover me</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('transform', 'hover:scale-102', 'active:scale-95');
    });

    test('should have transition effects', () => {
      render(<Button>Animated</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('transition-all', 'duration-300');
    });
  });

  describe('♿ Accessibility - Platform Standards', () => {
    test('should have proper button role', () => {
      render(<Button>Accessible</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('should support focus management', () => {
      render(<Button>Focusable</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      expect(button).toHaveFocus();
      expect(button).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2');
    });

    test('should support aria attributes', () => {
      render(<Button aria-label="Custom label" aria-describedby="desc">Icon</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Custom label');
      expect(button).toHaveAttribute('aria-describedby', 'desc');
    });

    test('should have touch-friendly design', () => {
      render(<Button>Touch</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('touch-manipulation', 'select-none');
    });

    test('should have proper minimum touch target size', () => {
      render(<Button size="sm">Small Touch</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('min-h-[36px]', 'min-w-[80px]');
    });
  });

  describe('🔗 Link Functionality - Navigation', () => {
    test('should render as link with href', () => {
      render(<Button href="/dashboard">Go to Dashboard</Button>);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/dashboard');
      expect(link).toHaveTextContent('Go to Dashboard');
    });

    test('should apply styles to link variant', () => {
      render(<Button href="/test" variant="primary">Link</Button>);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('bg-tiffany-600', 'text-white');
    });

    test('should support loading state in link mode', () => {
      render(<Button href="/test" isLoading>Loading Link</Button>);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('💼 Real-world Bitcoin Platform Scenarios', () => {
    test('should work as Bitcoin donation button', () => {
      const handleDonate = jest.fn();
      render(
        <Button 
          onClick={handleDonate}
          variant="gradient"
          size="lg"
        >
          ₿ Donate Bitcoin
        </Button>
      );
      
      const button = screen.getByRole('button', { name: '₿ Donate Bitcoin' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-gradient-to-r', 'from-tiffany-600', 'to-orange-600');
      
      fireEvent.click(button);
      expect(handleDonate).toHaveBeenCalled();
    });

    test('should work as campaign creation button', () => {
      const handleCreate = jest.fn();
      render(
        <Button 
          onClick={handleCreate}
          variant="primary"
          size="xl"
        >
          Create Campaign
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-14', 'min-h-[56px]', 'bg-tiffany-600');
      
      fireEvent.click(button);
      expect(handleCreate).toHaveBeenCalled();
    });

    test('should work as form submission with loading', () => {
      const { rerender } = render(
        <Button type="submit" variant="primary">
          Submit Campaign
        </Button>
      );
      
      expect(screen.getByText('Submit Campaign')).toBeInTheDocument();
      
      rerender(
        <Button type="submit" variant="primary" isLoading>
          Submit Campaign
        </Button>
      );
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });

    test('should work as danger action (delete campaign)', () => {
      const handleDelete = jest.fn();
      render(
        <Button 
          onClick={handleDelete}
          variant="danger"
          size="sm"
        >
          Delete Campaign
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-600', 'text-white');
      
      fireEvent.click(button);
      expect(handleDelete).toHaveBeenCalled();
    });

    test('should work as navigation link to campaign page', () => {
      render(
        <Button 
          href="/campaign/123"
          variant="outline"
        >
          View Campaign
        </Button>
      );
      
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/campaign/123');
      expect(link).toHaveClass('border-2', 'border-gray-300');
    });
  });

  describe('🎨 Custom Styling & Integration', () => {
    test('should merge custom classes properly', () => {
      render(
        <Button 
          className="custom-margin bg-purple-500" 
          variant="primary"
        >
          Custom
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-margin', 'bg-purple-500');
    });

    test('should support style prop', () => {
      render(
        <Button style={{ backgroundColor: 'red', fontSize: '20px' }}>
          Styled
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ 
        backgroundColor: 'red',
        fontSize: '20px'
      });
    });

    test('should support all standard button attributes', () => {
      render(
        <Button 
          type="submit"
          name="submitBtn"
          value="submit"
          data-testid="submit-button"
        >
          Submit
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('name', 'submitBtn');
      expect(button).toHaveAttribute('value', 'submit');
      expect(button).toHaveAttribute('data-testid', 'submit-button');
    });
  });
}); 