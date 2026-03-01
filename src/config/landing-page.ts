/**
 * Landing Page Configuration - Single Source of Truth
 *
 * All content for public landing pages is defined here.
 * Components import from this file to ensure consistency.
 *
 * BENEFITS:
 * - Easy to update copy without touching components
 * - Consistent messaging across pages
 * - Non-engineers can update content
 * - Follows SSOT principle from CLAUDE.md
 *
 * Created: 2026-01-28
 * Last updated: 2026-03-01 — Aligned with vision: Cat-centric, universal payments, pseudonymous-by-default
 */

import {
  LucideIcon,
  Globe,
  Package,
  Lock,
  Wallet,
  Scale,
  Coins,
  Cat,
  TrendingUp,
} from 'lucide-react';

// ==================== SUPER-APP CATEGORIES ====================

/**
 * Main categories shown on landing page
 * Reflects the full economic spectrum: exchange → funding → governance → AI agent
 */
export interface SuperAppCategory {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  features: {
    title: string;
    description: string;
  }[];
}

export const SUPER_APP_CATEGORIES: SuperAppCategory[] = [
  {
    id: 'exchange',
    title: 'Exchange',
    description: 'Buy and sell with anyone',
    icon: Package,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    features: [
      { title: 'Products', description: 'Sell physical or digital goods to anyone, anywhere' },
      { title: 'Services', description: 'Offer your expertise — hourly, fixed, or on your terms' },
    ],
  },
  {
    id: 'finance',
    title: 'Fund & Finance',
    description: 'From gifts to investments',
    icon: Coins,
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50',
    features: [
      {
        title: 'Fund Projects & Causes',
        description: 'No-strings donations to milestone-based funding — all forms supported',
      },
      {
        title: 'Loans & Investments',
        description: 'Peer-to-peer lending and equity-style investing without intermediaries',
      },
    ],
  },
  {
    id: 'governance',
    title: 'Govern Together',
    description: 'Organize and decide as one',
    icon: Scale,
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    features: [
      { title: 'Groups', description: 'Shared treasuries, collective decisions, governance rules' },
      {
        title: 'Circles & Events',
        description: 'Lighter communities and time-bound coordination',
      },
    ],
  },
  {
    id: 'your-cat',
    title: 'Your Cat',
    description: 'AI that acts on your behalf',
    icon: Cat,
    color: 'from-tiffany-500 to-tiffany-600',
    bgColor: 'bg-tiffany-50',
    features: [
      {
        title: 'My Cat',
        description: 'Your personal AI economic agent — it buys, sells, funds, and governs for you',
      },
      {
        title: 'AI Assistants',
        description: 'Deploy AI agents as independent economic actors and monetize them',
      },
    ],
  },
];

// ==================== HOW IT WORKS STEPS ====================

/**
 * Unified 4-step process — Cat-centric flow
 */
export interface HowItWorksStep {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    number: '1',
    icon: Lock,
    title: 'Choose Your Identity',
    description: 'Use your real name, a handle, or anything in between. Your identity, your rules.',
    color: 'from-tiffany-500 to-tiffany-600',
    bgColor: 'bg-tiffany-50',
  },
  {
    number: '2',
    icon: Cat,
    title: 'Meet Your Cat',
    description:
      'Your AI economic agent is ready. Tell it what you want to do — sell, fund, lend, invest, or govern.',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    number: '3',
    icon: Wallet,
    title: 'Pick Your Currency',
    description:
      'Bitcoin and Lightning native — but Twint, PayPal, Monero, and local payment methods worldwide are all first-class. Meet your counterparty where they are.',
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    number: '4',
    icon: TrendingUp,
    title: 'Economic Activity Begins',
    description:
      'Buy, sell, fund, lend, invest, or govern. Your Cat keeps track, surfaces insights, and acts on your behalf.',
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50',
  },
];

// ==================== PLATFORM COMPARISON ====================

/**
 * Comparison between traditional platforms and OrangeCat
 * Used in TrustSection
 */
export interface ComparisonRow {
  feature: string;
  traditional: string;
  orangecat: string;
  highlight?: boolean;
}

export const PLATFORM_COMPARISON: ComparisonRow[] = [
  {
    feature: 'Identity',
    traditional: 'Real name + documents',
    orangecat: 'Your name, your rules',
    highlight: true,
  },
  {
    feature: 'Payment methods',
    traditional: 'One currency, their rules',
    orangecat: 'Any currency — Bitcoin, Twint, PayPal, Monero…',
    highlight: true,
  },
  { feature: 'Platform fees', traditional: '5–10%', orangecat: '0%' },
  { feature: 'AI agent', traditional: 'None', orangecat: 'Your Cat acts on your behalf' },
  { feature: 'Account freezing', traditional: 'Can happen anytime', orangecat: 'Impossible' },
  { feature: 'Geographic reach', traditional: 'Limited', orangecat: 'Global, no restrictions' },
  {
    feature: 'Funds control',
    traditional: 'Platform holds your money',
    orangecat: 'Direct to your wallet',
  },
];

// ==================== PLATFORM BENEFITS ====================

/**
 * Key benefits of using OrangeCat
 */
export interface PlatformBenefit {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const PLATFORM_BENEFITS: PlatformBenefit[] = [
  {
    icon: Cat,
    title: 'Your AI Cat',
    description:
      'My Cat is your personal economic agent. It sets up entities, manages activity, and acts on your behalf.',
  },
  {
    icon: Globe,
    title: 'No Gatekeepers',
    description:
      'No middlemen, no verification walls, no account freezing. Economic participation as open as speech.',
  },
  {
    icon: Wallet,
    title: 'Any Currency',
    description:
      'Bitcoin and Lightning are native, but Twint, PayPal, Monero, and local payment methods worldwide are first-class.',
  },
  {
    icon: Lock,
    title: 'Any Identity',
    description:
      'Any person or organization can participate fully. Use any name — your identity is yours to define.',
  },
];

// ==================== EXAMPLE USE CASES ====================

/**
 * Example use cases — clearly labeled as examples, not real testimonials
 */
export interface ExampleUseCase {
  emoji: string;
  category: string;
  title: string;
  description: string;
  transparencyExample: string;
  gradient: string;
}

export const EXAMPLE_USE_CASES: ExampleUseCase[] = [
  {
    emoji: '🎨',
    category: 'Creator',
    title: 'Fund Your Work',
    description:
      'Artists, writers, and makers can raise funds, sell work, and accept support — from anywhere, in any currency, under any identity.',
    transparencyExample:
      'Share receipts and progress updates publicly, or keep it private. Your choice.',
    gradient: 'from-purple-50 to-pink-50',
  },
  {
    emoji: '🚀',
    category: 'Entrepreneur',
    title: 'Build Without Permission',
    description:
      'Launch products, offer services, and raise funding — no platform approval, no geography limits, no identity requirements.',
    transparencyExample:
      'Your Cat helps you set up your store, manage pricing, and track payments automatically.',
    gradient: 'from-amber-50 to-orange-50',
  },
  {
    emoji: '🔬',
    category: 'Research',
    title: 'Decentralized Science',
    description:
      'Fund equipment, studies, and publications. Accept Bitcoin, PayPal, Twint — whatever your supporters use.',
    transparencyExample: 'Publish findings, share lab updates, build scientific credibility.',
    gradient: 'from-blue-50 to-cyan-50',
  },
  {
    emoji: '🏛️',
    category: 'Community',
    title: 'Govern Together',
    description:
      'Organize shared treasuries, collective decisions, and community governance — with or without revealing identities.',
    transparencyExample:
      'Groups have their own Cat. It manages the treasury and executes collective decisions.',
    gradient: 'from-green-50 to-emerald-50',
  },
];

// ==================== TRUST SIGNALS ====================

/**
 * Trust indicators shown at bottom of sections
 */
export const TRUST_SIGNALS = [
  'Zero platform fees',
  'Any currency accepted',
  'No account freezing',
  'Open source',
] as const;

// ==================== CTA COPY ====================

/**
 * Consistent CTA labels across the site
 */
export const CTA_LABELS = {
  primaryAction: 'Get Started Free',
  secondaryAction: 'Explore the Platform',
  discoverAction: 'Discover',
  createAccount: 'Create Free Account',
  viewProject: 'View Project',
  learnMore: 'Learn More',
  browseAll: 'Browse All',
} as const;

// ==================== SECTION HEADERS ====================

/**
 * Consistent section headers
 */
export const SECTION_HEADERS = {
  whatCanYouDo: {
    title: 'The Full Economic Spectrum',
    subtitle:
      'Exchange, fund, lend, invest, and govern — with your AI agent, in any currency, under any identity.',
  },
  howItWorks: {
    title: 'Meet Your Cat',
    subtitle: 'Your AI economic agent handles the complexity. You focus on what matters.',
  },
  exampleUseCases: {
    title: 'Built for Everyone',
    subtitle:
      'Any person, pseudonym, or organization can participate fully. Here are some examples.',
  },
  transparency: {
    title: 'Private Where It Matters, Transparent Where You Choose',
    subtitle:
      'End-to-end encrypted messaging. On-chain Bitcoin transparency when you want it. Your data, your rules.',
  },
  whyBitcoin: {
    title: 'Why OrangeCat?',
    subtitle:
      'Traditional platforms gatekeep, freeze accounts, and force identity. OrangeCat removes all of that.',
  },
} as const;
