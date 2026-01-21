/**
 * Document Context Service for My Cat AI
 *
 * Fetches user's documents that are visible to My Cat for personalized context.
 * Documents with visibility 'cat_visible' or 'public' are included.
 *
 * Created: 2026-01-21
 * Last Modified: 2026-01-21
 * Last Modified Summary: Initial creation
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

// Type alias for any SupabaseClient (accepts any database schema)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

export interface DocumentContext {
  id: string;
  title: string;
  content: string;
  document_type: string;
  visibility: string;
}

/**
 * Document type display names for context
 */
const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  goals: 'Goals & Aspirations',
  skills: 'Skills & Expertise',
  background: 'Background & History',
  preferences: 'Preferences & Values',
  plans: 'Plans & Projects',
  notes: 'Notes & Ideas',
  other: 'Other Context',
};

/**
 * Fetch documents visible to My Cat for a user
 */
export async function fetchDocumentsForCat(
  supabase: AnySupabaseClient,
  userId: string
): Promise<DocumentContext[]> {
  try {
    // First get the user's actor
    const { data: actor, error: actorError } = await supabase
      .from('actors')
      .select('id')
      .eq('actor_type', 'user')
      .eq('user_id', userId)
      .maybeSingle();

    if (actorError || !actor) {
      logger.warn('Could not find actor for user', { userId }, 'DocumentContext');
      return [];
    }

    // Fetch documents visible to My Cat
    const { data: documents, error: docsError } = await supabase
      .from('user_documents')
      .select('id, title, content, document_type, visibility')
      .eq('actor_id', actor.id)
      .in('visibility', ['cat_visible', 'public'])
      .order('document_type', { ascending: true });

    if (docsError) {
      logger.error('Failed to fetch documents for cat', docsError, 'DocumentContext');
      return [];
    }

    return (documents || []) as DocumentContext[];
  } catch (error) {
    logger.error('Exception fetching documents for cat', error, 'DocumentContext');
    return [];
  }
}

/**
 * Build a context string from documents for inclusion in AI prompts
 */
export function buildDocumentContextString(documents: DocumentContext[]): string {
  if (documents.length === 0) {
    return '';
  }

  const sections: string[] = [];

  // Group documents by type
  const byType = documents.reduce(
    (acc, doc) => {
      const type = doc.document_type || 'other';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(doc);
      return acc;
    },
    {} as Record<string, DocumentContext[]>
  );

  // Build context sections
  for (const [type, docs] of Object.entries(byType)) {
    const label = DOCUMENT_TYPE_LABELS[type] || type;
    const docContents = docs
      .map(doc => {
        // Truncate long content to save tokens
        const content =
          doc.content.length > 1500 ? doc.content.substring(0, 1500) + '...' : doc.content;
        return `**${doc.title}**:\n${content}`;
      })
      .join('\n\n');

    sections.push(`### ${label}\n${docContents}`);
  }

  return `## Personal Context (from user's My Context documents)

The user has shared the following context to help you provide personalized advice:

${sections.join('\n\n')}

---
Use this context to personalize your responses. Reference their goals, skills, and situation when relevant. If they ask about something related to their context, use this information.`;
}
