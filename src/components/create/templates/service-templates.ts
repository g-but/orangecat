/**
 * Service Templates
 *
 * Template definitions for service creation.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 */

import React from 'react';
import { Briefcase, Palette, Wrench, Type, Globe2 } from 'lucide-react';
import type { EntityTemplate } from '../types';
import type { UserServiceFormData } from '@/lib/validation';

export const SERVICE_TEMPLATES: EntityTemplate<UserServiceFormData>[] = [
  {
    id: 'consult-hour',
    icon: React.createElement(Briefcase, { className: 'w-4 h-4' }),
    name: '1-hour Consultation',
    tagline: 'Advisory call with a fixed rate and clear scope.',
    defaults: {
      title: '1-hour Consultation',
      description: 'Video call to review your needs, answer questions, and propose next steps.',
      category: 'Consulting',
      hourly_rate_sats: 50000,
      fixed_price_sats: null,
      currency: 'SATS',
      duration_minutes: 60,
      service_location_type: 'remote',
      service_area: '',
      status: 'draft',
    },
  },
  {
    id: 'design-sprint',
    icon: React.createElement(Palette, { className: 'w-4 h-4' }),
    name: 'Design Sprint (1 week)',
    tagline: 'Rapid prototypes and user feedback in 5 days.',
    defaults: {
      title: '1-week Design Sprint',
      description: 'Define, prototype, and validate a key flow in 5 days with stakeholder syncs.',
      category: 'Design',
      hourly_rate_sats: null,
      fixed_price_sats: 800000,
      currency: 'SATS',
      duration_minutes: null,
      service_location_type: 'remote',
      service_area: '',
      status: 'draft',
    },
  },
  {
    id: 'bug-fix-bundle',
    icon: React.createElement(Wrench, { className: 'w-4 h-4' }),
    name: 'Bug Fix Bundle',
    tagline: 'Up to 3 bugs fixed with a quick turnaround.',
    defaults: {
      title: 'Bug Fix Bundle (up to 3 issues)',
      description: 'Triage, patch, and verify up to 3 bugs. Includes test coverage where feasible.',
      category: 'Development',
      hourly_rate_sats: null,
      fixed_price_sats: 150000,
      currency: 'SATS',
      duration_minutes: null,
      service_location_type: 'remote',
      service_area: '',
      status: 'draft',
    },
  },
  {
    id: 'copy-edit',
    icon: React.createElement(Type, { className: 'w-4 h-4' }),
    name: 'Copy Edit (short form)',
    tagline: 'Tighten a landing page or email in one pass.',
    defaults: {
      title: 'Copy Edit (one pass)',
      description: 'Tone, clarity, grammar, and light structure for one page/email. Two revisions included.',
      category: 'Writing',
      hourly_rate_sats: null,
      fixed_price_sats: 60000,
      currency: 'SATS',
      duration_minutes: null,
      service_location_type: 'remote',
      service_area: '',
      status: 'draft',
    },
  },
  {
    id: 'local-visit',
    icon: React.createElement(Globe2, { className: 'w-4 h-4' }),
    name: 'On-site Session',
    tagline: 'Local visit for setup, training, or audits.',
    defaults: {
      title: 'On-site Session (2 hours)',
      description: 'Hands-on help at your location: setup, audits, or training. Travel not included.',
      category: 'Coaching',
      hourly_rate_sats: 70000,
      fixed_price_sats: null,
      currency: 'SATS',
      duration_minutes: 120,
      service_location_type: 'onsite',
      service_area: 'Zurich, Switzerland',
      status: 'draft',
    },
  },
];


