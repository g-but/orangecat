/**
 * Input Component Tests
 * 
 * Testing critical form input component used throughout the Bitcoin platform
 * Essential for user authentication, donations, and campaign creation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Mail, Lock, Bitcoin, User, Search } from 'lucide-react';
import Input from '../Input';

describe('🎨 Input Component - Form Foundation Tests', () => {
  describe('✅ Basic Rendering', () => {
    test('should render input field successfully', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    test('should render with label when provided', () => {
      render(<Input label="Email Address" placeholder="Enter email" />);
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByText('Email Address')).toBeInTheDocument();
    });

    test('should render without label when not provided', () => {
      render(<Input placeholder="No label input" />);
      expect(screen.getByPlaceholderText('No label input')).toBeInTheDocument();
      // Should not have any label elements
      expect(screen.queryByText('label')).not.toBeInTheDocument();
    });

    test('should apply custom className', () => {
      render(<Input placeholder="Custom class" className="custom-input" />);
      const input = screen.getByPlaceholderText('Custom class');
      expect(input).toHaveClass('custom-input');
    });

    test('should forward ref correctly', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} placeholder="Ref test" />);
      expect(ref.current).toBeDefined();
      expect(ref.current?.tagName).toBe('INPUT');
    });
  });

  describe('🔐 Input Types & Validation', () => {
    test('should handle email input type', () => {
      render(<Input type="email" placeholder="Enter email" />);
      const input = screen.getByPlaceholderText('Enter email');
      expect(input).toHaveAttribute('type', 'email');
    });

    test('should handle password input type', () => {
      render(<Input type="password" placeholder="Enter password" />);
      const input = screen.getByPlaceholderText('Enter password');
      expect(input).toHaveAttribute('type', 'password');
    });

    test('should handle number input type for Bitcoin amounts', () => {
      render(<Input type="number" placeholder="Enter amount" min="0" step="0.00000001" />);
      const input = screen.getByPlaceholderText('Enter amount');
      expect(input).toHaveAttribute('type', 'number');
      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveAttribute('step', '0.00000001');
    });

    test('should handle text input with pattern validation', () => {
      const bitcoinAddressPattern = '^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,87}$';
      render(<Input type="text" pattern={bitcoinAddressPattern} placeholder="Bitcoin address" />);
      const input = screen.getByPlaceholderText('Bitcoin address');
      expect(input).toHaveAttribute('pattern', bitcoinAddressPattern);
    });

    test('should handle required fields', () => {
      render(<Input required placeholder="Required field" />);
      const input = screen.getByPlaceholderText('Required field');
      expect(input).toHaveAttribute('required');
    });

    test('should handle disabled state', () => {
      render(<Input disabled placeholder="Disabled input" />);
      const input = screen.getByPlaceholderText('Disabled input');
      expect(input).toBeDisabled();
    });

    test('should handle readonly state', () => {
      render(<Input readOnly value="Read only value" />);
      const input = screen.getByDisplayValue('Read only value');
      expect(input).toHaveAttribute('readonly');
    });
  });

  describe('🔍 Icon Integration', () => {
    test('should render with email icon', () => {
      render(<Input icon={Mail} placeholder="Email with icon" />);
      expect(screen.getByTestId('icon-mail')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email with icon')).toBeInTheDocument();
    });

    test('should render with lock icon for password', () => {
      render(<Input icon={Lock} type="password" placeholder="Password with icon" />);
      expect(screen.getByTestId('icon-lock')).toBeInTheDocument();
    });

    test('should render with Bitcoin icon for Bitcoin fields', () => {
      render(<Input icon={Bitcoin} placeholder="Bitcoin amount" />);
      expect(screen.getByTestId('icon-bitcoin')).toBeInTheDocument();
    });

    test('should render with user icon for profile fields', () => {
      render(<Input icon={User} placeholder="Username" />);
      expect(screen.getByTestId('icon-user')).toBeInTheDocument();
    });

    test('should render with search icon for search fields', () => {
      render(<Input icon={Search} placeholder="Search campaigns" />);
      expect(screen.getByTestId('icon-search')).toBeInTheDocument();
    });

    test('should adjust padding when icon is present', () => {
      render(<Input icon={Mail} placeholder="With icon padding" />);
      const input = screen.getByPlaceholderText('With icon padding');
      expect(input).toHaveClass('pl-10');
    });

    test('should not have icon padding when no icon', () => {
      render(<Input placeholder="No icon padding" />);
      const input = screen.getByPlaceholderText('No icon padding');
      expect(input).not.toHaveClass('pl-10');
    });
  });

  describe('🎮 User Interactions', () => {
    test('should handle typing in input field', async () => {
      const user = userEvent.setup();
      render(<Input placeholder="Type here" />);
      const input = screen.getByPlaceholderText('Type here');
      
      await user.type(input, 'Hello Bitcoin!');
      expect(input).toHaveValue('Hello Bitcoin!');
    });

    test('should handle focus and blur events', async () => {
      const user = userEvent.setup();
      const onFocus = jest.fn();
      const onBlur = jest.fn();
      
      render(<Input onFocus={onFocus} onBlur={onBlur} placeholder="Focus test" />);
      const input = screen.getByPlaceholderText('Focus test');
      
      await user.click(input);
      expect(onFocus).toHaveBeenCalledTimes(1);
      
      await user.tab(); // Move focus away
      expect(onBlur).toHaveBeenCalledTimes(1);
    });

    test('should handle onChange events', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      
      render(<Input onChange={onChange} placeholder="Change test" />);
      const input = screen.getByPlaceholderText('Change test');
      
      await user.type(input, 'test');
      expect(onChange).toHaveBeenCalledTimes(4); // One call per character
    });

    test('should handle controlled input', async () => {
      const user = userEvent.setup();
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <Input 
            value={value} 
            onChange={(e) => setValue(e.target.value)} 
            placeholder="Controlled input" 
          />
        );
      };
      
      render(<TestComponent />);
      const input = screen.getByPlaceholderText('Controlled input');
      
      await user.type(input, 'controlled');
      expect(input).toHaveValue('controlled');
    });

    test('should handle clear input', async () => {
      const user = userEvent.setup();
      render(<Input defaultValue="Initial value" placeholder="Clear test" />);
      const input = screen.getByPlaceholderText('Clear test');
      
      expect(input).toHaveValue('Initial value');
      await user.clear(input);
      expect(input).toHaveValue('');
    });
  });

  describe('💰 Bitcoin Platform Specific Tests', () => {
    test('should handle Bitcoin address input', async () => {
      const user = userEvent.setup();
      render(
        <Input 
          icon={Bitcoin} 
          placeholder="Enter Bitcoin address" 
          pattern="^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,87}$"
          label="Bitcoin Address"
        />
      );
      
      const input = screen.getByLabelText('Bitcoin Address');
      const validAddress = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
      
      await user.type(input, validAddress);
      expect(input).toHaveValue(validAddress);
    });

    test('should handle satoshi amount input', async () => {
      const user = userEvent.setup();
      render(
        <Input 
          type="number"
          min="1"
          max="2100000000000000"
          step="1"
          placeholder="Amount in satoshis"
          label="Donation Amount (sats)"
        />
      );
      
      const input = screen.getByLabelText('Donation Amount (sats)');
      await user.type(input, '100000');
      expect(input).toHaveValue(100000);
    });

    test('should handle campaign title input', async () => {
      const user = userEvent.setup();
      render(
        <Input 
          maxLength={100}
          placeholder="Enter campaign title"
          label="Campaign Title"
          required
        />
      );
      
      const input = screen.getByLabelText('Campaign Title');
      await user.type(input, 'Bitcoin Education Initiative');
      expect(input).toHaveValue('Bitcoin Education Initiative');
      expect(input).toHaveAttribute('maxLength', '100');
    });

    test('should handle email registration input', async () => {
      const user = userEvent.setup();
      render(
        <Input 
          type="email"
          icon={Mail}
          placeholder="Enter your email"
          label="Email Address"
          required
        />
      );
      
      const input = screen.getByLabelText('Email Address');
      await user.type(input, 'bitcoiner@example.com');
      expect(input).toHaveValue('bitcoiner@example.com');
    });

    test('should handle password input with visibility toggle simulation', async () => {
      const user = userEvent.setup();
      const TestComponent = () => {
        const [showPassword, setShowPassword] = React.useState(false);
        return (
          <div>
            <Input 
              type={showPassword ? 'text' : 'password'}
              icon={Lock}
              placeholder="Enter password"
              label="Password"
            />
            <button onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        );
      };
      
      render(<TestComponent />);
      const input = screen.getByLabelText('Password');
      const toggleButton = screen.getByText('Show');
      
      await user.type(input, 'mySecurePassword123!');
      expect(input).toHaveAttribute('type', 'password');
      
      await user.click(toggleButton);
      expect(input).toHaveAttribute('type', 'text');
    });
  });

  describe('🎨 Styling & Accessibility', () => {
    test('should have proper focus styles', () => {
      render(<Input placeholder="Focus styles test" />);
      const input = screen.getByPlaceholderText('Focus styles test');
      expect(input).toHaveClass('focus:border-tiffany-500', 'focus:ring-tiffany-500');
    });

    test('should have proper base styling', () => {
      render(<Input placeholder="Base styles test" />);
      const input = screen.getByPlaceholderText('Base styles test');
      expect(input).toHaveClass('block', 'w-full', 'rounded-md', 'border-gray-300', 'shadow-sm');
    });

    test('should be accessible with proper label association', () => {
      render(<Input label="Accessible Input" placeholder="Test accessibility" />);
      const input = screen.getByLabelText('Accessible Input');
      expect(input).toBeInTheDocument();
    });

    test('should support aria attributes', () => {
      render(
        <Input 
          placeholder="ARIA test"
          aria-describedby="help-text"
          aria-invalid="true"
        />
      );
      const input = screen.getByPlaceholderText('ARIA test');
      expect(input).toHaveAttribute('aria-describedby', 'help-text');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    test('should handle long labels gracefully', () => {
      const longLabel = 'This is a very long label that might wrap to multiple lines in the UI';
      render(<Input label={longLabel} placeholder="Long label test" />);
      expect(screen.getByText(longLabel)).toBeInTheDocument();
      expect(screen.getByLabelText(longLabel)).toBeInTheDocument();
    });
  });

  describe('🔧 Edge Cases & Error Handling', () => {
    test('should handle empty props gracefully', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    test('should handle undefined values', () => {
      render(<Input value={undefined} placeholder="Undefined value" />);
      const input = screen.getByPlaceholderText('Undefined value');
      expect(input).toBeInTheDocument();
    });

    test('should handle null icon gracefully', () => {
      render(<Input icon={undefined} placeholder="No icon" />);
      const input = screen.getByPlaceholderText('No icon');
      expect(input).toBeInTheDocument();
      expect(input).not.toHaveClass('pl-10');
    });

    test('should handle special characters in input', async () => {
      const user = userEvent.setup();
      render(<Input placeholder="Special chars test" />);
      const input = screen.getByPlaceholderText('Special chars test');
      
      const specialText = '₿ 💰 🚀 !@#$%^&*()';
      await user.type(input, specialText);
      expect(input).toHaveValue(specialText);
    });

    test('should handle long input values', async () => {
      const user = userEvent.setup();
      render(<Input placeholder="Long input test" />);
      const input = screen.getByPlaceholderText('Long input test');
      
      const longText = 'a'.repeat(100); // Reduced size for performance
      await user.type(input, longText);
      expect(input).toHaveValue(longText);
    });

    test('should handle rapid typing', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<Input onChange={onChange} placeholder="Rapid typing test" />);
      const input = screen.getByPlaceholderText('Rapid typing test');
      
      // Simulate typing without delay option
      await user.type(input, 'rapid');
      expect(input).toHaveValue('rapid');
      expect(onChange).toHaveBeenCalledTimes(5);
    });
  });

  describe('🔒 Security & Validation Edge Cases', () => {
    test('should prevent XSS in placeholder', () => {
      const maliciousPlaceholder = '<script>alert("xss")</script>';
      render(<Input placeholder={maliciousPlaceholder} />);
      const input = screen.getByPlaceholderText(maliciousPlaceholder);
      expect(input).toBeInTheDocument();
      // Placeholder should be treated as text, not executed
    });

    test('should prevent XSS in label', () => {
      const maliciousLabel = '<img src=x onerror=alert("xss")>';
      render(<Input label={maliciousLabel} placeholder="XSS test" />);
      expect(screen.getByText(maliciousLabel)).toBeInTheDocument();
      // Label should be treated as text
    });

    test('should handle paste events with large content', async () => {
      const user = userEvent.setup();
      render(<Input placeholder="Paste test" />);
      const input = screen.getByPlaceholderText('Paste test');
      
      const largeContent = 'x'.repeat(100); // Reduced size for performance
      await user.click(input);
      await user.paste(largeContent);
      expect(input).toHaveValue(largeContent);
    });
  });
}); 