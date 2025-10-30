/**
 * ProjectTemplates Component
 *
 * Displays pre-filled project templates for inspiration and quick start.
 * Templates include community garden, animal shelter, art exhibition, etc.
 *
 * Purpose: Reduce blank page anxiety, provide inspiration, speed up creation.
 *
 * @module components/create/templates
 */

'use client';

import React from 'react';
import { Sprout, Heart, Palette, Lightbulb, Rocket } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export interface ProjectTemplate {
  id: string;
  name: string;
  icon: React.ReactNode;
  tagline: string;
  data: {
    title: string;
    description: string;
    goalAmount: string;
    goalCurrency: string;
    fundingPurpose: string;
    selectedCategories: string[];
  };
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'community-garden',
    name: 'Community Garden',
    icon: <Sprout className="w-5 h-5" />,
    tagline: 'Transform unused space into green community hub',
    data: {
      title: 'Community Garden Project',
      description:
        "Creating a shared community space with raised garden beds and educational workshops for local families. This project will transform unused land into a thriving community garden where residents can grow organic vegetables, learn sustainable farming practices, and build stronger neighborhood connections.\n\nOur garden will feature 20 raised beds, a composting station, rainwater collection system, and a small greenhouse. We'll host weekly workshops on organic gardening, composting, and sustainable living. All community members are welcome to participate, regardless of gardening experience.",
      goalAmount: '5000',
      goalCurrency: 'CHF',
      fundingPurpose:
        'Construction materials for raised beds ($2000), Soil and composting infrastructure ($1000), Gardening tools and equipment ($800), Educational workshop materials ($500), Seeds and starter plants ($400), Signage and documentation ($300)',
      selectedCategories: ['community', 'education', 'environment'],
    },
  },
  {
    id: 'animal-shelter',
    name: 'Animal Shelter',
    icon: <Heart className="w-5 h-5" />,
    tagline: 'Rescue and rehome abandoned pets',
    data: {
      title: 'Local Animal Shelter Support',
      description:
        'Supporting animal rescue operations and providing veterinary care for abandoned pets in our community. Our shelter has rescued over 200 animals in the past year, giving them a second chance at finding loving families.\n\nWe operate a no-kill shelter focused on rehabilitation and adoption. Every animal receives full veterinary care, behavioral assessment, and socialization before adoption. We also run educational programs teaching responsible pet ownership.',
      goalAmount: '10000',
      goalCurrency: 'CHF',
      fundingPurpose:
        'Veterinary care and medical supplies ($4000), Food and nutrition ($2500), Shelter maintenance and improvements ($2000), Adoption program support ($1000), Educational materials ($500)',
      selectedCategories: ['charity', 'health', 'humanitarian'],
    },
  },
  {
    id: 'art-exhibition',
    name: 'Art Exhibition',
    icon: <Palette className="w-5 h-5" />,
    tagline: 'Showcase local artists and cultural diversity',
    data: {
      title: 'Traveling Art Exhibition',
      description:
        'Organizing a traveling art show featuring local artists and cultural exhibits to celebrate creativity in our community. This exhibition will showcase diverse artistic talents and provide a platform for emerging artists to share their work with wider audiences.\n\nThe exhibition will tour three cities over two months, featuring paintings, sculptures, photography, and digital art from 25 local artists. Each venue will include artist talks, workshops, and networking events.',
      goalAmount: '3000',
      goalCurrency: 'EUR',
      fundingPurpose:
        'Venue rental and setup ($1200), Artist compensation and materials ($800), Marketing and promotional materials ($500), Exhibition catalog printing ($300), Opening reception events ($200)',
      selectedCategories: ['creative', 'community', 'business'],
    },
  },
  {
    id: 'open-source',
    name: 'Open Source Project',
    icon: <Lightbulb className="w-5 h-5" />,
    tagline: 'Build privacy-focused tools for everyone',
    data: {
      title: 'Open Source Privacy Tools',
      description:
        "Building free, open-source privacy tools that anyone can use, audit, and improve. Our mission is to make privacy accessible to everyone, not just technical experts.\n\nWe're developing a suite of privacy-focused applications including encrypted messaging, secure file sharing, and anonymous browsing tools. All code is open source, regularly audited, and available on GitHub. The project is maintained by a global community of contributors.",
      goalAmount: '1000000',
      goalCurrency: 'SATS',
      fundingPurpose:
        'Developer time and compensation (60%), Infrastructure and hosting (20%), Security audits (10%), Documentation and tutorials (10%)',
      selectedCategories: ['technology', 'education', 'humanitarian'],
    },
  },
];

interface ProjectTemplatesProps {
  onSelectTemplate: (template: ProjectTemplate) => void;
  className?: string;
}

/**
 * Displays clickable project templates for inspiration
 */
export function ProjectTemplates({ onSelectTemplate, className = '' }: ProjectTemplatesProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Rocket className="w-5 h-5 text-orange-600" />
        <h3 className="text-lg font-semibold text-gray-900">Quick Start Templates</h3>
      </div>
      <p className="text-sm text-gray-600 mb-6">
        Click a template to prefill your form with example content. Edit it to match your project!
      </p>

      {/* Template Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PROJECT_TEMPLATES.map(template => (
          <Card
            key={template.id}
            className="p-4 hover:shadow-md transition-all cursor-pointer border-2 border-transparent hover:border-orange-200"
            onClick={() => onSelectTemplate(template)}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                {template.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">{template.name}</h4>
                <p className="text-xs text-gray-600 line-clamp-2">{template.tagline}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Info */}
      <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
        <p className="text-xs text-blue-800">
          💡 Templates are just starting points. Customize everything to match your unique project!
        </p>
      </div>
    </div>
  );
}
