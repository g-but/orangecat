/**
 * DEMO DATA - Realistic Mock Data for OrangeCat 3.0 Demo
 *
 * This module provides comprehensive mock data that showcases all platform features.
 * Data is designed to feel authentic and demonstrate real-world use cases.
 *
 * Created: 2025-12-03
 * Last Modified: 2025-12-03
 * Last Modified Summary: Initial creation with comprehensive demo data
 */

import type { Circle, CircleWallet, CircleActivity, CircleRole } from '@/types/circles';
import type { Loan, LoanOffer, LoanStatus, LoanOfferStatus } from '@/types/loans';

// ==================== USER DATA ====================

export interface DemoUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  balance: number;
  circleCount: number;
  loanCount: number;
  reputation: number;
}

export const DEMO_USER: DemoUser = {
  id: 'demo-user-001',
  name: 'Alex Chen',
  username: 'alexchen',
  avatar: '🎯',
  balance: 125000,
  circleCount: 3,
  loanCount: 1,
  reputation: 4.8,
};

// ==================== CIRCLE DATA ====================

export interface DemoCircleWallet {
  name: string;
  balance: number;
  purpose: string;
}

export interface DemoCircle {
  id: number;
  name: string;
  description: string;
  avatar: string;
  memberCount: number;
  totalBalance: number;
  projects: number;
  category: string;
  isPublic: boolean;
  userRole: CircleRole;
  recentActivity: string;
  wallets: DemoCircleWallet[];
}

export const DEMO_CIRCLES: DemoCircle[] = [
  {
    id: 1,
    name: 'Bitcoin Builders Collective',
    description: 'A community of developers building the future of Bitcoin',
    avatar: '🔨',
    memberCount: 247,
    totalBalance: 2500000,
    projects: 12,
    category: 'Community',
    isPublic: true,
    userRole: 'admin',
    recentActivity: 'Sarah launched a new wallet project',
    wallets: [
      { name: 'Development Fund', balance: 850000, purpose: 'Project funding' },
      { name: 'Community Grants', balance: 1200000, purpose: 'Member support' },
      { name: 'Emergency Fund', balance: 450000, purpose: 'Backup funds' },
    ],
  },
  {
    id: 2,
    name: 'Green Energy Innovators',
    description: 'Sustainable energy projects using Bitcoin',
    avatar: '🌱',
    memberCount: 89,
    totalBalance: 1800000,
    projects: 5,
    category: 'Business',
    isPublic: true,
    userRole: 'member',
    recentActivity: 'New solar panel project funded',
    wallets: [
      { name: 'Main Fund', balance: 1200000, purpose: 'Project investments' },
      { name: 'Research', balance: 600000, purpose: 'R&D funding' },
    ],
  },
  {
    id: 3,
    name: 'Family Investment Club',
    description: 'Private family investment decisions',
    avatar: '🏠',
    memberCount: 8,
    totalBalance: 500000,
    projects: 2,
    category: 'Family',
    isPublic: false,
    userRole: 'owner',
    recentActivity: 'Monthly dividend distributed',
    wallets: [
      { name: 'Investment Portfolio', balance: 350000, purpose: 'Long-term investments' },
      { name: 'Emergency Savings', balance: 150000, purpose: 'Family security' },
    ],
  },
];

// ==================== LOAN DATA ====================

export interface DemoLoanOffer {
  id: number;
  offerer: string;
  amount: number;
  rate: number;
  term: number;
  monthlyPayment: number;
  status: LoanOfferStatus;
  avatar: string;
}

export interface DemoLoan {
  id: number;
  title: string;
  originalAmount: number;
  remainingBalance: number;
  interestRate: number;
  monthlyPayment: number;
  lender: string;
  status: LoanStatus;
  offers: DemoLoanOffer[];
}

export const DEMO_LOANS: DemoLoan[] = [
  {
    id: 1,
    title: 'Student Loan Refinancing',
    originalAmount: 45000,
    remainingBalance: 32000,
    interestRate: 6.8,
    monthlyPayment: 425,
    lender: 'National Bank',
    status: 'active',
    offers: [
      {
        id: 1,
        offerer: 'CryptoLender Pro',
        amount: 32000,
        rate: 4.2,
        term: 60,
        monthlyPayment: 285,
        status: 'pending',
        avatar: '🏦',
      },
      {
        id: 2,
        offerer: 'P2P Finance Co',
        amount: 31000,
        rate: 4.8,
        term: 72,
        monthlyPayment: 265,
        status: 'accepted',
        avatar: '💼',
      },
    ],
  },
];

export interface DemoAvailableLoan {
  id: number;
  type: string;
  icon: string;
  amount: number;
  description: string;
  currentRate: number;
  monthlyPayment: number;
}

export const DEMO_AVAILABLE_LOANS: DemoAvailableLoan[] = [
  {
    id: 1,
    type: 'Student Loan',
    icon: '🎓',
    amount: 25000,
    description: 'Help Maria pay off her student debt',
    currentRate: 7.2,
    monthlyPayment: 285,
  },
  {
    id: 2,
    type: 'Auto Loan',
    icon: '🚗',
    amount: 18500,
    description: "Refinance Carlos's car loan",
    currentRate: 6.8,
    monthlyPayment: 195,
  },
];

// ==================== TIMELINE DATA ====================

export interface DemoTimelineEvent {
  id: number;
  type: string;
  actor: string;
  actorAvatar: string;
  content: string;
  amount?: number;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  circle?: string;
  tags: string[];
}

export const DEMO_TIMELINE: DemoTimelineEvent[] = [
  {
    id: 1,
    type: 'project_funded',
    actor: 'Sarah Johnson',
    actorAvatar: '👩‍💻',
    content: 'Bitcoin Wallet Redesign project just hit its funding goal!',
    amount: 250000,
    timestamp: '2 hours ago',
    likes: 24,
    comments: 8,
    shares: 12,
    circle: 'Bitcoin Builders Collective',
    tags: ['wallet', 'ux', 'bitcoin'],
  },
  {
    id: 2,
    type: 'loan_offer',
    actor: 'Marcus Rodriguez',
    actorAvatar: '💰',
    content: "Made an offer to refinance Maria's student loan at 4.2% APR",
    amount: 32000,
    timestamp: '4 hours ago',
    likes: 6,
    comments: 3,
    shares: 2,
    circle: 'Community Lenders',
    tags: ['lending', 'refinance', 'student'],
  },
  {
    id: 3,
    type: 'circle_joined',
    actor: 'David Kim',
    actorAvatar: '🚀',
    content: 'Joined the Green Energy Innovators circle',
    timestamp: '6 hours ago',
    likes: 12,
    comments: 5,
    shares: 8,
    circle: 'Green Energy Innovators',
    tags: ['community', 'sustainability'],
  },
  {
    id: 4,
    type: 'project_created',
    actor: 'Emma Wilson',
    actorAvatar: '🌟',
    content: 'Created new project: Decentralized Identity System',
    amount: 150000,
    timestamp: '1 day ago',
    likes: 31,
    comments: 15,
    shares: 22,
    circle: 'Bitcoin Builders Collective',
    tags: ['privacy', 'identity', 'blockchain'],
  },
];

// ==================== PROJECT DATA ====================

export interface DemoProject {
  id: number;
  title: string;
  creator: string;
  avatar: string;
  goal: number;
  raised: number;
  backers: number;
  daysLeft: number;
  category: string;
  status: 'active' | 'funded' | 'completed';
  description: string;
}

export const DEMO_PROJECTS: DemoProject[] = [
  {
    id: 1,
    title: 'Bitcoin Wallet Redesign',
    creator: 'Sarah Johnson',
    avatar: '👩‍💻',
    goal: 500000,
    raised: 250000,
    backers: 47,
    daysLeft: 14,
    category: 'Development',
    status: 'funded',
    description: 'Modern, user-friendly Bitcoin wallet with enhanced security features',
  },
  {
    id: 2,
    title: 'Solar Microgrid Network',
    creator: 'Dr. Lisa Chen',
    avatar: '🔬',
    goal: 1000000,
    raised: 650000,
    backers: 89,
    daysLeft: 21,
    category: 'Energy',
    status: 'active',
    description: 'Community-owned solar power network for rural electrification',
  },
];

// ==================== DEMO STEPS ====================

export interface DemoStep {
  title: string;
  content: string;
  highlight: string | null;
}

export const DEMO_STEPS: DemoStep[] = [
  {
    title: 'Welcome to OrangeCat 3.0',
    content:
      'Experience the future of Bitcoin crowdfunding, community building, and peer-to-peer lending.',
    highlight: null,
  },
  {
    title: 'Your Personal Dashboard',
    content: 'See all your activity, balances, and opportunities in one unified view.',
    highlight: 'dashboard',
  },
  {
    title: 'Community Circles',
    content: 'Join groups with shared wallets, governance, and collective funding power.',
    highlight: 'circles',
  },
  {
    title: 'Peer-to-Peer Lending',
    content: 'List loans for refinancing or browse opportunities to help others save money.',
    highlight: 'loans',
  },
  {
    title: 'Social Timeline',
    content: 'Engage with the community through likes, comments, and shares.',
    highlight: 'timeline',
  },
  {
    title: 'Project Discovery',
    content: 'Support innovative Bitcoin projects and track their progress.',
    highlight: 'projects',
  },
];

// ==================== UTILITY FUNCTIONS ====================

/**
 * Format satoshis to human-readable string
 */
export function formatSats(amount: number): string {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M sats`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K sats`;
  return `${amount} sats`;
}

/**
 * Convert satoshis to approximate USD value
 * Note: Uses rough conversion for demo purposes
 */
export function formatUSD(sats: number): string {
  const usd = sats * 0.00005; // Rough BTC to USD conversion
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(usd);
}

/**
 * Get role badge color class
 */
export function getRoleBadgeColor(role: CircleRole): string {
  switch (role) {
    case 'owner':
      return 'bg-purple-100 text-purple-800';
    case 'admin':
      return 'bg-blue-100 text-blue-800';
    case 'moderator':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-green-100 text-green-800';
  }
}

/**
 * Get status badge color class
 */
export function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'funded':
    case 'accepted':
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'active':
    case 'pending':
      return 'bg-blue-100 text-blue-800';
    case 'rejected':
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
