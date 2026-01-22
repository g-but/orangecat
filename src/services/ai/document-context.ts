/**
 * Comprehensive Context Service for My Cat AI
 *
 * Fetches all relevant context for personalized AI responses:
 * - User profile information
 * - User documents (with visibility 'cat_visible' or 'public')
 * - User's entities (products, services, projects, causes, events)
 * - Platform knowledge
 *
 * Created: 2026-01-21
 * Last Modified: 2026-01-21
 * Last Modified Summary: Expanded to include profile, entities, and full user context
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

export interface ProfileContext {
  username?: string;
  name?: string;
  bio?: string;
  location_city?: string;
  location_country?: string;
  background?: string;
  website?: string;
}

export interface EntitySummary {
  type: string;
  title: string;
  description?: string;
  status: string;
  price_sats?: number;
}

export interface FullUserContext {
  profile: ProfileContext | null;
  documents: DocumentContext[];
  entities: EntitySummary[];
  stats: {
    totalProducts: number;
    totalServices: number;
    totalProjects: number;
    totalCauses: number;
    totalEvents: number;
  };
}

/**
 * Document type display names for context
 */
const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  goals: 'Goals & Aspirations',
  skills: 'Skills & Expertise',
  finances: 'Financial Information',
  business_plan: 'Business Plans',
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
 * Fetch user's profile information
 */
export async function fetchProfileForCat(
  supabase: AnySupabaseClient,
  userId: string
): Promise<ProfileContext | null> {
  try {
    const { data: actor, error: actorError } = await supabase
      .from('actors')
      .select('username, display_name, bio, location_city, location_country, background, website')
      .eq('actor_type', 'user')
      .eq('user_id', userId)
      .maybeSingle();

    if (actorError || !actor) {
      return null;
    }

    return {
      username: actor.username,
      name: actor.display_name,
      bio: actor.bio,
      location_city: actor.location_city,
      location_country: actor.location_country,
      background: actor.background,
      website: actor.website,
    };
  } catch (error) {
    logger.error('Exception fetching profile for cat', error, 'DocumentContext');
    return null;
  }
}

/**
 * Fetch user's entities (products, services, projects, causes, events)
 */
export async function fetchEntitiesForCat(
  supabase: AnySupabaseClient,
  userId: string
): Promise<{ entities: EntitySummary[]; stats: FullUserContext['stats'] }> {
  const stats = {
    totalProducts: 0,
    totalServices: 0,
    totalProjects: 0,
    totalCauses: 0,
    totalEvents: 0,
  };
  const entities: EntitySummary[] = [];

  try {
    // Get the user's actor
    const { data: actor, error: actorError } = await supabase
      .from('actors')
      .select('id')
      .eq('actor_type', 'user')
      .eq('user_id', userId)
      .maybeSingle();

    if (actorError || !actor) {
      return { entities, stats };
    }

    const actorId = actor.id;

    // Fetch products
    const { data: products } = await supabase
      .from('user_products')
      .select('title, description, status, price_sats')
      .eq('actor_id', actorId)
      .eq('status', 'active')
      .limit(10);

    if (products) {
      stats.totalProducts = products.length;
      products.forEach(p => {
        entities.push({
          type: 'product',
          title: p.title,
          description: p.description?.substring(0, 200),
          status: p.status,
          price_sats: p.price_sats,
        });
      });
    }

    // Fetch services
    const { data: services } = await supabase
      .from('user_services')
      .select('title, description, status, price_sats')
      .eq('actor_id', actorId)
      .eq('status', 'active')
      .limit(10);

    if (services) {
      stats.totalServices = services.length;
      services.forEach(s => {
        entities.push({
          type: 'service',
          title: s.title,
          description: s.description?.substring(0, 200),
          status: s.status,
          price_sats: s.price_sats,
        });
      });
    }

    // Fetch projects
    const { data: projects } = await supabase
      .from('user_projects')
      .select('title, description, status, goal_sats')
      .eq('actor_id', actorId)
      .in('status', ['active', 'draft'])
      .limit(10);

    if (projects) {
      stats.totalProjects = projects.length;
      projects.forEach(p => {
        entities.push({
          type: 'project',
          title: p.title,
          description: p.description?.substring(0, 200),
          status: p.status,
          price_sats: p.goal_sats,
        });
      });
    }

    // Fetch causes
    const { data: causes } = await supabase
      .from('user_causes')
      .select('title, description, status')
      .eq('actor_id', actorId)
      .in('status', ['active', 'draft'])
      .limit(10);

    if (causes) {
      stats.totalCauses = causes.length;
      causes.forEach(c => {
        entities.push({
          type: 'cause',
          title: c.title,
          description: c.description?.substring(0, 200),
          status: c.status,
        });
      });
    }

    // Fetch events
    const { data: events } = await supabase
      .from('user_events')
      .select('title, description, status')
      .eq('actor_id', actorId)
      .in('status', ['active', 'draft'])
      .limit(10);

    if (events) {
      stats.totalEvents = events.length;
      events.forEach(e => {
        entities.push({
          type: 'event',
          title: e.title,
          description: e.description?.substring(0, 200),
          status: e.status,
        });
      });
    }

    return { entities, stats };
  } catch (error) {
    logger.error('Exception fetching entities for cat', error, 'DocumentContext');
    return { entities, stats };
  }
}

/**
 * Fetch all context for My Cat
 */
export async function fetchFullContextForCat(
  supabase: AnySupabaseClient,
  userId: string
): Promise<FullUserContext> {
  const [profile, documents, { entities, stats }] = await Promise.all([
    fetchProfileForCat(supabase, userId),
    fetchDocumentsForCat(supabase, userId),
    fetchEntitiesForCat(supabase, userId),
  ]);

  return {
    profile,
    documents,
    entities,
    stats,
  };
}

/**
 * Build comprehensive context string for My Cat
 */
export function buildFullContextString(context: FullUserContext): string {
  const sections: string[] = [];

  // Profile section
  if (context.profile) {
    const p = context.profile;
    const profileParts: string[] = [];

    if (p.name) {
      profileParts.push(`**Name**: ${p.name}`);
    }
    if (p.username) {
      profileParts.push(`**Username**: @${p.username}`);
    }
    if (p.bio) {
      profileParts.push(`**Bio**: ${p.bio}`);
    }
    if (p.location_city || p.location_country) {
      profileParts.push(
        `**Location**: ${[p.location_city, p.location_country].filter(Boolean).join(', ')}`
      );
    }
    if (p.background) {
      profileParts.push(`**Background**: ${p.background}`);
    }
    if (p.website) {
      profileParts.push(`**Website**: ${p.website}`);
    }

    if (profileParts.length > 0) {
      sections.push(`## User Profile\n${profileParts.join('\n')}`);
    }
  }

  // Documents section
  if (context.documents.length > 0) {
    const docContextString = buildDocumentContextString(context.documents);
    if (docContextString) {
      sections.push(docContextString);
    }
  }

  // Entities section
  if (context.entities.length > 0) {
    const entityGroups: Record<string, EntitySummary[]> = {};
    context.entities.forEach(e => {
      if (!entityGroups[e.type]) {
        entityGroups[e.type] = [];
      }
      entityGroups[e.type].push(e);
    });

    const entityParts: string[] = [];

    const typeLabels: Record<string, string> = {
      product: 'Products',
      service: 'Services',
      project: 'Projects',
      cause: 'Causes',
      event: 'Events',
    };

    for (const [type, items] of Object.entries(entityGroups)) {
      const label = typeLabels[type] || type;
      const itemList = items
        .map(item => {
          const parts = [`- **${item.title}**`];
          if (item.price_sats) {
            parts.push(`(${item.price_sats.toLocaleString()} sats)`);
          }
          if (item.description) {
            parts.push(`: ${item.description}`);
          }
          return parts.join('');
        })
        .join('\n');
      entityParts.push(`### ${label}\n${itemList}`);
    }

    if (entityParts.length > 0) {
      sections.push(
        `## User's OrangeCat Entities\n\nThe user has created the following on OrangeCat:\n\n${entityParts.join('\n\n')}`
      );
    }
  }

  // Stats summary
  const { stats } = context;
  const hasAnyEntities =
    stats.totalProducts +
      stats.totalServices +
      stats.totalProjects +
      stats.totalCauses +
      stats.totalEvents >
    0;

  if (hasAnyEntities) {
    const statParts: string[] = [];
    if (stats.totalProducts > 0) {
      statParts.push(`${stats.totalProducts} product${stats.totalProducts > 1 ? 's' : ''}`);
    }
    if (stats.totalServices > 0) {
      statParts.push(`${stats.totalServices} service${stats.totalServices > 1 ? 's' : ''}`);
    }
    if (stats.totalProjects > 0) {
      statParts.push(`${stats.totalProjects} project${stats.totalProjects > 1 ? 's' : ''}`);
    }
    if (stats.totalCauses > 0) {
      statParts.push(`${stats.totalCauses} cause${stats.totalCauses > 1 ? 's' : ''}`);
    }
    if (stats.totalEvents > 0) {
      statParts.push(`${stats.totalEvents} event${stats.totalEvents > 1 ? 's' : ''}`);
    }

    sections.push(`## Activity Summary\nThe user has: ${statParts.join(', ')}.`);
  }

  if (sections.length === 0) {
    return '';
  }

  return `# User Context for Personalized Advice

${sections.join('\n\n')}

---
**Instructions for using this context**:
- Reference the user's profile, goals, skills, and entities when relevant
- If they ask about their products/services/projects, you have the details above
- Tailor your advice to their situation, background, and stated goals
- Help them leverage what they already have on OrangeCat
- Suggest ways to improve or expand their OrangeCat presence`;
}
