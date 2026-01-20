'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { BarChart3 } from 'lucide-react';
import { ProjectCard } from '@/components/entity/variants/ProjectCard';
import { ENTITY_REGISTRY } from '@/config/entity-registry';

// Use a generic interface compatible with the project store
interface DashboardProjectsProps {
  projects: Array<{
    id: string;
    title: string;
    total_funding?: number;
    goal_amount?: number;
    isDraft?: boolean;
    isPaused?: boolean;
    isActive?: boolean;
  }>;
}

/**
 * DashboardProjects - My Projects section
 *
 * Displays user's economic activity (projects) to reflect them as an economic agent.
 * Visible on all screen sizes - dashboard is a management view, not just desktop.
 * Uses ENTITY_REGISTRY for entity-related routes (SSOT principle).
 */
export function DashboardProjects({ projects }: DashboardProjectsProps) {
  // Show projects section even if empty - helps user understand their economic activity state
  // But provide helpful empty state if no projects exist
  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Projects</CardTitle>
              <CardDescription>Your Bitcoin fundraising projects</CardDescription>
            </div>
            <Link href={ENTITY_REGISTRY.project.createPath}>
              <Button size="sm" className="bg-gradient-to-r from-orange-500 to-orange-600">
                <BarChart3 className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm mb-2">No projects yet</p>
            <p className="text-xs text-gray-400 mb-4">
              Start your Bitcoin crowdfunding journey by creating your first project
            </p>
            <Link href={ENTITY_REGISTRY.project.createPath}>
              <Button variant="outline" size="sm">
                Create Your First Project
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>My Projects</CardTitle>
            <CardDescription>
              Your Bitcoin fundraising projects ({projects.length}{' '}
              {projects.length === 1 ? 'project' : 'projects'})
            </CardDescription>
          </div>
          <Link href={ENTITY_REGISTRY.project.basePath}>
            <Button variant="outline" size="sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {/* Compact grid: 1 column on mobile, 2 on tablet, 3 on desktop */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.slice(0, 6).map(project => (
            <ProjectCard
              key={project.id}
              href={`/projects/${project.id}`}
              project={
                {
                  ...project,
                  id: project.id,
                  title: project.title,
                  raised_amount: project.total_funding || 0,
                  goal_amount: project.goal_amount || 0,
                  status: project.isDraft
                    ? 'draft'
                    : project.isPaused
                      ? 'paused'
                      : project.isActive
                        ? 'active'
                        : 'draft',
                } as Parameters<typeof ProjectCard>[0]['project']
              }
              compact
            />
          ))}
        </div>
        {projects.length > 6 && (
          <div className="mt-4 text-center">
            <Link href={ENTITY_REGISTRY.project.basePath}>
              <Button variant="outline" size="sm">
                View {projects.length - 6} more {projects.length - 6 === 1 ? 'project' : 'projects'}
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DashboardProjects;
