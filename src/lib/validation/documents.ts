import { z } from 'zod';

// =============================================================================
// DOCUMENT VALIDATION (My Cat Context)
// =============================================================================

/**
 * Document visibility levels for My Cat context
 * - private: Only owner sees, My Cat cannot access
 * - cat_visible: My Cat can use as context for owner
 * - public: Anyone can see, My Cat can reference for any user
 */
export const documentVisibilityEnum = z.enum(['private', 'cat_visible', 'public']);
export type DocumentVisibility = z.infer<typeof documentVisibilityEnum>;

/**
 * Document types for categorization
 */
export const documentTypeEnum = z.enum([
  'goals', // Personal/professional goals
  'finances', // Financial information, budgets
  'skills', // Skills, expertise, experience
  'notes', // General notes
  'business_plan', // Business plans, strategies
  'other', // Uncategorized
]);
export type DocumentType = z.infer<typeof documentTypeEnum>;

export const documentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  content: z.string().max(50000, 'Content must be 50,000 characters or less').optional().nullable(),
  document_type: documentTypeEnum.default('notes'),
  visibility: documentVisibilityEnum.default('cat_visible'),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export type DocumentFormData = z.infer<typeof documentSchema>;
