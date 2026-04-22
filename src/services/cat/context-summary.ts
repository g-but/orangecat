/**
 * Cat Context Summary Service
 *
 * Generates the structured summary shown in the "What My Cat Knows" panel.
 * Pure functions — no I/O, no HTTP, no side effects.
 */

import { ROUTES } from '@/config/routes';
import type { FullUserContext } from '@/services/ai/document-context';

export interface ContextSummary {
  greeting: string;
  knowledgeItems: {
    category: string;
    icon: string;
    items: string[];
    count: number;
  }[];
  suggestions: {
    text: string;
    action?: string;
    actionUrl?: string;
  }[];
  completeness: number; // 0-100 score
  tips: string[];
}

// ── Internal helpers ───────────────────────────────────────────────────────────

const DOC_TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  goals:         { label: 'Your Goals',        icon: 'target'    },
  skills:        { label: 'Your Skills',        icon: 'zap'       },
  finances:      { label: 'Financial Context',  icon: 'wallet'    },
  business_plan: { label: 'Business Plans',     icon: 'briefcase' },
  notes:         { label: 'Your Notes',         icon: 'file-text' },
  other:         { label: 'Other Context',      icon: 'folder'    },
};

function timeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// ── Exported summary builders ─────────────────────────────────────────────────

export function generateGreeting(context: FullUserContext): string {
  const greeting = timeOfDayGreeting();
  const name = context.profile?.name || context.profile?.username;
  if (!name) return `${greeting}! I'm your personal AI assistant on OrangeCat.`;

  const candidates: string[] = [];
  if (context.stats.totalProjects > 0)
    candidates.push(`${greeting}, ${name}! Ready to work on your projects?`);
  if (context.stats.totalProducts > 0)
    candidates.push(`${greeting}, ${name}! How's your store doing?`);
  if (context.documents.some(d => d.document_type === 'goals'))
    candidates.push(`${greeting}, ${name}! Let's make progress on your goals today.`);

  if (candidates.length === 0)
    candidates.push(`${greeting}, ${name}! How can I help you today?`);

  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function generateKnowledgeItems(context: FullUserContext): ContextSummary['knowledgeItems'] {
  const items: ContextSummary['knowledgeItems'] = [];

  // Profile
  if (context.profile) {
    const profileItems: string[] = [];
    if (context.profile.name)          profileItems.push(`Name: ${context.profile.name}`);
    if (context.profile.location_city) profileItems.push(`Location: ${context.profile.location_city}`);
    if (context.profile.bio)           profileItems.push('Your bio');
    if (context.profile.background)    profileItems.push('Your background');
    if (profileItems.length > 0) {
      items.push({ category: 'Your Profile', icon: 'user', items: profileItems, count: profileItems.length });
    }
  }

  // Documents grouped by type
  const docsByType: Record<string, string[]> = {};
  for (const doc of context.documents) {
    const type = doc.document_type || 'notes';
    (docsByType[type] ??= []).push(doc.title);
  }
  for (const [type, docs] of Object.entries(docsByType)) {
    const { label, icon } = DOC_TYPE_LABELS[type] ?? { label: type, icon: 'file' };
    items.push({ category: label, icon, items: docs.slice(0, 3), count: docs.length });
  }

  // Entities
  const entityGroups: Array<{ stat: number; type: string; category: string; icon: string }> = [
    { stat: context.stats.totalProducts,  type: 'product',  category: 'Your Products',  icon: 'package'   },
    { stat: context.stats.totalServices,  type: 'service',  category: 'Your Services',  icon: 'briefcase' },
    { stat: context.stats.totalProjects,  type: 'project',  category: 'Your Projects',  icon: 'rocket'    },
    { stat: context.stats.totalCauses,    type: 'cause',    category: 'Your Causes',    icon: 'heart'     },
    { stat: context.stats.totalLoans,     type: 'loan',     category: 'Your Loans',     icon: 'trending-up' },
    { stat: context.stats.totalResearch,  type: 'research', category: 'Your Research',  icon: 'flask'     },
    { stat: context.stats.totalWishlists, type: 'wishlist', category: 'Your Wishlists', icon: 'gift'      },
  ];
  for (const { stat, type, category, icon } of entityGroups) {
    if (stat > 0) {
      const titles = context.entities.filter(e => e.type === type).map(e => e.title);
      items.push({ category, icon, items: titles.slice(0, 3), count: stat });
    }
  }

  return items;
}

export function generateSuggestions(context: FullUserContext): ContextSummary['suggestions'] {
  const suggestions: ContextSummary['suggestions'] = [];

  if (context.stats.totalProducts > 0 && context.stats.totalProjects === 0) {
    suggestions.push({ text: 'You have products but no projects. Want to crowdfund something bigger?', action: 'Create a Project', actionUrl: ROUTES.DASHBOARD.PROJECTS_CREATE });
  }
  if (context.documents.length === 0) {
    suggestions.push({ text: 'Add some context about yourself so I can give you personalized advice', action: 'Add Context', actionUrl: ROUTES.DASHBOARD.DOCUMENTS_CREATE });
  }
  if (!context.documents.some(d => d.document_type === 'goals')) {
    suggestions.push({ text: 'Tell me about your goals and I can help you achieve them', action: 'Share Your Goals', actionUrl: ROUTES.DASHBOARD.DOCUMENTS_CREATE });
  }
  if (context.entities.length > 0 && context.documents.length > 0) {
    const firstProduct = context.entities.find(e => e.type === 'product');
    if (firstProduct) suggestions.push({ text: `Ask me how to market "${firstProduct.title}" better` });
    const firstProject = context.entities.find(e => e.type === 'project');
    if (firstProject) suggestions.push({ text: `Ask me for ideas to promote "${firstProject.title}"` });
  }
  if (suggestions.length < 3) {
    suggestions.push({ text: 'Ask me anything about Bitcoin, building projects, or growing on OrangeCat' });
  }

  return suggestions.slice(0, 3);
}

export function calculateCompleteness(context: FullUserContext): number {
  let score = 0;

  // Profile completeness (30 pts)
  if (context.profile?.name)          score += 5;
  if (context.profile?.bio)           score += 10;
  if (context.profile?.location_city) score += 5;
  if (context.profile?.background)    score += 10;

  // Documents (40 pts)
  if (context.documents.length >= 1)                                          score += 10;
  if (context.documents.length >= 3)                                          score += 10;
  if (context.documents.some(d => d.document_type === 'goals'))               score += 10;
  if (context.documents.some(d => d.document_type === 'skills'))              score += 10;

  // Entities (30 pts — any 3 distinct entity types counts as full score)
  const entityTypeCount = [
    context.stats.totalProducts,
    context.stats.totalServices,
    context.stats.totalProjects,
    context.stats.totalCauses,
    context.stats.totalLoans,
    context.stats.totalResearch,
    context.stats.totalWishlists,
  ].filter(n => n > 0).length;
  score += Math.min(entityTypeCount * 10, 30);

  return Math.min(score, 100);
}

export function generateTips(context: FullUserContext, completeness: number): string[] {
  const tips: string[] = [];
  if (completeness < 30)                                               tips.push('Add more context about yourself to get better personalized advice');
  if (!context.profile?.bio)                                           tips.push('Add a bio to your profile');
  if (!context.documents.some(d => d.document_type === 'goals'))       tips.push('Share your goals so I can help you achieve them');
  if (!context.documents.some(d => d.document_type === 'skills'))      tips.push('Tell me about your skills so I can suggest opportunities');
  if (context.stats.totalProducts === 0 && context.stats.totalServices === 0) tips.push('Create a product or service to start earning Bitcoin');
  return tips.slice(0, 2);
}

/** Build the full context summary in one call. */
export function buildContextSummary(context: FullUserContext): ContextSummary {
  const completeness = calculateCompleteness(context);
  return {
    greeting:       generateGreeting(context),
    knowledgeItems: generateKnowledgeItems(context),
    suggestions:    generateSuggestions(context),
    completeness,
    tips:           generateTips(context, completeness),
  };
}
