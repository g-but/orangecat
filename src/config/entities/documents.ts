/**
 * DOCUMENT ENTITY CONFIGURATION (LIST)
 *
 * Configuration for displaying documents in list views.
 * Documents provide personal context for My Cat AI assistant.
 *
 * Created: 2026-01-20
 * Last Modified: 2026-01-20
 * Last Modified Summary: Initial document list configuration
 */

import type { DocumentType, DocumentVisibility } from '@/lib/validation';

export interface DocumentListItem {
  id: string;
  title: string;
  content: string | null;
  document_type: DocumentType;
  visibility: DocumentVisibility;
  tags: string[];
  summary: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Human-readable labels for document types
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
 * Human-readable labels for visibility levels
 */
export const VISIBILITY_LABELS: Record<DocumentVisibility, string> = {
  private: 'Private',
  cat_visible: 'My Cat Only',
  public: 'Public',
};

/**
 * Icons/emojis for document types
 */
export const DOCUMENT_TYPE_ICONS: Record<DocumentType, string> = {
  goals: '🎯',
  finances: '💰',
  skills: '🔧',
  notes: '📝',
  business_plan: '📊',
  other: '📄',
};

export const documentEntityConfig = {
  entityType: 'document' as const,
  apiEndpoint: '/api/documents',
  createPath: '/dashboard/documents/create',
  makeHref: (item: DocumentListItem) => `/dashboard/documents/${item.id}`,

  makeCardProps: (item: DocumentListItem) => ({
    title: item.title,
    description: item.content?.slice(0, 150) || '',
    badge: DOCUMENT_TYPE_LABELS[item.document_type] || item.document_type,
    status: item.visibility === 'private' ? 'private' : 'active',
    meta: [
      {
        label: 'Type',
        value: `${DOCUMENT_TYPE_ICONS[item.document_type] || ''} ${DOCUMENT_TYPE_LABELS[item.document_type] || item.document_type}`,
      },
      { label: 'Visibility', value: VISIBILITY_LABELS[item.visibility] || item.visibility },
      ...(item.tags && item.tags.length > 0
        ? [{ label: 'Tags', value: item.tags.slice(0, 3).join(', ') }]
        : []),
    ],
  }),

  emptyState: {
    title: 'No context documents yet',
    description:
      'Add documents about your goals, skills, or plans to help My Cat give you personalized advice. The more context you provide, the better My Cat can help you.',
  },

  gridCols: {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  },
};
