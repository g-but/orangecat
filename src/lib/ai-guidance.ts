/**
 * AI Settings Field Guidance Content
 *
 * Single source of truth for AI settings guidance.
 * Used by DynamicSidebar and AIGuidanceSidebar to provide contextual help.
 *
 * Created: 2026-01-20
 * Last Modified: 2026-01-20
 */

import React from 'react';
import {
  Key,
  Cpu,
  Zap,
  DollarSign,
  Eye,
  Settings2,
  Layers,
  Bot,
  Sparkles,
  Lock,
  TrendingUp,
} from 'lucide-react';
import type { FieldGuidanceContent, DefaultContent } from '@/lib/project-guidance';

export type AIFieldType =
  | 'provider'
  | 'apiKey'
  | 'defaultModel'
  | 'defaultTier'
  | 'autoRouter'
  | 'maxCostSats'
  | 'requireVision'
  | 'requireFunctionCalling'
  | null;

export const aiGuidanceContent: Record<NonNullable<AIFieldType>, FieldGuidanceContent> = {
  provider: {
    icon: React.createElement(Layers, { className: 'w-5 h-5 text-tiffany' }),
    title: 'AI Provider',
    description:
      'Choose how you access AI models. Aggregators like OpenRouter give you access to many models with one key, while direct providers offer specific models from the source.',
    tips: [
      'OpenRouter is recommended for beginners - one key for 100+ models',
      'Direct providers (Anthropic, OpenAI) offer lowest latency',
      'Aggregators handle fallbacks automatically if a model is down',
      'You can add keys from multiple providers',
    ],
    examples: [
      'OpenRouter - Access Claude, GPT-4, Llama, and more with one key',
      'Anthropic - Direct Claude access with latest features',
      'OpenAI - Direct GPT-4 access with function calling',
    ],
  },
  apiKey: {
    icon: React.createElement(Key, { className: 'w-5 h-5 text-tiffany' }),
    title: 'API Key',
    description:
      'Your API key is like a password that lets OrangeCat use AI models on your behalf. It is stored encrypted and never leaves your account.',
    tips: [
      'Never share your API key with anyone',
      'Create a separate key for OrangeCat (easy to revoke if needed)',
      'Your key is encrypted with AES-256-GCM before storage',
      'Keys starting with "sk-" are typically from OpenAI or OpenRouter',
      'Anthropic keys start with "sk-ant-"',
    ],
    examples: [
      'OpenRouter: sk-or-v1-xxxxxxxx...',
      'Anthropic: sk-ant-api03-xxxxxxxx...',
      'OpenAI: sk-proj-xxxxxxxx...',
    ],
  },
  defaultModel: {
    icon: React.createElement(Cpu, { className: 'w-5 h-5 text-tiffany' }),
    title: 'Default Model',
    description:
      'The AI model used by default for your conversations. Different models have different strengths, speeds, and costs.',
    tips: [
      'Claude 3.5 Sonnet is great for coding and analysis',
      'GPT-4o excels at structured output and vision',
      'Free models like Llama 4 are great for simple tasks',
      'You can change models per-conversation if needed',
    ],
    examples: [
      'Claude 3.5 Sonnet - Best balance of speed and quality',
      'GPT-4o Mini - Fast and affordable for simple tasks',
      'Llama 4 Maverick - Free with rate limits',
    ],
  },
  defaultTier: {
    icon: React.createElement(Sparkles, { className: 'w-5 h-5 text-tiffany' }),
    title: 'Default Tier',
    description:
      'Model tiers group AI models by capability and cost. Choose based on your typical usage patterns.',
    tips: [
      'Free tier: No cost, rate limited (50-1000 requests/day)',
      'Economy tier: Fast & cheap for simple tasks',
      'Standard tier: Best balance of performance and cost',
      'Premium tier: Maximum capability for complex tasks',
    ],
    examples: [
      'Free - Daily questions, simple conversations',
      'Economy - Customer support, quick analysis',
      'Standard - Coding, research, creative writing',
      'Premium - Complex reasoning, expert analysis',
    ],
  },
  autoRouter: {
    icon: React.createElement(Zap, { className: 'w-5 h-5 text-tiffany' }),
    title: 'Auto Router',
    description:
      'Automatically selects the best model based on your message complexity. Simple questions use cheaper models, complex ones use more powerful models.',
    tips: [
      'Saves money by using cheaper models for simple tasks',
      'Analyzes message complexity, length, and keywords',
      'Falls back to free models when appropriate',
      'Can be overridden per-conversation',
    ],
    examples: [
      '"What time is it?" → Uses economy model',
      '"Explain quantum computing" → Uses standard model',
      '"Refactor this complex codebase" → Uses premium model',
    ],
  },
  maxCostSats: {
    icon: React.createElement(DollarSign, { className: 'w-5 h-5 text-tiffany' }),
    title: 'Maximum Cost (Sats)',
    description:
      'Set a cost limit per request in satoshis. The auto-router will not select models that exceed this limit.',
    tips: [
      'Prevents expensive requests by accident',
      'Set to 0 for unlimited (not recommended)',
      '100 sats covers most standard model requests',
      'Premium models may need 500+ sats for long conversations',
    ],
    examples: [
      '50 sats - Limits to economy models only',
      '100 sats - Standard tier ceiling',
      '500 sats - Allows premium for complex tasks',
    ],
  },
  requireVision: {
    icon: React.createElement(Eye, { className: 'w-5 h-5 text-tiffany' }),
    title: 'Require Vision',
    description:
      'When enabled, only models with vision capability (image understanding) will be selected by the auto-router.',
    tips: [
      'Enable if you frequently share images or screenshots',
      'Models like GPT-4o and Claude 3.5 Sonnet support vision',
      'Disabling allows more model options for text-only tasks',
      'Can be toggled per-conversation',
    ],
    examples: [
      'Analyzing screenshots or diagrams',
      'Understanding UI mockups',
      'Reading text from images',
    ],
  },
  requireFunctionCalling: {
    icon: React.createElement(Settings2, { className: 'w-5 h-5 text-tiffany' }),
    title: 'Require Function Calling',
    description:
      'When enabled, only models that support function/tool calling will be selected. Useful for advanced AI integrations.',
    tips: [
      'Required for AI agents that use tools',
      'OpenAI and Anthropic models support this well',
      'Most free models do not support function calling',
      'Typically only needed for developer integrations',
    ],
    examples: [
      'AI assistants that browse the web',
      'Automated data analysis pipelines',
      'Custom tool integrations',
    ],
  },
};

export const aiDefaultContent: DefaultContent = {
  title: 'What is My AI?',
  description:
    'My AI is your personal AI infrastructure on OrangeCat. Bring your own API keys to access powerful AI models, or use the free tier to get started.',
  features: [
    {
      icon: React.createElement(Bot, { className: 'w-4 h-4 text-tiffany' }),
      text: 'Access 100+ AI models through one interface',
    },
    {
      icon: React.createElement(Lock, { className: 'w-4 h-4 text-tiffany' }),
      text: 'Your keys are encrypted with AES-256-GCM',
    },
    {
      icon: React.createElement(TrendingUp, { className: 'w-4 h-4 text-tiffany' }),
      text: 'Track usage and costs in satoshis',
    },
    {
      icon: React.createElement(Zap, { className: 'w-4 h-4 text-tiffany' }),
      text: 'Auto-router optimizes model selection for cost',
    },
  ],
  hint: '💡 Click into a field on the left to see focused guidance here.',
};

// ==================== ONBOARDING CONTENT ====================

export interface OnboardingStepContent {
  title: string;
  description: string;
  whyTitle?: string;
  whyContent?: string;
  tips?: string[];
  warnings?: string[];
}

export const aiOnboardingContent: Record<string, OnboardingStepContent> = {
  welcome: {
    title: 'Welcome to My AI',
    description:
      'AI models are powerful tools that can help you code, write, analyze, and create. Let us help you set up your personal AI infrastructure.',
    whyTitle: 'Why do you need AI keys?',
    whyContent:
      'AI models like Claude and GPT-4 require API keys to use. By bringing your own key, you pay only for what you use - no subscriptions, no surprises.',
    tips: [
      'You control your data and usage',
      'Pay per token - no monthly fees',
      'Switch models anytime',
      'Free tier available to try first',
    ],
  },
  provider: {
    title: 'Choose Your Provider',
    description: 'Select how you want to access AI models. We recommend OpenRouter for most users.',
    whyTitle: 'Aggregator vs Direct?',
    whyContent:
      'Aggregators like OpenRouter give you one key for many models. Direct providers offer specific models with lowest latency.',
    tips: [
      'OpenRouter: One key, 100+ models, simple billing',
      'Anthropic: Best for Claude power users',
      'OpenAI: Best for GPT-4 and embeddings',
    ],
  },
  getKey: {
    title: 'Get Your API Key',
    description: 'Follow these steps to get your API key from your chosen provider.',
    warnings: [
      'Never share your API key publicly',
      'Create a dedicated key for OrangeCat',
      'Store your key safely - you cannot see it again',
    ],
    tips: [
      'Use a password manager to store your key',
      'Set usage limits on your provider dashboard',
      'You can revoke and create new keys anytime',
    ],
  },
  addKey: {
    title: 'Add Your API Key',
    description: 'Paste your API key below. It will be encrypted and securely stored.',
    whyTitle: 'How is my key protected?',
    whyContent:
      'Your key is encrypted using AES-256-GCM before storage. Only your account can decrypt and use it. Even we cannot see your key.',
    tips: ['Keys are encrypted at rest', 'Transmitted over HTTPS only', 'Can be deleted anytime'],
    warnings: ['Double-check your key is complete', 'Keys typically start with "sk-"'],
  },
  configure: {
    title: 'Configure Your Preferences',
    description: 'Set your default model and preferences. You can always change these later.',
    tips: [
      'Auto-router saves money on simple tasks',
      'Set a cost limit to avoid surprises',
      'Claude 3.5 Sonnet is great for most tasks',
    ],
  },
  complete: {
    title: 'You are All Set!',
    description:
      'Your AI is configured and ready to use. Start chatting with My Cat or explore the AI features.',
    tips: [
      'Try asking My Cat a question',
      'Change settings anytime in AI Settings',
      'Add more providers for fallback options',
    ],
  },
};

// ==================== TIER DESCRIPTIONS ====================

export const tierDescriptions = {
  free: {
    title: 'Free Tier',
    description: 'No API cost, rate limited to 50-1000 requests per day',
    bestFor: 'Trying out AI, simple questions, learning',
    models: ['Llama 4 Maverick', 'Gemini 2.0 Flash', 'DeepSeek Chat'],
  },
  economy: {
    title: 'Economy Tier',
    description: 'Fast and affordable for everyday tasks',
    bestFor: 'Quick answers, summaries, simple analysis',
    models: ['Claude 3 Haiku', 'GPT-4o Mini', 'Gemini Flash Lite'],
  },
  standard: {
    title: 'Standard Tier',
    description: 'Best balance of performance and cost',
    bestFor: 'Coding, writing, research, creative work',
    models: ['Claude 3.5 Sonnet', 'GPT-4o', 'Gemini 2.0 Flash'],
  },
  premium: {
    title: 'Premium Tier',
    description: 'Maximum capability for complex tasks',
    bestFor: 'Complex reasoning, expert analysis, research',
    models: ['Claude 3 Opus', 'GPT-4 Turbo', 'Gemini 2.0 Pro'],
  },
};
