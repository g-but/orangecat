/**
 * SECURITY VALIDATION SCHEMAS
 *
 * Zod schemas for secure input validation.
 */

import { z } from 'zod';

/**
 * Secure validation schemas using Zod
 */
export const SecuritySchemas = {
  // Profile validation
  profileData: z.object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be at most 30 characters')
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        'Username can only contain letters, numbers, underscores, and hyphens'
      ),

    name: z
      .string()
      .min(1, 'Display name is required')
      .max(50, 'Display name must be at most 50 characters'),

    bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),

    website: z.string().url('Website must be a valid URL').optional().or(z.literal('')),

    bitcoin_address: z
      .string()
      .regex(/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/, 'Invalid Bitcoin address format')
      .optional()
      .or(z.literal('')),

    lightning_address: z
      .string()
      .email('Lightning address must be a valid email format')
      .optional()
      .or(z.literal('')),
  }),

  // Campaign validation
  projectData: z.object({
    title: z
      .string()
      .min(5, 'Title must be at least 5 characters')
      .max(100, 'Title must be at most 100 characters'),

    description: z
      .string()
      .min(50, 'Description must be at least 50 characters')
      .max(5000, 'Description must be at most 5000 characters'),

    goal_amount: z
      .number()
      .min(1, 'Goal amount must be positive')
      .max(21_000_000, 'Goal amount too large') // Max BTC supply
      .optional(),

    category: z.enum(['technology', 'community', 'education', 'creative', 'health', 'environment']),

    tags: z.array(z.string().max(30)).max(10, 'Maximum 10 tags allowed').optional(),
  }),

  // Authentication validation
  authData: z.object({
    email: z
      .string()
      .email('Invalid email format')
      .min(5, 'Email too short')
      .max(254, 'Email too long'),

    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password too long')
      .regex(/[A-Z]/, 'Password must contain uppercase letter')
      .regex(/[a-z]/, 'Password must contain lowercase letter')
      .regex(/[0-9]/, 'Password must contain number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
  }),

  // File upload validation
  fileUpload: z.object({
    file: z.object({
      size: z.number().max(5 * 1024 * 1024, 'File size must be less than 5MB'),
      type: z.enum(['image/jpeg', 'image/png', 'image/webp']),
    }),
  }),

  // Search validation
  searchQuery: z.object({
    query: z
      .string()
      .min(1, 'Search query cannot be empty')
      .max(100, 'Search query too long')
      .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Search query contains invalid characters'),

    type: z.enum(['all', 'profiles', 'projects']),
    limit: z.number().min(1).max(50).default(20),
    offset: z.number().min(0).default(0),
  }),
};
