/**
 * My Cat Context Summary API
 *
 * GET /api/cat/context - Returns summary of what My Cat knows about the user
 * This powers the "What My Cat Knows" transparency panel
 *
 * Created: 2026-01-21
 * Last Modified: 2026-01-21
 * Last Modified Summary: Initial implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { fetchFullContextForCat, type FullUserContext } from '@/services/ai/document-context';

interface ContextSummary {
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

function generateGreeting(context: FullUserContext): string {
  const name = context.profile?.name || context.profile?.username;
  const hour = new Date().getHours();

  let timeGreeting = 'Hello';
  if (hour < 12) {
    timeGreeting = 'Good morning';
  } else if (hour < 17) {
    timeGreeting = 'Good afternoon';
  } else {
    timeGreeting = 'Good evening';
  }

  if (!name) {
    return `${timeGreeting}! I'm your personal AI assistant on OrangeCat.`;
  }

  // Personalized greeting based on context
  const greetings: string[] = [];

  if (context.stats.totalProjects > 0) {
    greetings.push(`${timeGreeting}, ${name}! Ready to work on your projects?`);
  }
  if (context.stats.totalProducts > 0) {
    greetings.push(`${timeGreeting}, ${name}! How's your store doing?`);
  }
  if (context.documents.some(d => d.document_type === 'goals')) {
    greetings.push(`${timeGreeting}, ${name}! Let's make progress on your goals today.`);
  }

  if (greetings.length === 0) {
    greetings.push(`${timeGreeting}, ${name}! How can I help you today?`);
  }

  // Pick a random greeting for variety
  return greetings[Math.floor(Math.random() * greetings.length)];
}

function generateKnowledgeItems(context: FullUserContext): ContextSummary['knowledgeItems'] {
  const items: ContextSummary['knowledgeItems'] = [];

  // Profile
  if (context.profile) {
    const profileItems: string[] = [];
    if (context.profile.name) {
      profileItems.push(`Name: ${context.profile.name}`);
    }
    if (context.profile.location_city) {
      profileItems.push(`Location: ${context.profile.location_city}`);
    }
    if (context.profile.bio) {
      profileItems.push('Your bio');
    }
    if (context.profile.background) {
      profileItems.push('Your background');
    }

    if (profileItems.length > 0) {
      items.push({
        category: 'Your Profile',
        icon: 'user',
        items: profileItems,
        count: profileItems.length,
      });
    }
  }

  // Documents by type
  const docsByType: Record<string, string[]> = {};
  context.documents.forEach(doc => {
    const type = doc.document_type || 'notes';
    if (!docsByType[type]) {
      docsByType[type] = [];
    }
    docsByType[type].push(doc.title);
  });

  const typeLabels: Record<string, { label: string; icon: string }> = {
    goals: { label: 'Your Goals', icon: 'target' },
    skills: { label: 'Your Skills', icon: 'zap' },
    finances: { label: 'Financial Context', icon: 'wallet' },
    business_plan: { label: 'Business Plans', icon: 'briefcase' },
    notes: { label: 'Your Notes', icon: 'file-text' },
    other: { label: 'Other Context', icon: 'folder' },
  };

  for (const [type, docs] of Object.entries(docsByType)) {
    const { label, icon } = typeLabels[type] || { label: type, icon: 'file' };
    items.push({
      category: label,
      icon,
      items: docs.slice(0, 3),
      count: docs.length,
    });
  }

  // Entities
  if (context.stats.totalProducts > 0) {
    const products = context.entities.filter(e => e.type === 'product').map(e => e.title);
    items.push({
      category: 'Your Products',
      icon: 'package',
      items: products.slice(0, 3),
      count: context.stats.totalProducts,
    });
  }

  if (context.stats.totalServices > 0) {
    const services = context.entities.filter(e => e.type === 'service').map(e => e.title);
    items.push({
      category: 'Your Services',
      icon: 'briefcase',
      items: services.slice(0, 3),
      count: context.stats.totalServices,
    });
  }

  if (context.stats.totalProjects > 0) {
    const projects = context.entities.filter(e => e.type === 'project').map(e => e.title);
    items.push({
      category: 'Your Projects',
      icon: 'rocket',
      items: projects.slice(0, 3),
      count: context.stats.totalProjects,
    });
  }

  if (context.stats.totalCauses > 0) {
    const causes = context.entities.filter(e => e.type === 'cause').map(e => e.title);
    items.push({
      category: 'Your Causes',
      icon: 'heart',
      items: causes.slice(0, 3),
      count: context.stats.totalCauses,
    });
  }

  return items;
}

function generateSuggestions(context: FullUserContext): ContextSummary['suggestions'] {
  const suggestions: ContextSummary['suggestions'] = [];

  // Suggest based on what they have
  if (context.stats.totalProducts > 0 && context.stats.totalProjects === 0) {
    suggestions.push({
      text: 'You have products but no projects. Want to crowdfund something bigger?',
      action: 'Create a Project',
      actionUrl: '/dashboard/projects/create',
    });
  }

  if (context.documents.length === 0) {
    suggestions.push({
      text: 'Add some context about yourself so I can give you personalized advice',
      action: 'Add Context',
      actionUrl: '/dashboard/documents/create',
    });
  }

  if (!context.documents.some(d => d.document_type === 'goals')) {
    suggestions.push({
      text: 'Tell me about your goals and I can help you achieve them',
      action: 'Share Your Goals',
      actionUrl: '/dashboard/documents/create',
    });
  }

  if (context.entities.length > 0 && context.documents.length > 0) {
    const productTitles = context.entities.filter(e => e.type === 'product').map(e => e.title);
    if (productTitles.length > 0) {
      suggestions.push({
        text: `Ask me how to market "${productTitles[0]}" better`,
      });
    }

    const projectTitles = context.entities.filter(e => e.type === 'project').map(e => e.title);
    if (projectTitles.length > 0) {
      suggestions.push({
        text: `Ask me for ideas to promote "${projectTitles[0]}"`,
      });
    }
  }

  // Generic helpful suggestions
  if (suggestions.length < 3) {
    suggestions.push({
      text: 'Ask me anything about Bitcoin, building projects, or growing on OrangeCat',
    });
  }

  return suggestions.slice(0, 3);
}

function calculateCompleteness(context: FullUserContext): number {
  let score = 0;
  const maxScore = 100;

  // Profile completeness (30 points)
  if (context.profile) {
    if (context.profile.name) {
      score += 5;
    }
    if (context.profile.bio) {
      score += 10;
    }
    if (context.profile.location_city) {
      score += 5;
    }
    if (context.profile.background) {
      score += 10;
    }
  }

  // Documents (40 points)
  if (context.documents.length >= 1) {
    score += 10;
  }
  if (context.documents.length >= 3) {
    score += 10;
  }
  if (context.documents.some(d => d.document_type === 'goals')) {
    score += 10;
  }
  if (context.documents.some(d => d.document_type === 'skills')) {
    score += 10;
  }

  // Entities (30 points)
  if (context.stats.totalProducts > 0) {
    score += 10;
  }
  if (context.stats.totalServices > 0) {
    score += 10;
  }
  if (context.stats.totalProjects > 0) {
    score += 10;
  }

  return Math.min(score, maxScore);
}

function generateTips(context: FullUserContext, completeness: number): string[] {
  const tips: string[] = [];

  if (completeness < 30) {
    tips.push('Add more context about yourself to get better personalized advice');
  }

  if (!context.profile?.bio) {
    tips.push('Add a bio to your profile');
  }

  if (!context.documents.some(d => d.document_type === 'goals')) {
    tips.push('Share your goals so I can help you achieve them');
  }

  if (!context.documents.some(d => d.document_type === 'skills')) {
    tips.push('Tell me about your skills so I can suggest opportunities');
  }

  if (context.stats.totalProducts === 0 && context.stats.totalServices === 0) {
    tips.push('Create a product or service to start earning Bitcoin');
  }

  return tips.slice(0, 2);
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch full context
    const context = await fetchFullContextForCat(supabase, user.id);

    // Generate summary
    const completeness = calculateCompleteness(context);
    const summary: ContextSummary = {
      greeting: generateGreeting(context),
      knowledgeItems: generateKnowledgeItems(context),
      suggestions: generateSuggestions(context),
      completeness,
      tips: generateTips(context, completeness),
    };

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Error fetching cat context:', error);
    return NextResponse.json({ error: 'Failed to fetch context' }, { status: 500 });
  }
}
