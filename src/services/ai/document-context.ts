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

/**
 * Full user context for My Cat AI - includes profile, documents, entities, and stats
 */
export interface FullUserContext {
  profile?: {
    name?: string;
    username?: string;
    location_city?: string;
    bio?: string;
    background?: string;
  };
  documents: DocumentContext[];
  entities: Array<{
    type: 'product' | 'service' | 'project' | 'cause';
    title: string;
  }>;
  stats: {
    totalProducts: number;
    totalServices: number;
    totalProjects: number;
    totalCauses: number;
  };
}

/**
 * Fetch full context for My Cat including profile, documents, and entities
 */
export async function fetchFullContextForCat(
  supabase: AnySupabaseClient,
  userId: string
): Promise<FullUserContext> {
  try {
    // First get the user's actor
    const { data: actor, error: actorError } = await supabase
      .from('actors')
      .select('id')
      .eq('actor_type', 'user')
      .eq('user_id', userId)
      .maybeSingle();

    if (actorError || !actor) {
      logger.warn('Could not find actor for user in full context', { userId }, 'DocumentContext');
      return {
        documents: [],
        entities: [],
        stats: {
          totalProducts: 0,
          totalServices: 0,
          totalProjects: 0,
          totalCauses: 0,
        },
      };
    }

    // Fetch profile, documents, and entities in parallel
    const [profileResult, documentsResult, productsResult, servicesResult, projectsResult, causesResult] = await Promise.all([
      // Profile
      supabase
        .from('profiles')
        .select('name, username, location_city, bio, background')
        .eq('user_id', userId)
        .maybeSingle(),
      // Documents visible to cat
      supabase
        .from('user_documents')
        .select('id, title, content, document_type, visibility')
        .eq('actor_id', actor.id)
        .in('visibility', ['cat_visible', 'public'])
        .order('document_type', { ascending: true }),
      // Products
      supabase
        .from('user_products')
        .select('id, title')
        .eq('actor_id', actor.id)
        .eq('status', 'active'),
      // Services
      supabase
        .from('user_services')
        .select('id, title')
        .eq('actor_id', actor.id)
        .eq('status', 'active'),
      // Projects
      supabase
        .from('user_projects')
        .select('id, title')
        .eq('actor_id', actor.id)
        .eq('status', 'active'),
      // Causes
      supabase
        .from('user_causes')
        .select('id, title')
        .eq('actor_id', actor.id)
        .eq('status', 'active'),
    ]);

    // Build entities array
    const entities: FullUserContext['entities'] = [];

    if (productsResult.data) {
      entities.push(...productsResult.data.map((p: { id: string; title: string }) => ({ type: 'product' as const, title: p.title })));
    }
    if (servicesResult.data) {
      entities.push(...servicesResult.data.map((s: { id: string; title: string }) => ({ type: 'service' as const, title: s.title })));
    }
    if (projectsResult.data) {
      entities.push(...projectsResult.data.map((p: { id: string; title: string }) => ({ type: 'project' as const, title: p.title })));
    }
    if (causesResult.data) {
      entities.push(...causesResult.data.map((c: { id: string; title: string }) => ({ type: 'cause' as const, title: c.title })));
    }

    return {
      profile: profileResult.data || undefined,
      documents: (documentsResult.data || []) as DocumentContext[],
      entities,
      stats: {
        totalProducts: productsResult.data?.length || 0,
        totalServices: servicesResult.data?.length || 0,
        totalProjects: projectsResult.data?.length || 0,
        totalCauses: causesResult.data?.length || 0,
      },
    };
  } catch (error) {
    logger.error('Exception fetching full context for cat', error, 'DocumentContext');
    return {
      documents: [],
      entities: [],
      stats: {
        totalProducts: 0,
        totalServices: 0,
        totalProjects: 0,
        totalCauses: 0,
      },
    };
  }
}

/**
 * Build a comprehensive context string from full user context for AI prompts
 */
export function buildFullContextString(context: FullUserContext): string {
  const sections: string[] = [];

  // Profile section
  if (context.profile) {
    const profileParts: string[] = [];
    if (context.profile.name) {
      profileParts.push(`- **Name**: ${context.profile.name}`);
    }
    if (context.profile.username) {
      profileParts.push(`- **Username**: @${context.profile.username}`);
    }
    if (context.profile.location_city) {
      profileParts.push(`- **Location**: ${context.profile.location_city}`);
    }
    if (context.profile.bio) {
      profileParts.push(`- **Bio**: ${context.profile.bio}`);
    }
    if (context.profile.background) {
      profileParts.push(`- **Background**: ${context.profile.background}`);
    }

    if (profileParts.length > 0) {
      sections.push(`### User Profile\n${profileParts.join('\n')}`);
    }
  }

  // Documents section (reuse existing function)
  const documentContext = buildDocumentContextString(context.documents);
  if (documentContext) {
    sections.push(documentContext);
  }

  // Entities section
  if (context.entities.length > 0) {
    const entityParts: string[] = [];

    const products = context.entities.filter(e => e.type === 'product');
    const services = context.entities.filter(e => e.type === 'service');
    const projects = context.entities.filter(e => e.type === 'project');
    const causes = context.entities.filter(e => e.type === 'cause');

    if (products.length > 0) {
      entityParts.push(`**Products (${products.length})**: ${products.map(p => p.title).join(', ')}`);
    }
    if (services.length > 0) {
      entityParts.push(`**Services (${services.length})**: ${services.map(s => s.title).join(', ')}`);
    }
    if (projects.length > 0) {
      entityParts.push(`**Projects (${projects.length})**: ${projects.map(p => p.title).join(', ')}`);
    }
    if (causes.length > 0) {
      entityParts.push(`**Causes (${causes.length})**: ${causes.map(c => c.title).join(', ')}`);
    }

    if (entityParts.length > 0) {
      sections.push(`### User's OrangeCat Activity\n${entityParts.join('\n')}`);
    }
  }

  if (sections.length === 0) {
    return '';
  }

  return `## User Context

The following information is available about this user to personalize your responses:

${sections.join('\n\n')}

---
Use this context to provide personalized, relevant advice. Reference their profile, goals, skills, products, and projects when appropriate.`;
}
