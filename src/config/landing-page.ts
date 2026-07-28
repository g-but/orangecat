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
  Bot,
} from 'lucide-react';
import { GRADIENTS } from '@/config/gradients';

// ==================== SUPER-APP CATEGORIES ====================

/**
 * Main categories shown on landing page
 * Reflects the full economic spectrum: exchange, funding, coordination, AI agent
 */
interface SuperAppCategory {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconGradient: string;
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
    iconGradient: GRADIENTS.iconBlue,
    bgColor: 'bg-surface-raised',
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
    iconGradient: GRADIENTS.iconOrange,
    bgColor: 'bg-surface-raised',
    features: [
      {
        title: 'Fund Projects & Causes',
        description:
          'From no-strings gifts to milestone-based backing — all funding forms supported',
      },
      {
        title: 'Loans & Investments',
        description: 'Peer-to-peer lending and equity-style investing without intermediaries',
      },
    ],
  },
  {
    id: 'coordination',
    title: 'Coordinate Together',
    description: 'Organize people, money, and decisions',
    icon: Scale,
    iconGradient: GRADIENTS.iconTiffany,
    bgColor: 'bg-surface-raised',
    features: [
      { title: 'Groups', description: 'Shared treasuries, roles, and collective decisions' },
      {
        title: 'Circles & Events',
        description: 'Lighter communities and time-bound coordination',
      },
    ],
  },
  {
    id: 'ai',
    title: 'Your Cat',
    description: 'An AI agent that acts on your behalf',
    icon: Bot,
    iconGradient: GRADIENTS.iconTiffany,
    bgColor: 'bg-surface-raised',
    features: [
      {
        title: 'Cat',
        description:
          'Your personal AI economic agent — sets up entities, manages activity, and acts on your behalf.',
      },
      {
        title: 'AI Assistants',
        description:
          'Deploy AI agents for your group or project. They can earn, spend, and coordinate autonomously.',
      },
    ],
  },
];

// ==================== HOW IT WORKS STEPS ====================

/**
 * Unified 4-step process — Cat-centric flow
 */
interface HowItWorksStep {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
  iconGradient: string;
  bgColor: string;
}

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    number: '1',
    icon: Lock,
    title: 'Choose Your Identity',
    description: 'Use your real name, a handle, or anything in between. Your identity, your rules.',
    iconGradient: GRADIENTS.iconTiffany,
    bgColor: 'bg-surface-raised',
  },
  {
    number: '2',
    icon: Cat,
    title: 'Meet Your Cat',
    description:
      'Your AI economic agent is ready. Tell it what you want to do — sell, fund, lend, invest, or coordinate.',
    iconGradient: GRADIENTS.iconTiffany,
    bgColor: 'bg-surface-raised',
  },
  {
    number: '3',
    icon: Wallet,
    title: 'Pick Your Currency',
    description:
      'Price your work in any display currency. Payments settle natively in Bitcoin and Lightning: global, non-custodial, and independently verifiable.',
    iconGradient: GRADIENTS.iconOrange,
    bgColor: 'bg-surface-raised',
  },
  {
    number: '4',
    icon: TrendingUp,
    title: 'Economic Activity Begins',
    description:
      'Buy, sell, fund, lend, invest, or coordinate. Your Cat keeps track, surfaces insights, and acts on your behalf.',
    iconGradient: GRADIENTS.iconGreen,
    bgColor: 'bg-surface-raised',
  },
];

// ==================== FEE CLAIMS — SSOT for "0% / 100%" language ====================

/**
 * Fee-related marketing claims. These were previously hardcoded in 5+
 * places (HeroSectionStatic, events/page.tsx, how-it-works, technology,
 * inline `0% fees` badges). Keeping them here means one edit covers every
 * surface the moment the claim stops being true — and prevents drift like
 * "100% to creator" on one page and "100% reaches the recipient" on another.
 */
export const FEE_CLAIMS = {
  platformFee: '0%',
  creatorShare: '100%',
  feeBadgeLabel: '0% fees',
  feeStatTopLabel: 'Platform Fees',
  feeStatBottomLabel: 'To Creator',
  // Use for body copy where you previously said "100% reaches the recipient"
  passthroughClaim: '100% reaches the recipient — no middleman, no processing costs.',
} as const;

// ==================== PLATFORM COMPARISON ====================

/**
 * Comparison between traditional platforms and OrangeCat
 * Used in TrustSection
 */
interface ComparisonRow {
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
    orangecat: 'Bitcoin and Lightning settlement',
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
interface PlatformBenefit {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const PLATFORM_BENEFITS: PlatformBenefit[] = [
  {
    icon: Cat,
    title: 'Your AI Cat',
    description:
      'Cat is your personal economic agent. It sets up entities, manages activity, and acts on your behalf.',
  },
  {
    icon: Globe,
    title: 'No Gatekeepers',
    description:
      'No middlemen, no verification walls, no account freezing. Economic participation as open as speech.',
  },
  {
    icon: Wallet,
    title: 'Bitcoin First',
    description:
      'Lightning and on-chain Bitcoin are the live payment rails. Other rails remain roadmap research.',
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
interface ExampleUseCase {
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
      'Artists, writers, and makers can raise funds, sell work, and accept Bitcoin support from anywhere, under any identity.',
    transparencyExample:
      'Share receipts and progress updates publicly, or keep it private. Your choice.',
    gradient: 'bg-surface-base',
  },
  {
    emoji: '🚀',
    category: 'Entrepreneur',
    title: 'Build Without Permission',
    description:
      'Launch products, offer services, and raise funding — no platform approval, no geography limits, no identity requirements.',
    transparencyExample:
      'Your Cat helps you set up your store, manage pricing, and track payments automatically.',
    gradient: 'bg-surface-base',
  },
  {
    emoji: '🔬',
    category: 'Research',
    title: 'Decentralized Science',
    description:
      'Fund equipment, studies, and publications with direct Bitcoin and Lightning support.',
    transparencyExample: 'Publish findings, share lab updates, build scientific credibility.',
    gradient: 'bg-surface-base',
  },
  {
    emoji: '🏛️',
    category: 'Community',
    title: 'Coordinate Together',
    description:
      'Organize shared treasuries, collective decisions, and community activity — with or without revealing identities.',
    transparencyExample:
      'Groups have their own Cat. It manages the treasury and executes collective decisions.',
    gradient: 'bg-surface-base',
  },
];

// ==================== TRUST SIGNALS ====================

/**
 * Trust indicators shown at bottom of sections
 */
export const TRUST_SIGNALS = [
  'Zero platform fees',
  'Bitcoin and Lightning payments',
  'No account freezing',
  'Open source',
] as const;

// ==================== CTA COPY ====================

/**
 * Consistent CTA labels across the site
 */
export const CTA_LABELS = {
  primaryAction: 'Start Creating',
  secondaryAction: 'Explore the Platform',
  discoverAction: 'Discover',
  createAccount: 'Create Free Account',
  startCreating: 'Start Creating',
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
    title: 'Everyone Can Make Things',
    subtitle:
      'Products, services, projects, causes, events, loans, investments — anyone can create any of these under any identity and settle in Bitcoin.',
  },
  howItWorks: {
    title: 'Meet Your Cat',
    subtitle:
      'Your AI economic agent finds you ways to earn and sets them up. You decide what to pursue.',
  },
  exampleUseCases: {
    title: 'Built for Makers',
    subtitle:
      'Any person, pseudonym, or organization can create and participate fully. Here are some examples.',
  },
  transparency: {
    title: 'Private Where It Matters, Transparent Where You Choose',
    subtitle:
      'Private messaging (E2E encryption planned). On-chain Bitcoin transparency when you want it. Your data, your rules.',
  },
  whyBitcoin: {
    title: 'Why OrangeCat?',
    subtitle:
      'Traditional platforms gatekeep, freeze accounts, and force identity. OrangeCat removes all of that.',
  },
} as const;
