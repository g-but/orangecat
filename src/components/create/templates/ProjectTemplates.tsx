/**
 * ProjectTemplates Component
 *
 * Displays pre-filled project templates for inspiration and quick start.
 * Uses unified EntityTemplate interface for consistency.
 *
 * Updated to use:
 * - `defaults` instead of `data` (unified interface)
 * - TemplatePicker for consistent UI
 *
 * @module components/create/templates
 */

'use client';

import React from 'react';
import { Sprout, Heart, Palette, Lightbulb } from 'lucide-react';
import { TemplatePicker } from './TemplatePicker';
import type { EntityTemplate } from '../types';

// Project-specific template defaults type matching form field names
interface ProjectDefaults {
  title: string;
  description: string;
  goal_amount: number;
  currency: string;
  funding_purpose: string;
  category: string;
}

// Use unified EntityTemplate interface
export type ProjectTemplate = EntityTemplate<ProjectDefaults>;

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'community-garden',
    name: 'Community Garden',
    icon: <Sprout className="w-4 h-4" />,
    tagline: 'Transform unused space into green community hub',
    defaults: {
      title: 'Community Garden Project',
      description:
        "Creating a shared community space with raised garden beds and educational workshops for local families. This project will transform unused land into a thriving community garden where residents can grow organic vegetables, learn sustainable farming practices, and build stronger neighborhood connections.\n\nOur garden will feature 20 raised beds, a composting station, rainwater collection system, and a small greenhouse. We'll host weekly workshops on organic gardening, composting, and sustainable living. All community members are welcome to participate, regardless of gardening experience.",
      goal_amount: 5000,
      currency: 'CHF',
      funding_purpose:
        'Construction materials for raised beds ($2000), Soil and composting infrastructure ($1000), Gardening tools and equipment ($800), Educational workshop materials ($500), Seeds and starter plants ($400), Signage and documentation ($300)',
      category: 'Community',
    },
  },
  {
    id: 'animal-shelter',
    name: 'Animal Shelter',
    icon: <Heart className="w-4 h-4" />,
    tagline: 'Rescue and rehome abandoned pets',
    defaults: {
      title: 'Local Animal Shelter Support',
      description:
        'Supporting animal rescue operations and providing veterinary care for abandoned pets in our community. Our shelter has rescued over 200 animals in the past year, giving them a second chance at finding loving families.\n\nWe operate a no-kill shelter focused on rehabilitation and adoption. Every animal receives full veterinary care, behavioral assessment, and socialization before adoption. We also run educational programs teaching responsible pet ownership.',
      goal_amount: 10000,
      currency: 'CHF',
      funding_purpose:
        'Veterinary care and medical supplies ($4000), Food and nutrition ($2500), Shelter maintenance and improvements ($2000), Adoption program support ($1000), Educational materials ($500)',
      category: 'Charity',
    },
  },
  {
    id: 'art-exhibition',
    name: 'Art Exhibition',
    icon: <Palette className="w-4 h-4" />,
    tagline: 'Showcase local artists and cultural diversity',
    defaults: {
      title: 'Traveling Art Exhibition',
      description:
        'Organizing a traveling art show featuring local artists and cultural exhibits to celebrate creativity in our community. This exhibition will showcase diverse artistic talents and provide a platform for emerging artists to share their work with wider audiences.\n\nThe exhibition will tour three cities over two months, featuring paintings, sculptures, photography, and digital art from 25 local artists. Each venue will include artist talks, workshops, and networking events.',
      goal_amount: 3000,
      currency: 'EUR',
      funding_purpose:
        'Venue rental and setup ($1200), Artist compensation and materials ($800), Marketing and promotional materials ($500), Exhibition catalog printing ($300), Opening reception events ($200)',
      category: 'Creative',
    },
  },
  {
    id: 'open-source',
    name: 'Open Source Project',
    icon: <Lightbulb className="w-4 h-4" />,
    tagline: 'Build privacy-focused tools for everyone',
    defaults: {
      title: 'Open Source Privacy Tools',
      description:
        "Building free, open-source privacy tools that anyone can use, audit, and improve. Our mission is to make privacy accessible to everyone, not just technical experts.\n\nWe're developing a suite of privacy-focused applications including encrypted messaging, secure file sharing, and anonymous browsing tools. All code is open source, regularly audited, and available on GitHub. The project is maintained by a global community of contributors.",
      goal_amount: 1000000,
      currency: 'SATS',
      funding_purpose:
        'Developer time and compensation (60%), Infrastructure and hosting (20%), Security audits (10%), Documentation and tutorials (10%)',
      category: 'Technology',
    },
  },
];

interface ProjectTemplatesProps {
  onSelectTemplate: (template: ProjectTemplate) => void;
  className?: string;
}

export function ProjectTemplates({ onSelectTemplate, className = '' }: ProjectTemplatesProps) {
  return (
    <TemplatePicker
      label="Projects"
      templates={PROJECT_TEMPLATES}
      onSelectTemplate={onSelectTemplate}
      className={className}
    />
  );
}
