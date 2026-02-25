/**
 * DOCUMENT ENTITY CONFIGURATION
 *
 * Configuration for displaying documents in list views and dashboard.
 * Documents provide personal context for My Cat AI assistant.
 *
 * Created: 2026-01-20
 * Last Modified: 2026-02-24
 * Last Modified Summary: Fix meta→metadata bug, add EntityConfig compliance for EntityDashboardPage
 */

import { EntityConfig } from '@/types/entity';
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
  [key: string]: unknown;
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
  goals: '\u{1F3AF}',
  finances: '\u{1F4B0}',
  skills: '\u{1F527}',
  notes: '\u{1F4DD}',
  business_plan: '\u{1F4CA}',
  other: '\u{1F4C4}',
};

export const documentEntityConfig: EntityConfig<DocumentListItem> = {
  name: 'Document',
  namePlural: 'Documents',
  colorTheme: 'purple',

  listPath: '/dashboard/documents',
  detailPath: id => `/dashboard/documents/${id}`,
  createPath: '/dashboard/documents/create',
  editPath: id => `/dashboard/documents/create?edit=${id}`,

  apiEndpoint: '/api/documents',

  makeHref: item => `/dashboard/documents/${item.id}`,

  makeCardProps: item => ({
    badge: DOCUMENT_TYPE_LABELS[item.document_type] || item.document_type,
    status: item.visibility === 'private' ? 'private' : 'active',
    showEditButton: true,
    editHref: `/dashboard/documents/create?edit=${item.id}`,
    metadata: (
      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
        <span>
          {DOCUMENT_TYPE_ICONS[item.document_type] || ''}{' '}
          {DOCUMENT_TYPE_LABELS[item.document_type] || item.document_type}
        </span>
        <span>{VISIBILITY_LABELS[item.visibility] || item.visibility}</span>
        {item.tags?.length > 0 && <span>{item.tags.slice(0, 3).join(', ')}</span>}
      </div>
    ),
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
