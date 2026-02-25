/**
 * Research Field Guidance Content
 *
 * Single source of truth for research entity creation guidance.
 * Used by DynamicSidebar to provide contextual help.
 *
 * Created: 2026-02-24
 */

import React from 'react';
import {
  Microscope,
  FileText,
  FlaskConical,
  Clock,
  DollarSign,
  Users,
  Eye,
  Vote,
  Target,
  CheckCircle2,
  Shield,
  Globe,
} from 'lucide-react';
import type { GuidanceContent, DefaultGuidance } from '@/components/create/types';

export const researchGuidanceContent: Record<string, GuidanceContent> = {
  title: {
    icon: React.createElement(Microscope, { className: 'w-5 h-5 text-purple-600' }),
    title: 'Research Title',
    description:
      'Your research title should clearly state the fundamental question or problem being investigated.',
    tips: [
      'Be specific about the research question',
      'Make it understandable to non-experts',
      'Keep it under 200 characters',
      'Avoid jargon where possible',
    ],
    examples: [
      'Dark Matter Detection Using Novel Gravitational Lensing',
      'Bitcoin Lightning Network Scalability Analysis',
      'Climate Impact on Crop Yields in Sub-Saharan Africa',
    ],
  },
  description: {
    icon: React.createElement(FileText, { className: 'w-5 h-5 text-purple-600' }),
    title: 'Research Description',
    description:
      'Explain what understanding you are pursuing and why it matters. Help funders understand the significance.',
    tips: [
      'Explain the problem clearly',
      'Describe the potential impact',
      'Include relevant background',
      'Make it accessible to general audience',
    ],
  },
  field: {
    icon: React.createElement(FlaskConical, { className: 'w-5 h-5 text-purple-600' }),
    title: 'Research Field',
    description: 'Choose the primary discipline for your research.',
    tips: [
      'Pick the most relevant field',
      'If interdisciplinary, choose the primary one',
      'This helps funders discover your research',
    ],
  },
  methodology: {
    icon: React.createElement(FlaskConical, { className: 'w-5 h-5 text-purple-600' }),
    title: 'Research Methodology',
    description: 'Select the primary approach you will use to conduct this research.',
    tips: [
      'Choose the dominant method',
      'Mixed methods is valid for multi-approach research',
      'Be honest about your methodology',
    ],
  },
  expected_outcome: {
    icon: React.createElement(Target, { className: 'w-5 h-5 text-purple-600' }),
    title: 'Expected Outcome',
    description: 'What understanding or breakthrough do you hope to achieve?',
    tips: [
      'Be specific but realistic',
      'Describe measurable outcomes',
      'Include potential applications',
    ],
  },
  timeline: {
    icon: React.createElement(Clock, { className: 'w-5 h-5 text-purple-600' }),
    title: 'Research Timeline',
    description: 'How long do you expect this research to take?',
    tips: [
      'Be realistic about timelines',
      'Include buffer for unexpected delays',
      'Ongoing is fine for open-ended research',
    ],
  },
  funding_goal_sats: {
    icon: React.createElement(DollarSign, { className: 'w-5 h-5 text-purple-600' }),
    title: 'Funding Goal',
    description: 'How much funding do you need in satoshis to complete this research?',
    tips: [
      'Calculate actual costs (equipment, time, resources)',
      'Minimum is 1,000 sats',
      'Break down costs for transparency',
    ],
  },
  funding_model: {
    icon: React.createElement(DollarSign, { className: 'w-5 h-5 text-purple-600' }),
    title: 'Funding Model',
    description: 'How should supporters fund your research?',
    tips: [
      'Donation-based for pure support',
      'Milestone-based increases accountability',
      'Subscription for ongoing research',
    ],
  },
  lead_researcher: {
    icon: React.createElement(Users, { className: 'w-5 h-5 text-purple-600' }),
    title: 'Lead Researcher',
    description: 'Who is the primary researcher leading this project?',
    tips: ['Use your real name for credibility', 'Include relevant credentials in description'],
  },
  open_collaboration: {
    icon: React.createElement(Users, { className: 'w-5 h-5 text-purple-600' }),
    title: 'Open Collaboration',
    description: 'Allow other researchers to join and contribute to your project.',
    tips: ['Open projects attract more attention', 'You control who actually joins'],
  },
  progress_frequency: {
    icon: React.createElement(Eye, { className: 'w-5 h-5 text-purple-600' }),
    title: 'Progress Updates',
    description: 'How often will you share progress with funders?',
    tips: [
      'More frequent updates build trust',
      'Monthly is a good default',
      'Milestone-based works for longer projects',
    ],
  },
  transparency_level: {
    icon: React.createElement(Eye, { className: 'w-5 h-5 text-purple-600' }),
    title: 'Transparency Level',
    description: 'How much of your research process will be public?',
    tips: [
      'Full transparency attracts more funders',
      'Consider IP implications before choosing full',
    ],
  },
  voting_enabled: {
    icon: React.createElement(Vote, { className: 'w-5 h-5 text-purple-600' }),
    title: 'Community Voting',
    description: 'Let supporters vote on research direction and priorities.',
    tips: ['Voting increases community engagement', 'You retain final decision-making power'],
  },
  is_public: {
    icon: React.createElement(Globe, { className: 'w-5 h-5 text-purple-600' }),
    title: 'Public Visibility',
    description: 'Make this research visible to everyone.',
    tips: ['Public research attracts more funding', 'Private is useful for early-stage work'],
  },
};

export const researchDefaultGuidance: DefaultGuidance = {
  title: 'What is Research?',
  description:
    'Research entities represent independent research topics with decentralized funding. Define your question, set your methodology, and receive Bitcoin funding from supporters worldwide.',
  features: [
    {
      icon: React.createElement(Microscope, { className: 'w-4 h-4 text-purple-600' }),
      text: 'Fund independent research with Bitcoin',
    },
    {
      icon: React.createElement(Shield, { className: 'w-4 h-4 text-purple-600' }),
      text: 'Transparent progress tracking',
    },
    {
      icon: React.createElement(CheckCircle2, { className: 'w-4 h-4 text-purple-600' }),
      text: 'Community voting on direction',
    },
  ],
  hint: 'Click on any field to get specific guidance',
};
