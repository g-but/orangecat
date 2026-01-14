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
 * DashboardProjects - My Projects section for desktop
 * Uses ENTITY_REGISTRY for entity-related routes
 */
export function DashboardProjects({ projects }: DashboardProjectsProps) {
  if (projects.length === 0) {
    return null;
  }

  return (
    <div className="hidden lg:block">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Projects</CardTitle>
              <CardDescription>My Bitcoin fundraising projects</CardDescription>
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
          <div className="grid gap-4">
            {projects.slice(0, 3).map(project => (
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
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DashboardProjects;
