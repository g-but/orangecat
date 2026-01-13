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
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks to get you started</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hasProjects ? (
            <Link href={ENTITY_REGISTRY.project.basePath}>
              <Button variant="outline" className="w-full h-16 flex-col">
                <Eye className="w-5 h-5 mb-2" />
                Manage Projects
              </Button>
            </Link>
          ) : (
            <Link href="/discover">
              <Button variant="outline" className="w-full h-16 flex-col">
                <Users className="w-5 h-5 mb-2" />
                Explore Projects
              </Button>
            </Link>
          )}

          <Link href="/profile">
            <Button variant="outline" className="w-full h-16 flex-col">
              <Star className="w-5 h-5 mb-2" />
              Update Profile
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default DashboardQuickActions;
