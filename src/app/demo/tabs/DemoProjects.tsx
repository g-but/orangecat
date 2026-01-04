'use client';

/**
 * DEMO PROJECTS TAB
 *
 * Shows project discovery and crowdfunding.
 */

import { Target, Heart } from 'lucide-react';
import { type DemoProject, formatSats, getStatusBadgeColor } from '@/data/demo';

interface DemoProjectsProps {
  projects: DemoProject[];
}

export function DemoProjects({ projects }: DemoProjectsProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Discover Projects</h2>
          <p className="text-gray-600">Support innovative Bitcoin projects</p>
        </div>
        <button className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-700 transition-colors">
          <Target className="w-4 h-4" />
          Start Project
        </button>
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {projects.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}

// ==================== SUB-COMPONENTS ====================

interface ProjectCardProps {
  project: DemoProject;
}

function ProjectCard({ project }: ProjectCardProps) {
  const progressPercent = (project.raised / project.goal) * 100;

  return (
    <div className="bg-white rounded-lg border overflow-hidden shadow-sm">
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{project.avatar}</span>
            <div>
              <h3 className="font-bold text-lg">{project.title}</h3>
              <p className="text-sm text-gray-600">by {project.creator}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded text-sm ${getStatusBadgeColor(project.status)}`}>
            {project.status}
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-700 mb-4 line-clamp-3">{project.description}</p>

        {/* Progress */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">
              {formatSats(project.raised)} of {formatSats(project.goal)}
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>

          <div className="flex justify-between text-sm text-gray-600">
            <span>{project.backers} backers</span>
            <span>{project.daysLeft} days left</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button className="flex-1 bg-orange-600 text-white py-2 rounded font-medium hover:bg-orange-700 transition-colors">
              Support Project
            </button>
            <button
              className="px-4 py-2 border rounded hover:bg-gray-50 transition-colors"
              aria-label="Add to favorites"
            >
              <Heart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



