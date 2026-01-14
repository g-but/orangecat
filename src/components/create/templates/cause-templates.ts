/**
 * Cause Templates
 *
 * Template definitions for cause creation.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 */

import React from 'react';
import {
  Heart,
  GraduationCap,
  Stethoscope,
  Leaf,
  Home,
  Shield,
  Users,
  Baby,
  Laptop,
  Brain,
  Flag,
  Music,
} from 'lucide-react';
import type { EntityTemplate } from '../types';
import type { UserCauseFormData } from '@/lib/validation';

export const CAUSE_TEMPLATES: EntityTemplate<UserCauseFormData>[] = [
  {
    id: 'education-scholarship',
    icon: React.createElement(GraduationCap, { className: 'w-4 h-4' }),
    name: 'Education Scholarship',
    tagline: 'Help students access quality education.',
    defaults: {
      title: 'Education Scholarship Fund',
      description:
        'Supporting students from underserved communities to access quality education. Funds will be used for tuition, books, and educational materials.',
      cause_category: 'Education',
      goal_amount: 5000000,
      currency: 'SATS',
      status: 'draft',
    },
  },
  {
    id: 'medical-emergency',
    icon: React.createElement(Stethoscope, { className: 'w-4 h-4' }),
    name: 'Medical Emergency Fund',
    tagline: 'Crowdfunding for urgent medical care.',
    defaults: {
      title: 'Medical Emergency Fund',
      description:
        'Raising funds for urgent medical treatment, surgery, or ongoing healthcare needs. All funds go directly to medical expenses.',
      cause_category: 'Healthcare',
      goal_amount: 10000000,
      currency: 'SATS',
      status: 'draft',
    },
  },
  {
    id: 'environmental-conservation',
    icon: React.createElement(Leaf, { className: 'w-4 h-4' }),
    name: 'Environmental Conservation',
    tagline: 'Protect and restore our planet.',
    defaults: {
      title: 'Environmental Conservation Project',
      description:
        'Supporting local environmental initiatives: reforestation, wildlife protection, clean water access, or climate action projects.',
      cause_category: 'Environment',
      goal_amount: 3000000,
      currency: 'SATS',
      status: 'draft',
    },
  },
  {
    id: 'disaster-relief',
    icon: React.createElement(Shield, { className: 'w-4 h-4' }),
    name: 'Disaster Relief',
    tagline: 'Rapid response to natural disasters.',
    defaults: {
      title: 'Disaster Relief Fund',
      description:
        'Providing immediate aid to communities affected by natural disasters: food, shelter, medical supplies, and rebuilding efforts.',
      cause_category: 'Disaster Relief',
      goal_amount: 20000000,
      currency: 'SATS',
      status: 'draft',
    },
  },
  {
    id: 'poverty-relief',
    icon: React.createElement(Home, { className: 'w-4 h-4' }),
    name: 'Poverty Relief',
    tagline: 'Support families in need.',
    defaults: {
      title: 'Poverty Relief Initiative',
      description:
        'Helping families and individuals facing financial hardship: food assistance, housing support, job training, and essential supplies.',
      cause_category: 'Poverty Relief',
      goal_amount: 5000000,
      currency: 'SATS',
      status: 'draft',
    },
  },
  {
    id: 'animal-welfare',
    icon: React.createElement(Heart, { className: 'w-4 h-4' }),
    name: 'Animal Welfare',
    tagline: 'Protect and care for animals.',
    defaults: {
      title: 'Animal Welfare Fund',
      description:
        'Supporting animal rescue, shelter operations, veterinary care, and spay/neuter programs for stray and abandoned animals.',
      cause_category: 'Animal Welfare',
      goal_amount: 2500000,
      currency: 'SATS',
      status: 'draft',
    },
  },
  {
    id: 'arts-culture',
    icon: React.createElement(Music, { className: 'w-4 h-4' }),
    name: 'Arts & Culture',
    tagline: 'Preserve and promote cultural heritage.',
    defaults: {
      title: 'Arts & Culture Initiative',
      description:
        'Supporting local artists, cultural events, heritage preservation, and community arts programs that enrich our communities.',
      cause_category: 'Arts & Culture',
      goal_amount: 2000000,
      currency: 'SATS',
      status: 'draft',
    },
  },
  {
    id: 'community-development',
    icon: React.createElement(Users, { className: 'w-4 h-4' }),
    name: 'Community Development',
    tagline: 'Build stronger, more resilient communities.',
    defaults: {
      title: 'Community Development Project',
      description:
        'Supporting local community projects: infrastructure improvements, community centers, public spaces, and neighborhood initiatives.',
      cause_category: 'Community Development',
      goal_amount: 10000000,
      currency: 'SATS',
      status: 'draft',
    },
  },
  {
    id: 'children-youth',
    icon: React.createElement(Baby, { className: 'w-4 h-4' }),
    name: 'Children & Youth Support',
    tagline: 'Empower the next generation.',
    defaults: {
      title: 'Children & Youth Support Program',
      description:
        'Supporting programs for children and youth: after-school activities, mentorship, educational resources, and safe spaces for development.',
      cause_category: 'Children & Youth',
      goal_amount: 4000000,
      currency: 'SATS',
      status: 'draft',
    },
  },
  {
    id: 'technology-access',
    icon: React.createElement(Laptop, { className: 'w-4 h-4' }),
    name: 'Technology Access',
    tagline: 'Bridge the digital divide.',
    defaults: {
      title: 'Technology Access Initiative',
      description:
        'Providing technology access to underserved communities: computers, internet access, digital literacy training, and tech education.',
      cause_category: 'Technology Access',
      goal_amount: 6000000,
      currency: 'SATS',
      status: 'draft',
    },
  },
  {
    id: 'mental-health',
    icon: React.createElement(Brain, { className: 'w-4 h-4' }),
    name: 'Mental Health Support',
    tagline: 'Support mental wellness and recovery.',
    defaults: {
      title: 'Mental Health Support Fund',
      description:
        'Supporting mental health services: counseling, therapy access, support groups, crisis intervention, and mental health awareness programs.',
      cause_category: 'Mental Health',
      goal_amount: 5000000,
      currency: 'SATS',
      status: 'draft',
    },
  },
  {
    id: 'veterans-support',
    icon: React.createElement(Flag, { className: 'w-4 h-4' }),
    name: 'Veterans Support',
    tagline: 'Honor and support those who served.',
    defaults: {
      title: 'Veterans Support Fund',
      description:
        'Supporting veterans: housing assistance, job training, mental health services, medical care, and transition support programs.',
      cause_category: 'Veterans Support',
      goal_amount: 8000000,
      currency: 'SATS',
      status: 'draft',
    },
  },
];
