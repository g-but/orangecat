'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Eye, Users, Star } from 'lucide-react';
import { ENTITY_REGISTRY } from '@/config/entity-registry';

interface DashboardQuickActionsProps {
  hasProjects: boolean;
}

/**
 * DashboardQuickActions - Common quick action buttons
 * Uses ENTITY_REGISTRY for entity-related routes
 */
export function DashboardQuickActions({ hasProjects }: DashboardQuickActionsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks to get you started</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {hasProjects ? (
            <Link href={ENTITY_REGISTRY.project.basePath}>
              <Button variant="outline" className="min-h-[44px]">
                <Eye className="w-4 h-4 mr-2" />
                Manage Projects
              </Button>
            </Link>
          ) : (
            <Link href="/discover">
              <Button variant="outline" className="min-h-[44px]">
                <Users className="w-4 h-4 mr-2" />
                Explore Projects
              </Button>
            </Link>
          )}

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

export default DashboardQuickActions;
