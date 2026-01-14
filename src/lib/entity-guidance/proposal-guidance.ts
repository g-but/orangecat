/**
 * Proposal Field Guidance Content
 *
 * Single source of truth for proposal creation guidance.
 * Used by GuidancePanel to provide contextual help and examples.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Initial proposal guidance content
 */

import React from 'react';
import {
  FileText,
  Target,
  DollarSign,
  Users,
  Shield,
  Globe,
  Calendar,
  Percent,
  Wallet,
  Bitcoin,
  CheckCircle2,
  Lightbulb,
} from 'lucide-react';
import type { GuidanceContent, DefaultGuidance } from '@/components/create/types';

export type ProposalFieldType =
  | 'title'
  | 'description'
  | 'proposal_type'
  | 'voting_threshold'
  | 'voting_ends_at'
  | 'is_public'
  | 'amount_sats'
  | 'recipient_address'
  | 'wallet_id'
  | null;

export const proposalGuidanceContent: Record<NonNullable<ProposalFieldType>, GuidanceContent> = {
  title: {
    icon: React.createElement(FileText, { className: 'w-5 h-5 text-blue-600' }),
    title: 'Proposal Title',
    description: 'Write a clear, concise title that summarizes what the proposal aims to achieve.',
    tips: [
      'Keep it under 60 characters for readability',
      'Be specific about the action or decision',
      'Avoid jargon or technical terms',
      'Make it actionable and clear',
      'Use present tense when possible',
    ],
    examples: [
      'Fund Community Garden Project',
      'Hire Full-Stack Developer',
      'Update Governance Threshold to 60%',
      'Create Partnership with Local Makerspace',
      'Allocate 1M Sats for Marketing Campaign',
    ],
  },
  description: {
    icon: React.createElement(FileText, { className: 'w-5 h-5 text-blue-600' }),
    title: 'Proposal Description',
    description:
      'Provide detailed context, rationale, and expected outcomes. Help members understand why this proposal matters.',
    tips: [
      'Explain the problem or opportunity',
      'Describe the proposed solution',
      'Include expected benefits and costs',
      'Address potential concerns',
      'Provide relevant background information',
      'Keep it focused and scannable',
    ],
    examples: [
      'This proposal seeks to establish a community garden in our neighborhood. The project will require 2M sats for initial setup, including tools, seeds, and irrigation. Expected benefits include fresh produce for members and a gathering space for the community.',
      'We need to hire a full-stack developer to build our platform. This role is critical for our roadmap and will help us deliver features faster. Budget: 5M sats over 6 months.',
    ],
  },
  proposal_type: {
    icon: React.createElement(Target, { className: 'w-5 h-5 text-blue-600' }),
    title: 'Proposal Type',
    description:
      'Choose the category that best fits your proposal. This helps organize and filter proposals.',
    tips: [
      'General: Any proposal not fitting other categories',
      'Treasury: Spending or allocation of funds',
      'Membership: Adding, removing, or changing member roles',
      'Governance: Changing how the group makes decisions',
      'Employment: Job postings and hiring (can be public)',
    ],
    examples: [
      'General - Project ideas, partnerships, policy changes',
      'Treasury - Spending funds, budget allocation',
      'Membership - Invite new members, change roles',
      'Governance - Update voting thresholds, change rules',
      'Employment - Post job openings, hire contractors',
    ],
  },
  voting_threshold: {
    icon: React.createElement(Percent, { className: 'w-5 h-5 text-blue-600' }),
    title: 'Voting Threshold',
    description:
      "The minimum percentage of yes votes required for the proposal to pass. Leave empty to use the group's default threshold.",
    tips: [
      'Lower threshold (e.g., 50%) = easier to pass',
      'Higher threshold (e.g., 75%) = requires more consensus',
      'Use group default for consistency',
      'Consider proposal importance',
      'Higher thresholds for major decisions',
    ],
    examples: [
      '50% - Simple majority (default for democratic groups)',
      '60% - Supermajority (for important decisions)',
      '75% - Strong consensus (for major changes)',
      '100% - Unanimous (for critical decisions)',
    ],
  },
  voting_ends_at: {
    icon: React.createElement(Calendar, { className: 'w-5 h-5 text-blue-600' }),
    title: 'Voting End Date',
    description:
      'When voting should close. Leave empty to use the default (7 days after activation).',
    tips: [
      'Shorter periods (3-5 days) for urgent decisions',
      'Longer periods (7-14 days) for major proposals',
      'Consider member availability',
      'Give enough time for discussion',
      'Default is usually 7 days',
    ],
    examples: [
      '3 days - Urgent decisions, time-sensitive',
      '7 days - Standard proposals (default)',
      '14 days - Major changes, complex proposals',
      '30 days - Constitutional changes, major governance',
    ],
  },
  is_public: {
    icon: React.createElement(Globe, { className: 'w-5 h-5 text-blue-600' }),
    title: 'Public Proposal',
    description:
      'Make this proposal visible to non-members. Useful for job postings and public initiatives.',
    tips: [
      'Enable for job postings to reach external candidates',
      'Use for public initiatives and partnerships',
      'Keep internal proposals private',
      'Public proposals appear in /jobs browse page',
      'Non-members can view but not vote',
    ],
    examples: [
      'Enabled - Job postings, public partnerships',
      'Disabled - Internal decisions, member-only proposals',
    ],
  },
  amount_sats: {
    icon: React.createElement(DollarSign, { className: 'w-5 h-5 text-blue-600' }),
    title: 'Amount (Satoshis)',
    description:
      'The amount to spend in satoshis. 1 BTC = 100,000,000 sats. Be specific and justify the amount.',
    tips: [
      '1 BTC = 100,000,000 sats',
      'Be specific about the amount needed',
      'Include breakdown if possible',
      'Consider current Bitcoin price',
      'Justify why this amount is needed',
    ],
    examples: [
      '1,000,000 sats (0.01 BTC) - Small expenses',
      '10,000,000 sats (0.1 BTC) - Medium projects',
      '100,000,000 sats (1 BTC) - Major initiatives',
    ],
  },
  recipient_address: {
    icon: React.createElement(Bitcoin, { className: 'w-5 h-5 text-blue-600' }),
    title: 'Recipient Bitcoin Address',
    description:
      'The Bitcoin address where funds will be sent if the proposal passes. Must be a valid Bitcoin address.',
    tips: [
      'Use Native SegWit (bc1...) when possible',
      'Double-check the address before submitting',
      'Consider using a multi-sig for large amounts',
      'Verify the recipient is correct',
      'Test with small amount first if unsure',
    ],
    examples: [
      'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlhfe2s (Native SegWit - recommended)',
      '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy (SegWit)',
      '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2 (Legacy)',
    ],
  },
  wallet_id: {
    icon: React.createElement(Wallet, { className: 'w-5 h-5 text-blue-600' }),
    title: 'Source Wallet',
    description:
      "Optional: Specify which wallet to spend from. Leave empty to use the group's default treasury wallet.",
    tips: [
      'Leave empty to use default treasury',
      'Specify if using a dedicated wallet',
      'Useful for multi-wallet groups',
      'Ensure wallet has sufficient balance',
    ],
    examples: [
      'Leave empty - Use default treasury wallet',
      'Specify wallet ID - Use specific wallet for this spending',
    ],
  },
};

export const proposalDefaultGuidance: DefaultGuidance = {
  title: 'Creating a Proposal',
  description:
    'Proposals enable democratic decision-making in your group. Create clear, well-reasoned proposals to help members make informed decisions.',
  features: [
    {
      icon: React.createElement(CheckCircle2, { className: 'w-4 h-4 text-blue-600' }),
      text: 'Transparent voting with automatic resolution',
    },
    {
      icon: React.createElement(Shield, { className: 'w-4 h-4 text-blue-600' }),
      text: 'Governance-aware thresholds and rules',
    },
    {
      icon: React.createElement(Lightbulb, { className: 'w-4 h-4 text-blue-600' }),
      text: 'Action execution when proposals pass',
    },
    {
      icon: React.createElement(Users, { className: 'w-4 h-4 text-blue-600' }),
      text: 'Member participation and engagement',
    },
    {
      icon: React.createElement(FileText, { className: 'w-4 h-4 text-blue-600' }),
      text: 'Clear documentation of group decisions',
    },
  ],
  hint: '💡 Click on any field to get specific guidance and examples',
};
