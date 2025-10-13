/**
 * Custom Jest Matchers for OrangeCat
 * Extended matchers for better testing experience
 *
 * Created: 2025-09-24
 * Last Modified: 2025-09-24
 * Last Modified Summary: Custom Jest matchers for comprehensive testing
 */

import { expect } from '@jest/globals';

/**
 * Custom matcher to check if a value is a valid Bitcoin address
 */
expect.extend({
  toBeValidBitcoinAddress(received: string) {
    const bitcoinAddressRegex = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/;

    const pass = typeof received === 'string' && bitcoinAddressRegex.test(received);

    return {
      message: () => `expected ${received} to be a valid Bitcoin address`,
      pass
    };
  },

  /**
   * Custom matcher to check if a value is a valid email
   */
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const pass = typeof received === 'string' && emailRegex.test(received);

    return {
      message: () => `expected ${received} to be a valid email address`,
      pass
    };
  },

  /**
   * Custom matcher to check if a value is a valid UUID
   */
  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    const pass = typeof received === 'string' && uuidRegex.test(received);

    return {
      message: () => `expected ${received} to be a valid UUID`,
      pass
    };
  },

  /**
   * Custom matcher to check if a value is a valid URL
   */
  toBeValidUrl(received: string) {
    try {
      new URL(received);
      return {
        message: () => `expected ${received} to be a valid URL`,
        pass: true
      };
    } catch {
      return {
        message: () => `expected ${received} to be a valid URL`,
        pass: false
      };
    }
  },

  /**
   * Custom matcher to check if an object has required properties
   */
  toHaveRequiredProperties(received: any, requiredProps: string[]) {
    const missingProps = requiredProps.filter(prop => !(prop in received));

    const pass = missingProps.length === 0;

    return {
      message: () => `expected ${JSON.stringify(received)} to have required properties: ${requiredProps.join(', ')}${missingProps.length > 0 ? ` (missing: ${missingProps.join(', ')})` : ''}`,
      pass
    };
  },

  /**
   * Custom matcher to check if a string contains HTML
   */
  toContainHtml(received: string) {
    const htmlRegex = /<[^>]*>/;

    const pass = typeof received === 'string' && htmlRegex.test(received);

    return {
      message: () => `expected ${received} to contain HTML`,
      pass
    };
  },

  /**
   * Custom matcher to check if a string is sanitized (no dangerous HTML)
   */
  toBeSanitized(received: string) {
    const dangerousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>.*?<\/embed>/gi
    ];

    const hasDangerousContent = dangerousPatterns.some(pattern => pattern.test(received));

    const pass = !hasDangerousContent;

    return {
      message: () => `expected ${received} to be sanitized HTML`,
      pass
    };
  },

  /**
   * Custom matcher to check if a number is within a range
   */
  toBeWithinRange(received: number, min: number, max: number) {
    const pass = received >= min && received <= max;

    return {
      message: () => `expected ${received} to be within range ${min} - ${max}`,
      pass
    };
  },

  /**
   * Custom matcher to check if an array contains objects with specific properties
   */
  toContainObjectsWith(received: any[], requiredProps: string[]) {
    const pass = Array.isArray(received) && received.every(item =>
      typeof item === 'object' && item !== null &&
      requiredProps.every(prop => prop in item)
    );

    return {
      message: () => `expected ${JSON.stringify(received)} to contain objects with properties: ${requiredProps.join(', ')}`,
      pass
    };
  },

  /**
   * Custom matcher to check if a response is successful
   */
  toBeSuccessfulResponse(received: any) {
    const pass = received && typeof received === 'object' &&
                 'ok' in received && received.ok === true;

    return {
      message: () => `expected ${JSON.stringify(received)} to be a successful response`,
      pass
    };
  },

  /**
   * Custom matcher to check if an error response is properly formatted
   */
  toBeErrorResponse(received: any) {
    const pass = received && typeof received === 'object' &&
                 'error' in received && typeof received.error === 'string';

    return {
      message: () => `expected ${JSON.stringify(received)} to be a properly formatted error response`,
      pass
    };
  }
});

// Type declarations for TypeScript
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidBitcoinAddress(): R;
      toBeValidEmail(): R;
      toBeValidUUID(): R;
      toBeValidUrl(): R;
      toHaveRequiredProperties(props: string[]): R;
      toContainHtml(): R;
      toBeSanitized(): R;
      toBeWithinRange(min: number, max: number): R;
      toContainObjectsWith(props: string[]): R;
      toBeSuccessfulResponse(): R;
      toBeErrorResponse(): R;
    }
  }
}
