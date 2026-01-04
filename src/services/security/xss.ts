/**
 * XSS Prevention Module
 *
 * Provides comprehensive protection against Cross-Site Scripting (XSS) attacks
 * by sanitizing user input and encoding dangerous characters.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Extracted from security-hardening.ts
 */

/**
 * XSS Prevention - HTML Entity Encoding and Content Sanitization
 *
 * @example
 * ```typescript
 * const safeInput = XSSPrevention.sanitizeHTML('<script>alert("xss")</script>');
 * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 * ```
 */
export class XSSPrevention {
  private static readonly HTML_ENTITIES: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };

  /**
   * Sanitize HTML content by encoding dangerous characters
   * @param input - Raw HTML content to sanitize
   * @returns Sanitized string safe for HTML display
   */
  static sanitizeHTML(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    return input.replace(/[&<>"'`=\/]/g, match => {
      return this.HTML_ENTITIES[match] || match;
    });
  }

  /**
   * Sanitize input for use in HTML attributes with aggressive filtering
   * @param input - Raw input to sanitize for HTML attributes
   * @returns Sanitized string safe for HTML attributes
   */
  static sanitizeForAttribute(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // More aggressive sanitization for HTML attributes
    return input
      .replace(/[&<>"'`=\/\(\)\[\]{}]/g, match => {
        return this.HTML_ENTITIES[match] || '';
      })
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/data:/gi, '')
      .replace(/on\w+=/gi, '');
  }

  /**
   * Sanitize plain text content with length limits
   * @param input - Raw text to sanitize
   * @returns Sanitized text safe for display (max 1000 chars)
   */
  static sanitizeText(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    return input
      .replace(/[<>]/g, match => this.HTML_ENTITIES[match])
      .trim()
      .substring(0, 1000); // Limit length
  }
}


