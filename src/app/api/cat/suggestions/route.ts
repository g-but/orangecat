/**
 * My Cat - Context-Aware Suggestions API
 *
 * GET /api/cat/suggestions - Returns personalized quick prompts based on user's documents
 * These suggestions appear in the empty state of My Cat chat
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { fetchDocumentsForCat, type DocumentContext } from '@/services/ai/document-context';
import { logger } from '@/utils/logger';

// Document type to suggestion mapping
const DOCUMENT_TYPE_SUGGESTIONS: Record<string, (doc: DocumentContext) => string[]> = {
  goals: doc => {
    const suggestions = [
      `Help me make progress on my goal: "${truncate(doc.title, 40)}"`,
      `What's a good first step for achieving "${truncate(doc.title, 35)}"?`,
    ];
    // Extract specific goals from content if possible
    if (doc.content.toLowerCase().includes('bitcoin')) {
      suggestions.push('How can I accelerate my Bitcoin journey?');
    }
    if (doc.content.toLowerCase().includes('learn')) {
      suggestions.push('Create a learning plan based on my goals');
    }
    return suggestions;
  },
  skills: doc => {
    const suggestions = [
      `How can I monetize my ${truncate(doc.title, 30)} skills on OrangeCat?`,
      `What products could I create with my skills?`,
    ];
    if (
      doc.content.toLowerCase().includes('development') ||
      doc.content.toLowerCase().includes('coding')
    ) {
      suggestions.push('What digital products should a developer sell?');
    }
    if (doc.content.toLowerCase().includes('design')) {
      suggestions.push('How can I sell design services on OrangeCat?');
    }
    return suggestions;
  },
  background: doc => [
    `How can my background help me succeed on OrangeCat?`,
    `What unique value can I offer based on my experience?`,
  ],
  preferences: doc => [
    `Recommend products to create based on my preferences`,
    `What kind of projects align with my values?`,
  ],
  plans: doc => [
    `Help me refine my plan: "${truncate(doc.title, 35)}"`,
    `What's the next milestone for "${truncate(doc.title, 30)}"?`,
    `How should I price my planned offerings?`,
  ],
  notes: doc => [
    `Help me develop this idea: "${truncate(doc.title, 35)}"`,
    `Turn my notes into an actionable plan`,
  ],
  other: doc => [`Give me advice based on my context`, `What opportunities should I consider?`],
};

// Default suggestions when user has no documents
const DEFAULT_SUGGESTIONS = [
  'Help me write a product description',
  'Give me ideas for my first listing',
  'How do I price my products in sats?',
  'What makes a successful OrangeCat seller?',
];

// Suggestions when user has documents but we want variety
const CONTEXT_AWARE_GENERIC = [
  'What should I create next based on my context?',
  'How can I grow my presence on OrangeCat?',
  'Analyze my goals and suggest a strategy',
  'What Bitcoin opportunities align with my skills?',
];

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) {
    return str;
  }
  return str.substring(0, maxLen - 3) + '...';
}

function generateSuggestions(documents: DocumentContext[]): string[] {
  if (documents.length === 0) {
    return DEFAULT_SUGGESTIONS;
  }

  const suggestions: string[] = [];
  const usedSuggestions = new Set<string>();

  // Generate suggestions from each document type
  for (const doc of documents) {
    const type = doc.document_type || 'other';
    const generator = DOCUMENT_TYPE_SUGGESTIONS[type] || DOCUMENT_TYPE_SUGGESTIONS.other;
    const docSuggestions = generator(doc);

    for (const suggestion of docSuggestions) {
      if (!usedSuggestions.has(suggestion) && suggestions.length < 6) {
        suggestions.push(suggestion);
        usedSuggestions.add(suggestion);
      }
    }
  }

  // Add context-aware generic suggestions to fill remaining slots
  for (const suggestion of CONTEXT_AWARE_GENERIC) {
    if (!usedSuggestions.has(suggestion) && suggestions.length < 6) {
      suggestions.push(suggestion);
      usedSuggestions.add(suggestion);
    }
  }

  // Limit to 4 suggestions for clean UI
  return suggestions.slice(0, 4);
}

export async function GET() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      // Return default suggestions for unauthenticated users
      return NextResponse.json({
        success: true,
        data: {
          suggestions: DEFAULT_SUGGESTIONS,
          hasContext: false,
        },
      });
    }

    // Fetch user's documents visible to My Cat
    const documents = await fetchDocumentsForCat(supabase, user.id);

    // Generate personalized suggestions
    const suggestions = generateSuggestions(documents);

    return NextResponse.json({
      success: true,
      data: {
        suggestions,
        hasContext: documents.length > 0,
        documentCount: documents.length,
      },
    });
  } catch (error) {
    logger.error('Cat Suggestions error', error, 'CatSuggestionsAPI');
    // Return defaults on error
    return NextResponse.json({
      success: true,
      data: {
        suggestions: DEFAULT_SUGGESTIONS,
        hasContext: false,
      },
    });
  }
}
