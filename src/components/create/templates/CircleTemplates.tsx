'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Users, Heart, Briefcase, Zap, Target, Coins, MapPin, Sparkles } from 'lucide-react';
import type { CircleTemplate } from '@/config/entity-configs/circle-config';

import type { UserCircleFormData } from '@/lib/validation';
import { transformCircleTemplate } from '../utils/templateTransformers';

interface CircleTemplatesProps {
  onSelectTemplate: (template: Partial<UserCircleFormData> | null) => void;
}

const CIRCLE_TEMPLATES: CircleTemplate[] = [
  {
    id: 'family-savings',
    name: 'Family Savings Circle',
    description: 'Coordinate family savings and emergency funds',
    category: 'Family',
    icon: '👨‍👩‍👧‍👦',
    color: 'bg-blue-500',
    suggestedSettings: {
      visibility: 'private',
      member_approval: 'invite',
      wallet_purpose: 'Family emergency fund and shared expenses'
    },
    benefits: ['Secure family funds', 'Emergency preparedness', 'Shared financial goals'],
    useCase: 'Perfect for families wanting to pool resources for major purchases or unexpected expenses.'
  },
  {
    id: 'bitcoin-investors',
    name: 'Bitcoin Investment Club',
    description: 'Group Bitcoin investing and education',
    category: 'Investment',
    icon: '₿',
    color: 'bg-orange-500',
    suggestedSettings: {
      visibility: 'private',
      member_approval: 'manual',
      wallet_purpose: 'Collective Bitcoin investments'
    },
    benefits: ['Shared research', 'Dollar-cost averaging', 'Community learning'],
    useCase: 'Ideal for friends or colleagues interested in learning about Bitcoin together.'
  },
  {
    id: 'freelancer-network',
    name: 'Freelancer Network',
    description: 'Connect and collaborate with fellow freelancers',
    category: 'Freelancer',
    icon: '💼',
    color: 'bg-green-500',
    suggestedSettings: {
      visibility: 'public',
      member_approval: 'auto',
      max_members: 50
    },
    benefits: ['Client referrals', 'Skill sharing', 'Mutual support'],
    useCase: 'Great for freelancers in the same field to share opportunities and knowledge.'
  },
  {
    id: 'neighborhood-aid',
    name: 'Neighborhood Mutual Aid',
    description: 'Support your local community',
    category: 'Community',
    icon: '🏘️',
    color: 'bg-purple-500',
    suggestedSettings: {
      visibility: 'public',
      member_approval: 'auto',
      wallet_purpose: 'Community projects and mutual aid'
    },
    benefits: ['Local support network', 'Community resilience', 'Shared resources'],
    useCase: 'Build stronger community bonds and provide mutual support during challenging times.'
  },
  {
    id: 'skill-share',
    name: 'Skill Sharing Hub',
    description: 'Teach and learn new skills together',
    category: 'Skill-Sharing',
    icon: '🎓',
    color: 'bg-indigo-500',
    suggestedSettings: {
      visibility: 'public',
      member_approval: 'auto'
    },
    benefits: ['Continuous learning', 'Knowledge exchange', 'Personal growth'],
    useCase: 'Create a vibrant learning community where everyone can teach and learn.'
  },
  {
    id: 'startup-founders',
    name: 'Startup Founders Circle',
    description: 'Early-stage entrepreneurs supporting each other',
    category: 'Startup',
    icon: '🚀',
    color: 'bg-pink-500',
    suggestedSettings: {
      visibility: 'private',
      member_approval: 'manual',
      enable_projects: true
    },
    benefits: ['Mentorship opportunities', 'Collaborative projects', 'Shared resources'],
    useCase: 'Perfect for founders who want to build together and support each other\'s ventures.'
  },
  {
    id: 'emergency-fund',
    name: 'Emergency Fund Collective',
    description: 'Build collective emergency savings',
    category: 'Emergency',
    icon: '🛡️',
    color: 'bg-red-500',
    suggestedSettings: {
      visibility: 'private',
      member_approval: 'invite',
      wallet_purpose: 'Emergency fund for unexpected life events'
    },
    benefits: ['Financial security', 'Peace of mind', 'Community support'],
    useCase: 'Create a safety net for life\'s unexpected challenges.'
  },
  {
    id: 'cultural-preservation',
    name: 'Cultural Preservation',
    description: 'Preserve and celebrate cultural heritage',
    category: 'Cultural',
    icon: '🎭',
    color: 'bg-yellow-500',
    suggestedSettings: {
      visibility: 'public',
      member_approval: 'auto',
      enable_events: true
    },
    benefits: ['Cultural continuity', 'Community building', 'Shared traditions'],
    useCase: 'Keep cultural traditions alive and connect with others who share your heritage.'
  }
];

export function CircleTemplates({ onSelectTemplate }: CircleTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', name: 'All Circles', icon: Sparkles },
    { id: 'Family', name: 'Family', icon: Users },
    { id: 'Investment', name: 'Investment', icon: Coins },
    { id: 'Community', name: 'Community', icon: Heart },
    { id: 'Professional', name: 'Professional', icon: Briefcase },
    { id: 'Other', name: 'Other', icon: Target },
  ];

  const filteredTemplates = selectedCategory === 'all'
    ? CIRCLE_TEMPLATES
    : CIRCLE_TEMPLATES.filter(template => template.category === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Choose a Circle Template
        </h3>
        <p className="text-gray-600 mb-6">
          Start with a proven template or create your own from scratch
        </p>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="flex items-center gap-2"
            >
              <category.icon className="w-4 h-4" />
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="text-center mb-4">
              <div className={`w-16 h-16 ${template.color} rounded-full flex items-center justify-center mx-auto mb-3 text-2xl group-hover:scale-110 transition-transform`}>
                {template.icon}
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">{template.name}</h4>
              <p className="text-sm text-gray-600 mb-3">{template.description}</p>
              <Badge variant="secondary" className="text-xs">
                {template.category}
              </Badge>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <h5 className="text-sm font-medium text-gray-900 mb-2">Benefits:</h5>
                <ul className="text-xs text-gray-600 space-y-1">
                  {template.benefits.slice(0, 2).map((benefit, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-1 h-1 bg-purple-500 rounded-full mr-2 flex-shrink-0"></span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h5 className="text-sm font-medium text-gray-900 mb-1">Perfect for:</h5>
                <p className="text-xs text-gray-600">{template.useCase}</p>
              </div>
            </div>

            <Button
              onClick={() => onSelectTemplate(transformCircleTemplate(template))}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              size="sm"
            >
              Use This Template
            </Button>
          </Card>
        ))}
      </div>

      {/* Custom Circle CTA */}
      <div className="text-center pt-8 border-t border-gray-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-2">
          Don't see what you need?
        </h4>
        <p className="text-gray-600 mb-4">
          Create a custom circle with all the advanced features you want.
        </p>
        <Button
          onClick={() => onSelectTemplate(null)}
          variant="outline"
          className="border-purple-300 text-purple-700 hover:bg-purple-50"
        >
          Create Custom Circle
        </Button>
      </div>
    </div>
  );
}

