'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Eye, Star, ArrowRight } from 'lucide-react';
import { ENTITY_REGISTRY, getEntitiesByCategory } from '@/config/entity-registry';

interface DashboardQuickActionsProps {
  hasProjects: boolean;
}

/** Categories shown in getting-started cards */
const GETTING_STARTED_CATEGORIES = ['business', 'community', 'finance'] as const;
const CATEGORY_LABELS: Record<string, string> = {
  business: 'Commerce',
  community: 'Community',
  finance: 'Finance',
};

/**
 * DashboardQuickActions - Quick action buttons + getting-started entity cards
 * When user has no projects, shows entity type cards to guide first creation.
 * Uses ENTITY_REGISTRY for entity-related routes (SSOT).
 */
export function DashboardQuickActions({ hasProjects }: DashboardQuickActionsProps) {
  if (hasProjects) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link href={ENTITY_REGISTRY.project.basePath}>
              <Button variant="outline" className="min-h-[44px]">
                <Eye className="w-4 h-4 mr-2" />
                Manage Projects
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="outline" className="min-h-[44px]">
                <Star className="w-4 h-4 mr-2" />
                Update Profile
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const entitiesByCategory = getEntitiesByCategory();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Get Started</CardTitle>
        <CardDescription>Create your first listing — pick a category to begin</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {GETTING_STARTED_CATEGORIES.map(category => {
          const entities = entitiesByCategory[category];
          if (!entities?.length) {
            return null;
          }

          return (
            <div key={category}>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {CATEGORY_LABELS[category] ?? category}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {entities.slice(0, 4).map(entity => {
                  const Icon = entity.icon;
                  return (
                    <Link key={entity.type} href={entity.createPath}>
                      <div className="flex items-center gap-3 p-3 rounded-lg border hover:border-orange-300 hover:bg-orange-50/50 transition-all cursor-pointer min-h-[44px]">
                        <div className="p-1.5 bg-orange-50 rounded-md flex-shrink-0">
                          <Icon className="h-4 w-4 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{entity.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {entity.description}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default DashboardQuickActions;
