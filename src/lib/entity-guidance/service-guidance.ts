/**
 * Service Field Guidance Content
 *
 * Single source of truth for service creation guidance.
 * Used by DynamicSidebar to provide contextual help.
 *
 * Created: 2025-12-03
 * Last Modified: 2025-12-03
 * Last Modified Summary: Initial service guidance content
 */

import React from 'react';
import {
  Briefcase,
  FileText,
  DollarSign,
  Tag,
  Clock,
  MapPin,
  Image,
  Link as LinkIcon,
  CheckCircle2,
  Users,
} from 'lucide-react';
import type { GuidanceContent, DefaultGuidance } from '@/components/create/types';

export type ServiceFieldType =
  | 'title'
  | 'description'
  | 'category'
  | 'hourly_rate_sats'
  | 'fixed_price_sats'
  | 'duration_minutes'
  | 'service_location_type'
  | 'service_area'
  | 'portfolio_links'
  | null;

export const serviceGuidanceContent: Record<NonNullable<ServiceFieldType>, GuidanceContent> = {
  title: {
    icon: React.createElement(Briefcase, { className: 'w-5 h-5 text-tiffany-600' }),
    title: 'Service Title',
    description:
      'Your service title should clearly communicate what you offer. Be specific and professional.',
    tips: [
      'Lead with your main skill or expertise',
      'Include your specialty or niche',
      'Keep it concise but descriptive',
      'Use industry-standard terminology',
      'Avoid jargon that clients won\'t understand',
    ],
    examples: [
      'Bitcoin Consulting & Strategy',
      'Website Development - React & Next.js',
      'Logo Design & Brand Identity',
      'German-English Translation Services',
    ],
  },
  description: {
    icon: React.createElement(FileText, { className: 'w-5 h-5 text-tiffany-600' }),
    title: 'Service Description',
    description:
      'Describe what you offer, your experience, and what clients can expect when working with you.',
    tips: [
      'Start with what you do and for whom',
      'Highlight your experience and credentials',
      'Explain your process or approach',
      'Mention what\'s included in your service',
      'Add testimonials or results if available',
    ],
    examples: [
      'I help individuals and businesses understand and implement Bitcoin solutions...',
      'With 5+ years of React development, I create fast, accessible web applications...',
    ],
  },
  category: {
    icon: React.createElement(Tag, { className: 'w-5 h-5 text-tiffany-600' }),
    title: 'Service Category',
    description:
      'Categories help clients find your service. Choose the category that best matches your expertise.',
    tips: [
      'Pick your primary area of expertise',
      'If you offer multiple services, choose the main one',
      'You can create separate listings for different services',
      'Categories affect where your service appears in search',
    ],
    examples: [
      'Consulting - Strategy, business advice',
      'Development - Software, web, mobile',
      'Design - Graphics, UI/UX, branding',
      'Teaching - Courses, tutoring, coaching',
    ],
  },
  hourly_rate_sats: {
    icon: React.createElement(DollarSign, { className: 'w-5 h-5 text-tiffany-600' }),
    title: 'Hourly Rate',
    description:
      'Set your hourly rate in satoshis. This is ideal for ongoing work or consultations.',
    tips: [
      'Research market rates for your skill level',
      'Factor in your experience and expertise',
      'Consider your location and cost of living',
      'You can also set a fixed price for projects',
      '50,000 sats ≈ $50/hour at ~$100k BTC',
    ],
    examples: [
      '50,000 sats/hour - Entry level',
      '150,000 sats/hour - Experienced',
      '300,000 sats/hour - Expert/specialized',
    ],
  },
  fixed_price_sats: {
    icon: React.createElement(DollarSign, { className: 'w-5 h-5 text-tiffany-600' }),
    title: 'Fixed Price',
    description:
      'Set a fixed price for complete projects or packages. Great for defined deliverables.',
    tips: [
      'Estimate total hours and add buffer',
      'Include all deliverables in the price',
      'Consider revisions and client communication',
      'Good for packages or defined scopes',
      'Can be used alongside hourly rate',
    ],
    examples: [
      '500,000 sats - Basic website',
      '2,000,000 sats - Full brand identity',
      '100,000 sats - 1-hour consultation',
    ],
  },
  duration_minutes: {
    icon: React.createElement(Clock, { className: 'w-5 h-5 text-tiffany-600' }),
    title: 'Typical Duration',
    description:
      'How long does a typical session or engagement last? This helps clients plan.',
    tips: [
      'Set realistic expectations',
      'Include any prep or follow-up time',
      'Can be per-session or per-project',
      'Helps clients understand the commitment',
    ],
    examples: [
      '60 minutes - Standard consultation',
      '90 minutes - In-depth session',
      '30 minutes - Quick review/feedback',
    ],
  },
  service_location_type: {
    icon: React.createElement(MapPin, { className: 'w-5 h-5 text-tiffany-600' }),
    title: 'Service Location',
    description:
      'Where can you deliver your service? This affects who can hire you.',
    tips: [
      'Remote: Work from anywhere, serve global clients',
      'On-site: Meet clients in person',
      'Both: Flexible - offer both options',
      'Consider travel costs for on-site work',
    ],
    examples: [
      'Remote - Video calls, screen sharing',
      'On-site - In-person meetings, workshops',
      'Both - Flexible based on client needs',
    ],
  },
  service_area: {
    icon: React.createElement(MapPin, { className: 'w-5 h-5 text-tiffany-600' }),
    title: 'Service Area',
    description:
      'For on-site services, specify where you can travel to meet clients.',
    tips: [
      'Be specific about your coverage area',
      'Include cities or regions you serve',
      'Mention if travel fees apply',
      'Helps local clients find you',
    ],
    examples: [
      'Zurich & surrounding areas',
      'Greater Zurich Area, up to 50km',
      'All major Swiss cities',
    ],
  },
  portfolio_links: {
    icon: React.createElement(LinkIcon, { className: 'w-5 h-5 text-tiffany-600' }),
    title: 'Portfolio Links',
    description:
      'Link to examples of your work. Portfolios build trust and show your capabilities.',
    tips: [
      'Include your best, most relevant work',
      'Link to case studies or testimonials',
      'Can include GitHub, Behance, Dribbble',
      'Personal website counts as portfolio',
      'Keep links up-to-date',
    ],
    examples: [
      'https://yourportfolio.com',
      'https://github.com/yourusername',
      'https://dribbble.com/yourprofile',
    ],
  },
};

export const serviceDefaultGuidance: DefaultGuidance = {
  title: 'What is a Service?',
  description:
    'Services are your skills and expertise offered to clients. Consulting, development, design, teaching - get paid in Bitcoin for your work.',
  features: [
    {
      icon: React.createElement(Briefcase, { className: 'w-4 h-4 text-tiffany-600' }),
      text: 'Offer your professional expertise',
    },
    {
      icon: React.createElement(Users, { className: 'w-4 h-4 text-tiffany-600' }),
      text: 'Connect with clients globally',
    },
    {
      icon: React.createElement(CheckCircle2, { className: 'w-4 h-4 text-tiffany-600' }),
      text: 'Set your own rates and availability',
    },
  ],
  hint: '💡 Click on any field to get specific guidance',
};





































