/**
 * Document Field Guidance Content
 *
 * Single source of truth for document creation guidance.
 * Used by GuidancePanel to provide contextual help and examples.
 *
 * Created: 2026-01-20
 * Last Modified: 2026-01-20
 * Last Modified Summary: Initial document guidance content
 */

import React from 'react';
import {
  FileText,
  Eye,
  Tag,
  Target,
  Briefcase,
  DollarSign,
  Wrench,
  StickyNote,
  Cat,
  Lock,
  Globe,
} from 'lucide-react';
import type { GuidanceContent, DefaultGuidance } from '@/components/create/types';

export type DocumentFieldType =
  | 'title'
  | 'content'
  | 'document_type'
  | 'visibility'
  | 'tags'
  | null;

export const documentGuidanceContent: Record<NonNullable<DocumentFieldType>, GuidanceContent> = {
  title: {
    icon: React.createElement(FileText, { className: 'w-5 h-5 text-indigo-600' }),
    title: 'Document Title',
    description:
      'Give your document a clear, descriptive title that helps My Cat understand what information it contains.',
    tips: [
      'Be specific about the content',
      'Use descriptive keywords',
      'Keep it concise but meaningful',
      'Make it easy to find later',
    ],
    examples: [
      'My 2026 Financial Goals',
      'Software Engineering Skills',
      'Startup Business Plan',
      'Career Objectives',
    ],
  },
  content: {
    icon: React.createElement(StickyNote, { className: 'w-5 h-5 text-indigo-600' }),
    title: 'Document Content',
    description:
      'Write the information you want My Cat to know about you. The more detail you provide, the better advice My Cat can give.',
    tips: [
      'Be specific and detailed',
      'Include relevant context',
      'Update regularly as things change',
      'Structure with sections if needed',
    ],
    examples: [
      'My goals for this year: 1) Save 10M sats for emergency fund 2) Start a side business...',
      'I have 5 years of experience in React, TypeScript, and Node.js. I specialize in...',
    ],
  },
  document_type: {
    icon: React.createElement(Tag, { className: 'w-5 h-5 text-indigo-600' }),
    title: 'Document Type',
    description:
      'Choose the type that best describes your document. This helps My Cat understand the context.',
    tips: [
      'Goals & Aspirations - What you want to achieve',
      'Financial Info - Budget, income, expenses',
      'Skills & Expertise - Your abilities and experience',
      'Business Plan - Startup ideas and strategies',
      'Notes - General information',
      'Other - Anything else',
    ],
    examples: [
      'Goals - for your objectives and dreams',
      'Skills - for your professional abilities',
      'Finances - for budgets and financial context',
    ],
  },
  visibility: {
    icon: React.createElement(Eye, { className: 'w-5 h-5 text-indigo-600' }),
    title: 'Visibility',
    description:
      'Control who can see this document and whether My Cat can use it for personalized advice.',
    tips: [
      'Private - Only you can see. My Cat cannot access.',
      'My Cat Only - My Cat uses this for personalized advice.',
      'Public - Anyone can see on your profile.',
      'Use "My Cat Only" for most personal context.',
    ],
    examples: [
      'Private - for sensitive draft notes',
      'My Cat Only - for goals and skills you want advice on',
      'Public - for information you want to share',
    ],
  },
  tags: {
    icon: React.createElement(Tag, { className: 'w-5 h-5 text-indigo-600' }),
    title: 'Tags',
    description:
      'Add tags to help organize and find your documents. Tags also help My Cat understand the context.',
    tips: [
      'Use relevant keywords',
      'Keep tags short and specific',
      'Add multiple tags for better organization',
      'Think about how you might search later',
    ],
    examples: [
      'career, 2026, goals',
      'bitcoin, investment, savings',
      'skills, programming, javascript',
    ],
  },
};

export const documentDefaultGuidance: DefaultGuidance = {
  title: 'Add Context for My Cat',
  description:
    'Documents help My Cat understand your goals, skills, and situation. The more context you provide, the more personalized and helpful advice My Cat can give you.',
  features: [
    {
      icon: React.createElement(Target, { className: 'w-4 h-4 text-indigo-600' }),
      text: 'Share your goals and aspirations',
    },
    {
      icon: React.createElement(DollarSign, { className: 'w-4 h-4 text-indigo-600' }),
      text: 'Provide financial context for advice',
    },
    {
      icon: React.createElement(Wrench, { className: 'w-4 h-4 text-indigo-600' }),
      text: 'Document your skills and expertise',
    },
    {
      icon: React.createElement(Briefcase, { className: 'w-4 h-4 text-indigo-600' }),
      text: 'Share business plans and ideas',
    },
    {
      icon: React.createElement(Cat, { className: 'w-4 h-4 text-indigo-600' }),
      text: 'Get personalized advice from My Cat',
    },
  ],
  hint: 'Documents marked "My Cat Only" or "Public" will be used by My Cat for personalized advice.',
};

export const documentTypeGuidance = {
  goals: {
    icon: React.createElement(Target, { className: 'w-5 h-5 text-indigo-600' }),
    title: 'Goals & Aspirations',
    description: 'Your personal or professional goals that My Cat can help you achieve.',
    examples: [
      'Short-term and long-term objectives',
      'Career goals and milestones',
      'Personal development targets',
      'Financial targets and savings goals',
    ],
  },
  finances: {
    icon: React.createElement(DollarSign, { className: 'w-5 h-5 text-indigo-600' }),
    title: 'Financial Information',
    description: 'Context about your financial situation for better advice.',
    examples: [
      'Monthly budget breakdown',
      'Income sources and amounts',
      'Debt and savings status',
      'Investment allocations',
    ],
  },
  skills: {
    icon: React.createElement(Wrench, { className: 'w-5 h-5 text-indigo-600' }),
    title: 'Skills & Expertise',
    description: 'Your professional abilities and experience.',
    examples: [
      'Technical skills and proficiency levels',
      'Years of experience in different areas',
      'Certifications and education',
      'Soft skills and strengths',
    ],
  },
  business_plan: {
    icon: React.createElement(Briefcase, { className: 'w-5 h-5 text-indigo-600' }),
    title: 'Business Plan',
    description: 'Startup ideas, strategies, and business context.',
    examples: [
      'Business idea and value proposition',
      'Market analysis and target audience',
      'Revenue model and projections',
      'Milestones and timeline',
    ],
  },
  notes: {
    icon: React.createElement(StickyNote, { className: 'w-5 h-5 text-indigo-600' }),
    title: 'Notes',
    description: 'General notes and information.',
    examples: [
      'Meeting notes and decisions',
      'Ideas and brainstorms',
      'Research and findings',
      'Personal reflections',
    ],
  },
  other: {
    icon: React.createElement(FileText, { className: 'w-5 h-5 text-indigo-600' }),
    title: 'Other',
    description: 'Any other context that does not fit other categories.',
    examples: [
      'Travel plans',
      'Health and wellness goals',
      'Hobbies and interests',
      'Family context',
    ],
  },
};

export const visibilityGuidance = {
  private: {
    icon: React.createElement(Lock, { className: 'w-5 h-5 text-gray-600' }),
    title: 'Private',
    description: 'Only you can see this document. My Cat cannot access it.',
    useCase: 'Use for drafts or sensitive information you do not want My Cat to use.',
  },
  cat_visible: {
    icon: React.createElement(Cat, { className: 'w-5 h-5 text-indigo-600' }),
    title: 'My Cat Only',
    description: 'My Cat can use this to give you personalized advice.',
    useCase: 'Best for most personal context - goals, skills, finances.',
  },
  public: {
    icon: React.createElement(Globe, { className: 'w-5 h-5 text-green-600' }),
    title: 'Public',
    description: 'Anyone can see this on your profile.',
    useCase: 'Use for information you want to share publicly.',
  },
};
