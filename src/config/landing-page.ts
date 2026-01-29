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
 */

import { LucideIcon, Bitcoin, Globe, Shield, Zap, Package, Rocket, Users, Bot } from 'lucide-react';

// ==================== SUPER-APP CATEGORIES ====================

/**
 * Main categories shown on landing page
 * Simplified from 13 entity types to 4 clear categories
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
    id: 'commerce',
    title: 'Commerce',
    description: 'Buy and sell with Bitcoin',
    icon: Package,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    features: [
      { title: 'Products', description: 'Sell physical or digital goods' },
      { title: 'Services', description: 'Offer your professional expertise' },
    ],
  },
  {
    id: 'funding',
    title: 'Funding',
    description: 'Raise and manage Bitcoin',
    icon: Rocket,
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50',
    features: [
      { title: 'Projects', description: 'Launch crowdfunding campaigns' },
      { title: 'Causes', description: 'Support meaningful initiatives' },
    ],
  },
  {
    id: 'community',
    title: 'Community',
    description: 'Connect and collaborate',
    icon: Users,
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    features: [
      { title: 'Groups', description: 'Build communities around shared interests' },
      { title: 'Events', description: 'Organize and attend meetups' },
    ],
  },
  {
    id: 'innovation',
    title: 'AI & Innovation',
    description: 'Build with intelligence',
    icon: Bot,
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50',
    features: [
      { title: 'AI Assistants', description: 'Create and monetize AI services' },
      { title: 'Research', description: 'Fund decentralized science' },
    ],
  },
];

// ==================== HOW IT WORKS STEPS ====================

/**
 * Unified 4-step process for all landing pages
 * Consistency: Same steps on home page and dedicated page
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
    icon: Users,
    title: 'Create Your Account',
    description: 'Sign up free in seconds. Get instant access to everything OrangeCat offers.',
    color: 'from-tiffany-500 to-tiffany-600',
    bgColor: 'bg-tiffany-50',
  },
  {
    number: '2',
    icon: Package,
    title: 'Choose What to Do',
    description:
      'Sell products, offer services, fund projects, build communities, deploy AI—pick what fits your needs.',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    number: '3',
    icon: Bitcoin,
    title: 'Transact with Bitcoin',
    description:
      'Link your wallet. Buy, sell, fund, or receive—all directly with Bitcoin. Zero platform fees.',
    color: 'from-bitcoinOrange to-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    number: '4',
    icon: Shield,
    title: 'Build Through Transparency',
    description: 'Every transaction on-chain. Share updates, build trust, grow your reputation.',
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
  { feature: 'Platform fees', traditional: '5-10%', orangecat: '0%', highlight: true },
  { feature: 'Geographic reach', traditional: 'Limited', orangecat: 'Global' },
  { feature: 'Funds control', traditional: 'Platform holds', orangecat: 'Direct to wallet' },
  { feature: 'Account freezing', traditional: 'Can happen', orangecat: 'Impossible' },
  { feature: 'Transaction speed', traditional: '3-7 days', orangecat: 'Instant' },
  { feature: 'Transparency', traditional: 'Limited', orangecat: 'Blockchain verified' },
];

// ==================== PLATFORM BENEFITS ====================

/**
 * Key benefits of using OrangeCat
 * Terminology: Uses "funding" not "donations" per domain-specific.md
 */
export interface PlatformBenefit {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const PLATFORM_BENEFITS: PlatformBenefit[] = [
  {
    icon: Bitcoin,
    title: 'No Platform Fees',
    description: 'Keep 100% of your funding. Bitcoin transactions go directly to your wallet.',
  },
  {
    icon: Globe,
    title: 'Works Globally',
    description: 'Accept support from anywhere in the world. No geographic restrictions.',
  },
  {
    icon: Shield,
    title: 'Transparent & Secure',
    description: 'All transactions are recorded on the Bitcoin blockchain. Fully auditable.',
  },
  {
    icon: Zap,
    title: 'Instant Setup',
    description: 'Create your page in minutes. No lengthy verification process.',
  },
];

// ==================== EXAMPLE USE CASES ====================

/**
 * Example use cases - clearly labeled as examples, not real testimonials
 * No fake names, numbers, or fabricated stories
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
    category: 'Creative',
    title: 'Fund Your Art',
    description:
      'Artists can raise funds for supplies, studio space, or new projects. Supporters see exactly how their contributions are used.',
    transparencyExample:
      'Share receipts for materials, post progress photos, show your creative process.',
    gradient: 'from-purple-50 to-pink-50',
  },
  {
    emoji: '🚀',
    category: 'Business',
    title: 'Launch Your Startup',
    description:
      'Entrepreneurs can fund inventory, equipment, or expansion. Build trust by showing how every sat is spent.',
    transparencyExample:
      'Document purchases, share milestones, post regular updates on business growth.',
    gradient: 'from-amber-50 to-orange-50',
  },
  {
    emoji: '🔬',
    category: 'Research',
    title: 'Advance Science',
    description:
      'Researchers can fund equipment, studies, or publications. Decentralized science funding with full accountability.',
    transparencyExample: 'Share lab updates, publish findings, document equipment purchases.',
    gradient: 'from-blue-50 to-cyan-50',
  },
  {
    emoji: '🏠',
    category: 'Community',
    title: 'Build Together',
    description:
      'Communities can pool resources for shared goals—events, spaces, or local initiatives.',
    transparencyExample:
      'Track collective contributions, show spending decisions, celebrate achievements.',
    gradient: 'from-green-50 to-emerald-50',
  },
];

// ==================== TRUST SIGNALS ====================

/**
 * Trust indicators shown at bottom of sections
 */
export const TRUST_SIGNALS = [
  'No platform fees',
  'Everything transparent',
  'Direct Bitcoin transfers',
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
    title: 'One Platform, Endless Possibilities',
    subtitle: 'Commerce, funding, community, and AI—all powered by Bitcoin.',
  },
  howItWorks: {
    title: 'How It Works',
    subtitle: 'From idea to execution in 4 simple steps.',
  },
  exampleUseCases: {
    title: 'Example Use Cases',
    subtitle: 'Here are some ways people use OrangeCat. The possibilities are endless.',
  },
  transparency: {
    title: 'The Transparency Difference',
    subtitle:
      'All Bitcoin transactions are public. Show how you use support. Build trust. Earn a transparency score.',
  },
  whyBitcoin: {
    title: 'Why Bitcoin? Why OrangeCat?',
    subtitle: 'Traditional platforms charge fees and control your funds. Bitcoin changes the game.',
  },
} as const;
