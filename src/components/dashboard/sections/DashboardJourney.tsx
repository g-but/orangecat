'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Wallet, Plus, Target, MessageCircle, Eye } from 'lucide-react';
import { ENTITY_REGISTRY } from '@/config/entity-registry';
import TasksSection from '@/components/dashboard/TasksSection';

interface GuidedSuggestion {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  priority: number;
  reason: string;
}

interface DashboardJourneyProps {
  profileCompletion: number;
  hasBitcoinAddress: boolean;
  hasProjects: boolean;
  hasAnyDraft: boolean;
  totalDrafts: number;
  hasTimelineActivity: boolean;
}

/**
 * DashboardJourney - Profile completion and guided suggestions
 * Uses ENTITY_REGISTRY for entity-related routes
 */
export function DashboardJourney({
  profileCompletion,
  hasBitcoinAddress,
  hasProjects,
  hasAnyDraft,
  totalDrafts,
  hasTimelineActivity,
}: DashboardJourneyProps) {
  // PRIORITIZED guided suggestions - most important actions first
  const guidedSuggestions = useMemo(() => {
    const suggestions: GuidedSuggestion[] = [];

    // Priority 1: Bitcoin address is critical for receiving funds
    if (!hasBitcoinAddress) {
      suggestions.push({
        title: 'Add your Bitcoin address',
        description: 'Required to receive funds from supporters.',
        href: ENTITY_REGISTRY.wallet.basePath,
        icon: <Wallet className="w-4 h-4 text-orange-600" />,
        priority: 1,
        reason: 'unlock-payments',
      });
    }

    // Priority 2: First project is the main value prop
    if (!hasProjects) {
      suggestions.push({
        title: 'Create your first project',
        description: 'Launch a Bitcoin crowdfunding campaign in minutes.',
        href: ENTITY_REGISTRY.project.createPath,
        icon: <Plus className="w-4 h-4 text-blue-600" />,
        priority: 2,
        reason: 'core-feature',
      });
    }

    // Priority 3: Complete drafts (they're already started)
    if (hasAnyDraft) {
      suggestions.push({
        title: 'Finish your draft',
        description: `Complete ${totalDrafts} pending project${totalDrafts > 1 ? 's' : ''}.`,
        href: ENTITY_REGISTRY.project.basePath,
        icon: <Target className="w-4 h-4 text-emerald-600" />,
        priority: 3,
        reason: 'continue-work',
      });
    }

    // Priority 4: Engage with community
    if (!hasTimelineActivity) {
      suggestions.push({
        title: 'Post an update',
        description: 'Share with the community and build your audience.',
        href: '/timeline',
        icon: <MessageCircle className="w-4 h-4 text-indigo-600" />,
        priority: 4,
        reason: 'community',
      });
    }

    // Priority 5: Explore what others are doing
    if (hasProjects && hasBitcoinAddress) {
      suggestions.push({
        title: 'Discover projects',
        description: 'See what others are building and get inspired.',
        href: '/discover',
        icon: <Eye className="w-4 h-4 text-purple-600" />,
        priority: 5,
        reason: 'explore',
      });
    }

    // Sort by priority and return top 4
    return suggestions.sort((a, b) => a.priority - b.priority).slice(0, 4);
  }, [hasAnyDraft, hasBitcoinAddress, hasTimelineActivity, hasProjects, totalDrafts]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Your OrangeCat journey</CardTitle>
          <CardDescription>Stay on track with clear next steps.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Profile completion</span>
              <span className="text-sm font-semibold text-gray-900">{profileCompletion}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-orange-500 to-tiffany-500 transition-all"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Complete your profile to build trust and unlock suggestions tailored to you.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
            {guidedSuggestions.map(suggestion => (
              <Link key={suggestion.title} href={suggestion.href}>
                <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 hover:border-orange-200 hover:shadow-sm transition-colors">
                  <div className="mt-1">{suggestion.icon}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{suggestion.title}</h3>
                    <p className="text-sm text-gray-600 leading-tight">{suggestion.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="lg:col-span-1">
        <TasksSection />
      </div>
    </div>
  );
}

export default DashboardJourney;
