/**
 * INPUT SANITIZATION
 *
 * XSS prevention and input cleaning utilities.
 */

/**
 * Comprehensive input sanitization
 */
export class InputSanitizer {
  private static instance: InputSanitizer;

  static getInstance(): InputSanitizer {
    if (!InputSanitizer.instance) {
      InputSanitizer.instance = new InputSanitizer();
    }
    return InputSanitizer.instance;
  }

  /**
   * Sanitize HTML to prevent XSS
   */
  static sanitizeHtml(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Sanitize text input
   */
  static sanitizeText(input: string, maxLength: number = 1000): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    return input
      .replace(/<[^>]*>/g, '')
      .replace(/[<>]/g, '')
      .trim()
      .slice(0, maxLength);
  }

  /**
   * Sanitize Bitcoin address
   */
  static sanitizeBitcoinAddress(address: string): string {
    if (!address || typeof address !== 'string') {
      return '';
    }
    // Remove HTML tags first, then only allow valid Bitcoin address characters
    const cleaned = address.replace(/<[^>]*>/g, '').replace(/[^a-zA-Z0-9]/g, '');
    return cleaned.slice(0, 62);
  }

  /**
   * Sanitize username
   */
  static sanitizeUsername(username: string): string {
    if (!username || typeof username !== 'string') {
      return '';
    }
    // Remove HTML tags first, then sanitize for username
    const cleaned = username
      .replace(/<[^>]*>/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '');
    return cleaned.slice(0, 30);
  }

  /**
   * Sanitize email address
   */
  static sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      return '';
    }
    // Remove HTML tags first, then normalize email
    const cleaned = email
      .replace(/<[^>]*>/g, '')
      .toLowerCase()
      .trim();
    return cleaned.slice(0, 254);
  }

  /**
   * Sanitize URL
   */
  static sanitizeUrl(url: string): string {
    if (!url || typeof url !== 'string') {
      return '';
    }

    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return '';
      }
      return parsed.toString();
    } catch {
      return '';
    }
  }
}

export const inputSanitizer = InputSanitizer.getInstance();
