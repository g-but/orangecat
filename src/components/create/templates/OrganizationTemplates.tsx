'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Building2, Network, Users, Briefcase, Heart, TrendingUp, Shield, Zap } from 'lucide-react';
import type { OrganizationFormData } from '@/lib/validation';
// transformOrganizationTemplate is now handled by CreateEntityWorkflow

export interface OrganizationTemplate {
  id: string;
  name: string;
  description: string;
  type: OrganizationFormData['type'];
  icon: string;
  color: string;
  suggestedSettings: Partial<OrganizationFormData>;
  benefits: string[];
  useCase: string;
}

export interface OrganizationTemplatesProps {
  onSelectTemplate: (template: Partial<OrganizationFormData>) => void;
}

export const ORGANIZATION_TEMPLATES: OrganizationTemplate[] = [
  {
    id: 'dao',
    name: 'Decentralized Autonomous Organization',
    description: 'On-chain governance and collective decision-making',
    type: 'dao',
    icon: '🌐',
    color: 'bg-purple-500',
    suggestedSettings: {
      governance_model: 'liquid_democracy',
      is_public: true,
      requires_approval: true,
      tags: ['dao', 'governance', 'blockchain'],
    },
    benefits: ['Transparent governance', 'On-chain voting', 'Collective treasury', 'Global participation'],
    useCase: 'Perfect for protocol communities, open-source projects, and decentralized initiatives requiring transparent governance.',
  },
  {
    id: 'nonprofit',
    name: 'Non-Profit Foundation',
    description: 'Charitable organization with transparent operations',
    type: 'nonprofit',
    icon: '❤️',
    color: 'bg-red-500',
    suggestedSettings: {
      governance_model: 'democratic',
      is_public: true,
      requires_approval: true,
      tags: ['nonprofit', 'charity', 'transparency'],
    },
    benefits: ['Transparent donations', 'Public accountability', 'Tax compliance', 'Community trust'],
    useCase: 'Ideal for charitable foundations, educational institutions, and community service organizations.',
  },
  {
    id: 'cooperative',
    name: 'Worker Cooperative',
    description: 'Member-owned business with democratic control',
    type: 'cooperative',
    icon: '🤝',
    color: 'bg-green-500',
    suggestedSettings: {
      governance_model: 'democratic',
      is_public: false,
      requires_approval: true,
      tags: ['cooperative', 'worker-owned', 'democracy'],
    },
    benefits: ['Democratic ownership', 'Profit sharing', 'Collective decision-making', 'Member equity'],
    useCase: 'Great for businesses where workers want shared ownership and equal voting rights.',
  },
  {
    id: 'investment-syndicate',
    name: 'Investment Syndicate',
    description: 'Collective investment group with shared treasury',
    type: 'syndicate',
    icon: '📈',
    color: 'bg-orange-500',
    suggestedSettings: {
      governance_model: 'stake_weighted',
      is_public: false,
      requires_approval: true,
      tags: ['investment', 'syndicate', 'bitcoin'],
    },
    benefits: ['Pooled capital', 'Shared research', 'Risk diversification', 'Collective expertise'],
    useCase: 'Perfect for groups pooling resources for Bitcoin investments, real estate, or other assets.',
  },
  {
    id: 'professional-guild',
    name: 'Professional Guild',
    description: 'Industry association with standards and certification',
    type: 'guild',
    icon: '⚖️',
    color: 'bg-blue-500',
    suggestedSettings: {
      governance_model: 'hierarchical',
      is_public: true,
      requires_approval: true,
      tags: ['guild', 'professional', 'standards'],
    },
    benefits: ['Professional standards', 'Certification programs', 'Industry advocacy', 'Networking'],
    useCase: 'Ideal for professional associations, trade guilds, and industry standards organizations.',
  },
  {
    id: 'community-collective',
    name: 'Community Collective',
    description: 'Grassroots organization for local action',
    type: 'collective',
    icon: '🏘️',
    color: 'bg-indigo-500',
    suggestedSettings: {
      governance_model: 'consensus',
      is_public: true,
      requires_approval: false,
      tags: ['community', 'local', 'grassroots'],
    },
    benefits: ['Local impact', 'Grassroots organizing', 'Community empowerment', 'Flexible structure'],
    useCase: 'Great for neighborhood associations, activist groups, and community organizing initiatives.',
  },
  {
    id: 'startup-company',
    name: 'Startup Company',
    description: 'Early-stage business with structured governance',
    type: 'company',
    icon: '🚀',
    color: 'bg-pink-500',
    suggestedSettings: {
      governance_model: 'hierarchical',
      is_public: false,
      requires_approval: true,
      tags: ['startup', 'business', 'entrepreneurship'],
    },
    benefits: ['Structured operations', 'Clear roles', 'Investor relations', 'Scalable governance'],
    useCase: 'Perfect for startups needing formal structure while maintaining flexibility for growth.',
  },
  {
    id: 'foundation',
    name: 'Grant-Making Foundation',
    description: 'Foundation for distributing grants and funding',
    type: 'foundation',
    icon: '🏛️',
    color: 'bg-amber-500',
    suggestedSettings: {
      governance_model: 'hierarchical',
      is_public: true,
      requires_approval: true,
      tags: ['foundation', 'grants', 'philanthropy'],
    },
    benefits: ['Grant management', 'Transparent funding', 'Impact tracking', 'Donor relations'],
    useCase: 'Ideal for foundations distributing grants, managing endowments, and tracking impact.',
  },
];

export default function OrganizationTemplates({ onSelectTemplate }: OrganizationTemplatesProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (template: OrganizationTemplate) => {
    setSelectedId(template.id);
    // Pass the template data directly - CreateEntityWorkflow handles transformation
    onSelectTemplate({
      type: template.type,
      ...template.suggestedSettings
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose an Organization Template</h3>
        <p className="text-sm text-gray-600">
          Start with a pre-configured template or create a custom organization from scratch.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ORGANIZATION_TEMPLATES.map((template) => (
          <Card
            key={template.id}
            className={`p-5 cursor-pointer transition-all hover:shadow-lg ${
              selectedId === template.id ? 'ring-2 ring-purple-500 border-purple-500' : ''
            }`}
            onClick={() => handleSelect(template)}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-12 h-12 ${template.color} rounded-lg flex items-center justify-center text-2xl flex-shrink-0`}>
                {template.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 mb-1">{template.name}</h4>
                <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
              </div>
            </div>

            <div className="mb-3">
              <Badge variant="outline" className="text-xs">
                {template.type}
              </Badge>
            </div>

            <div className="space-y-2 mb-3">
              <p className="text-xs text-gray-500 font-medium">Benefits:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                {template.benefits.slice(0, 2).map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <span className="text-purple-500 mt-0.5">•</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-gray-500 italic mb-3 line-clamp-2">{template.useCase}</p>

            <Button
              variant={selectedId === template.id ? 'default' : 'outline'}
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(template);
              }}
            >
              {selectedId === template.id ? 'Selected' : 'Use Template'}
            </Button>
          </Card>
        ))}
      </div>

      <div className="text-center pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          Don't see what you need?{' '}
          <button
            type="button"
            onClick={() => onSelectTemplate(null)}
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            Start from scratch
          </button>
        </p>
      </div>
    </div>
  );
}

