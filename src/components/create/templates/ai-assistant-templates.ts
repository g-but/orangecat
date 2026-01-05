/**
 * AI Assistant Templates
 *
 * Template definitions for AI assistant creation.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 */

import React from 'react';
import {
  FileText,
  Code,
  MessageSquare,
  GraduationCap,
  Briefcase,
  Palette,
  Search,
  Languages,
  Heart,
  Scale,
  Sparkles,
} from 'lucide-react';
import type { EntityTemplate } from '../types';
import type { AIAssistantFormData } from '@/lib/validation';

export const AI_ASSISTANT_TEMPLATES: EntityTemplate<AIAssistantFormData>[] = [
  {
    id: 'writing-assistant',
    icon: React.createElement(FileText, { className: 'w-4 h-4' }),
    name: 'Writing Assistant',
    tagline: 'Help with writing, editing, and content creation.',
    defaults: {
      title: 'Writing Assistant',
      description:
        'Expert writing assistant that helps with essays, articles, emails, and creative writing. Provides feedback, suggestions, and editing help.',
      category: 'Writing & Content',
      system_prompt:
        'You are a helpful writing assistant. Help users improve their writing with constructive feedback, suggestions, and edits. Be encouraging and supportive.',
      pricing_model: 'per_message',
      price_per_message: 1000,
      model_preference: 'gpt-4',
      temperature: 0.7,
      status: 'draft',
    },
  },
  {
    id: 'code-reviewer',
    icon: React.createElement(Code, { className: 'w-4 h-4' }),
    name: 'Code Reviewer',
    tagline: 'Review and improve your code.',
    defaults: {
      title: 'Code Reviewer',
      description:
        'Expert code reviewer that analyzes code, suggests improvements, finds bugs, and explains best practices. Supports multiple programming languages.',
      category: 'Code & Development',
      system_prompt:
        'You are an expert code reviewer. Analyze code for bugs, performance issues, and best practices. Provide clear, actionable feedback.',
      pricing_model: 'per_message',
      price_per_message_sats: 2000,
      model_preference: 'gpt-4',
      temperature: 0.3,
      status: 'draft',
    },
  },
  {
    id: 'customer-support',
    icon: React.createElement(MessageSquare, { className: 'w-4 h-4' }),
    name: 'Customer Support',
    tagline: 'Handle customer inquiries and support.',
    defaults: {
      title: 'Customer Support Assistant',
      description:
        'Professional customer support assistant that answers questions, resolves issues, and provides helpful information about products and services.',
      category: 'Customer Support',
      system_prompt:
        'You are a helpful customer support representative. Be friendly, professional, and solution-oriented. Always try to resolve customer issues.',
      pricing_model: 'per_message',
      price_per_message_sats: 500,
      model_preference: 'gpt-3.5-turbo',
      temperature: 0.5,
      status: 'draft',
    },
  },
  {
    id: 'tutor',
    icon: React.createElement(GraduationCap, { className: 'w-4 h-4' }),
    name: 'Personal Tutor',
    tagline: 'Learn any subject with AI guidance.',
    defaults: {
      title: 'Personal Tutor',
      description:
        'Personalized tutoring assistant that explains concepts, answers questions, and helps with homework across various subjects.',
      category: 'Education & Tutoring',
      system_prompt:
        'You are a patient and encouraging tutor. Explain concepts clearly, use examples, and adapt to the student\'s learning style.',
      pricing_model: 'per_message',
      price_per_message_sats: 1500,
      model_preference: 'gpt-4',
      temperature: 0.6,
      status: 'draft',
    },
  },
  {
    id: 'business-consultant',
    icon: React.createElement(Briefcase, { className: 'w-4 h-4' }),
    name: 'Business Consultant',
    tagline: 'Get expert business advice.',
    defaults: {
      title: 'Business Consultant',
      description:
        'Expert business consultant that provides strategic advice, market analysis, and helps with business planning and decision-making.',
      category: 'Business & Consulting',
      system_prompt:
        'You are an experienced business consultant. Provide strategic, actionable advice based on business best practices and market insights.',
      pricing_model: 'per_message',
      price_per_message_sats: 3000,
      model_preference: 'gpt-4',
      temperature: 0.5,
      status: 'draft',
    },
  },
  {
    id: 'design-assistant',
    icon: React.createElement(Palette, { className: 'w-4 h-4' }),
    name: 'Design Assistant',
    tagline: 'Creative design ideas and feedback.',
    defaults: {
      title: 'Design Assistant',
      description:
        'Creative design assistant that provides design ideas, feedback, and helps with color schemes, layouts, and visual concepts.',
      category: 'Creative & Design',
      system_prompt:
        'You are a creative design assistant. Provide innovative design ideas, color suggestions, and constructive feedback on visual concepts.',
      pricing_model: 'per_message',
      price_per_message_sats: 2000,
      model_preference: 'gpt-4',
      temperature: 0.8,
      status: 'draft',
    },
  },
  {
    id: 'research-assistant',
    icon: React.createElement(Search, { className: 'w-4 h-4' }),
    name: 'Research Assistant',
    tagline: 'Research and analyze information.',
    defaults: {
      title: 'Research Assistant',
      description:
        'Research assistant that helps gather information, analyze data, and synthesize findings on various topics.',
      category: 'Research & Analysis',
      system_prompt:
        'You are a thorough research assistant. Gather accurate information, analyze data objectively, and present findings clearly.',
      pricing_model: 'per_token',
      price_per_1k_tokens: 100,
      model_preference: 'gpt-4',
      temperature: 0.3,
      status: 'draft',
    },
  },
  {
    id: 'translator',
    icon: React.createElement(Languages, { className: 'w-4 h-4' }),
    name: 'Translator',
    tagline: 'Translate between languages accurately.',
    defaults: {
      title: 'Multi-Language Translator',
      description:
        'Professional translator that translates text between multiple languages while preserving meaning and context.',
      category: 'Language & Translation',
      system_prompt:
        'You are a professional translator. Translate text accurately while preserving meaning, tone, and cultural context.',
      pricing_model: 'per_message',
      price_per_message_sats: 800,
      model_preference: 'gpt-4',
      temperature: 0.2,
      status: 'draft',
    },
  },
  {
    id: 'health-advisor',
    icon: React.createElement(Heart, { className: 'w-4 h-4' }),
    name: 'Health Advisor',
    tagline: 'General health and wellness guidance.',
    defaults: {
      title: 'Health & Wellness Advisor',
      description:
        'Health advisor that provides general wellness information, fitness tips, and healthy lifestyle guidance. (Not medical advice)',
      category: 'Health & Wellness',
      system_prompt:
        'You are a health and wellness advisor. Provide general wellness information and healthy lifestyle tips. Always remind users to consult healthcare professionals for medical advice.',
      pricing_model: 'per_message',
      price_per_message_sats: 1500,
      model_preference: 'gpt-4',
      temperature: 0.6,
      status: 'draft',
    },
  },
  {
    id: 'legal-assistant',
    icon: React.createElement(Scale, { className: 'w-4 h-4' }),
    name: 'Legal Assistant',
    tagline: 'General legal information and guidance.',
    defaults: {
      title: 'Legal Information Assistant',
      description:
        'Legal assistant that provides general legal information and helps understand legal concepts. (Not legal advice)',
      category: 'Legal & Finance',
      system_prompt:
        'You are a legal information assistant. Provide general legal information and explain legal concepts. Always remind users to consult qualified attorneys for legal advice.',
      pricing_model: 'per_message',
      price_per_message_sats: 4000,
      model_preference: 'gpt-4',
      temperature: 0.4,
      status: 'draft',
    },
  },
  {
    id: 'creative-writer',
    icon: React.createElement(Sparkles, { className: 'w-4 h-4' }),
    name: 'Creative Writer',
    tagline: 'Unleash your creativity with AI.',
    defaults: {
      title: 'Creative Writing Assistant',
      description:
        'Creative writing assistant that helps with storytelling, character development, plot ideas, and creative writing projects.',
      category: 'Writing & Content',
      system_prompt:
        'You are a creative writing assistant. Help users develop stories, characters, and plots. Be imaginative and inspiring.',
      pricing_model: 'per_message',
      price_per_message_sats: 2000,
      model_preference: 'gpt-4',
      temperature: 0.9,
      status: 'draft',
    },
  },
];


