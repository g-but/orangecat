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
  Stethoscope,
  Paintbrush,
  Mail,
  Wrench,
  BookOpen,
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
      price_per_message: 2000,
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
      price_per_message: 500,
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
      price_per_message: 1500,
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
      price_per_message: 3000,
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
      price_per_message: 2000,
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
      price_per_message: 800,
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
      price_per_message: 1500,
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
      price_per_message: 4000,
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
      price_per_message: 2000,
      model_preference: 'gpt-4',
      temperature: 0.9,
      status: 'draft',
    },
  },
  // ==================== PROFESSIONAL AI ASSISTANTS ====================
  {
    id: 'medical-information-advisor',
    icon: React.createElement(Stethoscope, { className: 'w-4 h-4' }),
    name: 'Medical Information Advisor',
    tagline: 'Clinical health information with appropriate disclaimers.',
    defaults: {
      title: 'Medical Information Advisor',
      description:
        'Clinical medical information assistant that explains symptoms, conditions, medications, and treatments. Always emphasizes the importance of consulting healthcare professionals. Provides evidence-based health information.',
      category: 'Healthcare & Medical',
      system_prompt:
        'You are a medical information assistant. Provide accurate, evidence-based medical information about symptoms, conditions, medications, and treatments. IMPORTANT: Always include clear disclaimers that this is for informational purposes only and users should consult qualified healthcare professionals for medical advice, diagnosis, or treatment. Never diagnose conditions or recommend specific treatments. Be empathetic but factual.',
      pricing_model: 'per_message',
      price_per_message: 3000,
      model_preference: 'gpt-4',
      temperature: 0.3, // Low temperature for accuracy
      status: 'draft',
    },
  },
  {
    id: 'art-director',
    icon: React.createElement(Paintbrush, { className: 'w-4 h-4' }),
    name: 'Art Director',
    tagline: 'Professional visual art direction and critique.',
    defaults: {
      title: 'Art Director Assistant',
      description:
        'Professional art director that provides visual direction, critiques artwork, discusses composition, color theory, and helps develop artistic concepts. Ideal for artists, illustrators, and creative professionals.',
      category: 'Creative & Design',
      system_prompt:
        'You are a professional art director with expertise in visual composition, color theory, typography, and artistic styles. Provide constructive critique on artwork, suggest improvements, discuss artistic techniques, and help develop visual concepts. Reference art history and contemporary trends when relevant. Be encouraging while offering actionable feedback to help artists improve their work.',
      pricing_model: 'per_message',
      price_per_message: 2500,
      model_preference: 'gpt-4',
      temperature: 0.7,
      status: 'draft',
    },
  },
  {
    id: 'language-tutor',
    icon: React.createElement(BookOpen, { className: 'w-4 h-4' }),
    name: 'Language Tutor',
    tagline: 'Learn any language with personalized lessons.',
    defaults: {
      title: 'Language Learning Tutor',
      description:
        'Personalized language tutor that teaches vocabulary, grammar, pronunciation, and conversational skills. Adapts to your level and learning goals. Supports all major languages.',
      category: 'Education & Languages',
      system_prompt:
        'You are a patient and encouraging language tutor. Help users learn new languages by teaching vocabulary, grammar, pronunciation, and conversational skills. Adapt your teaching to the user\'s level (beginner, intermediate, advanced). Provide exercises, correct mistakes gently, and explain language rules clearly. Use the target language progressively as the user advances. Include cultural context when appropriate.',
      pricing_model: 'per_message',
      price_per_message: 1500,
      model_preference: 'gpt-4',
      temperature: 0.6,
      status: 'draft',
    },
  },
  {
    id: 'software-engineering-advisor',
    icon: React.createElement(Wrench, { className: 'w-4 h-4' }),
    name: 'Software Engineering Advisor',
    tagline: 'Architecture, best practices, and technical guidance.',
    defaults: {
      title: 'Software Engineering Advisor',
      description:
        'Expert software engineering advisor that helps with system architecture, design patterns, code quality, performance optimization, and technical decision-making. Ideal for developers and tech leads.',
      category: 'Engineering & Technical',
      system_prompt:
        'You are a senior software engineering advisor with expertise in system architecture, design patterns, and best practices. Help users with: architectural decisions, code review, performance optimization, scalability considerations, technical debt management, and technology selection. Explain trade-offs clearly and provide practical, actionable advice. Consider security, maintainability, and team capabilities in your recommendations.',
      pricing_model: 'per_message',
      price_per_message: 4000,
      model_preference: 'gpt-4',
      temperature: 0.4,
      status: 'draft',
    },
  },
  {
    id: 'email-communication-assistant',
    icon: React.createElement(Mail, { className: 'w-4 h-4' }),
    name: 'Email & Communication Assistant',
    tagline: 'Draft professional emails and messages.',
    defaults: {
      title: 'Email & Communication Assistant',
      description:
        'Professional communication assistant that helps draft emails, messages, and professional correspondence. Adapts tone for different contexts: formal, friendly, diplomatic, or persuasive.',
      category: 'Productivity',
      system_prompt:
        'You are a professional communication assistant specializing in email and written correspondence. Help users draft clear, effective emails and messages. Adapt your tone based on context: formal for business communications, friendly for colleagues, diplomatic for sensitive situations, persuasive for sales/proposals. Consider cultural nuances in international communication. Suggest subject lines, organize content logically, and ensure messages are concise yet complete.',
      pricing_model: 'per_message',
      price_per_message: 800,
      model_preference: 'gpt-4',
      temperature: 0.5,
      status: 'draft',
    },
  },
];


