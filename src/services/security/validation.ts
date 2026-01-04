/**
 * Security Validation Schemas
 *
 * Input validation schemas with security focus using Zod.
 * Provides validation for common input types with security hardening.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Extracted from security-hardening.ts
 */

import { z } from 'zod';
import { XSSPrevention } from './xss';

/**
 * Input Validation Schemas with Security Focus
 */
export const SecuritySchemas = {
  // Email with strict validation
  email: z
    .string()
    .email('Invalid email format')
    .min(5, 'Email too short')
    .max(254, 'Email too long')
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid email format')
    .transform(email => email.toLowerCase().trim()),

  // Bitcoin address with enhanced validation
  bitcoinAddress: z
    .string()
    .min(26, 'Bitcoin address too short')
    .max(62, 'Bitcoin address too long')
    .regex(
      /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/,
      'Invalid Bitcoin address format'
    )
    .refine(address => {
      // Additional validation for known attack patterns
      const suspiciousPatterns = [
        /script/gi,
        /javascript/gi,
        /vbscript/gi,
        /<|>/gi,
        /\x00/gi, // Null bytes
      ];
      return !suspiciousPatterns.some(pattern => pattern.test(address));
    }, 'Bitcoin address contains invalid characters'),

  // Username with anti-impersonation
  username: z
    .string()
    .min(3, 'Username too short')
    .max(30, 'Username too long')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens'
    )
    .refine(username => {
      // Celebrity/brand impersonation prevention
      const reservedNames = [
        'admin',
        'administrator',
        'root',
        'system',
        'support',
        'help',
        'bitcoin',
        'satoshi',
        'nakamoto',
        'elon',
        'musk',
        'tesla',
        'apple',
        'google',
        'microsoft',
        'facebook',
        'twitter',
        'meta',
        'orangecat',
        'official',
        'verified',
        'staff',
        'team',
      ];
      return !reservedNames.includes(username.toLowerCase());
    }, 'Username is reserved or may cause impersonation')
    .transform(username => username.toLowerCase().trim()),

  // Bio/description with content filtering
  bio: z
    .string()
    .max(500, 'Bio too long')
    .refine(bio => {
      // Content filtering for spam/malicious content
      const suspiciousPatterns = [
        /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/gi, // URLs
        /\b(?:buy|sell|invest|profit|money|crypto|trading|forex)\b/gi, // Financial spam
        /<script|javascript:|vbscript:|data:/gi, // Script injection
        /\b(?:telegram|whatsapp|discord)\b.*@/gi, // Contact spam
      ];

      const suspiciousCount = suspiciousPatterns.reduce((count, pattern) => {
        return count + (pattern.test(bio) ? 1 : 0);
      }, 0);

      return suspiciousCount < 2; // Allow some flexibility but flag multiple patterns
    }, 'Bio contains suspicious content')
    .transform(bio => XSSPrevention.sanitizeText(bio)),
};


