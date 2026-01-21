import { z } from 'zod';

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

/**
 * Schema for creating a document
 */
export const createDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  content: z.string().max(50000, 'Content must be 50,000 characters or less').optional().nullable(),
  document_type: documentTypeEnum.default('notes'),
  visibility: documentVisibilityEnum.default('cat_visible'),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;

/**
 * Schema for updating a document
 */
export const updateDocumentSchema = createDocumentSchema.partial();
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;

/**
 * Full document schema (includes server-generated fields)
 */
export const documentSchema = createDocumentSchema.extend({
  id: z.string().uuid(),
  actor_id: z.string().uuid(),
  file_url: z.string().url().optional().nullable(),
  file_type: z.string().optional().nullable(),
  file_size_bytes: z.number().int().positive().optional().nullable(),
  summary: z.string().optional().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Document = z.infer<typeof documentSchema>;

/**
 * Document type labels for UI
 */
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  goals: 'Goals & Aspirations',
  finances: 'Financial Info',
  skills: 'Skills & Expertise',
  notes: 'Notes',
  business_plan: 'Business Plan',
  other: 'Other',
};

/**
 * Document type descriptions for UI
 */
export const DOCUMENT_TYPE_DESCRIPTIONS: Record<DocumentType, string> = {
  goals: 'Your personal or professional goals that My Cat can help you achieve',
  finances: 'Financial context like budgets, expenses, income sources',
  skills: 'Your skills, expertise, and experience that My Cat should know about',
  notes: 'General notes and information',
  business_plan: 'Business plans, strategies, and ideas',
  other: "Other context that doesn't fit other categories",
};

/**
 * Document visibility labels for UI
 */
export const DOCUMENT_VISIBILITY_LABELS: Record<DocumentVisibility, string> = {
  private: 'Private',
  cat_visible: 'My Cat Only',
  public: 'Public',
};

/**
 * Document visibility descriptions for UI
 */
export const DOCUMENT_VISIBILITY_DESCRIPTIONS: Record<DocumentVisibility, string> = {
  private: 'Only you can see this. My Cat cannot access it.',
  cat_visible: 'My Cat can use this to give you personalized advice.',
  public: 'Anyone can see this on your profile.',
};
