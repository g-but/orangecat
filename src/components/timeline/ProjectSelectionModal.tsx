'use client';

import React from 'react';
import BottomSheet from '@/components/ui/BottomSheet';
import { Check, ArrowLeft, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface Project {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string | null;
  contributor_count?: number;
}

interface ProjectSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  selectedProjects: string[];
  onToggleProject: (projectId: string) => void;
  loading?: boolean;
}

/**
 * X-style Project Selection Modal
 *
 * Matches X's "Choose audience" interface but for projects instead of groups.
 * Shows "Everyone" option and list of user's projects with selection checkmarks.
 */
export default function ProjectSelectionModal({
  isOpen,
  onClose,
  projects,
  selectedProjects,
  onToggleProject,
  loading = false,
}: ProjectSelectionModalProps) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      maxHeight="100vh"
      showCloseButton={false}
      closeOnOverlayClick={true}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <button
          onClick={onClose}
          className="p-2 -ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">Crosspost to projects</h2>
        <div className="w-9" /> {/* Spacer for centering */}
      </div>

      {/* Content */}
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 60px)' }}>
        {/* Everyone option (default - always selected) */}
        <div className="px-4 py-4 border-b border-gray-200">
          <button
            className="flex items-center justify-between w-full min-h-[44px]"
            disabled
            aria-label="Everyone (default)"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-base font-semibold text-gray-900">Everyone</div>
                <div className="text-sm text-gray-500">Post to your timeline</div>
              </div>
            </div>
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          </button>
        </div>

        {/* My Projects section */}
        {projects.length > 0 && (
          <div className="px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">My Projects</h3>
            <div className="space-y-1">
              {projects.map(project => {
                const isSelected = selectedProjects.includes(project.id);
                return (
                  <button
                    key={project.id}
                    onClick={() => onToggleProject(project.id)}
                    className={cn(
                      'flex items-center justify-between w-full px-3 py-3 rounded-lg transition-colors min-h-[60px]',
                      'hover:bg-gray-50 active:bg-gray-100',
                      isSelected && 'bg-orange-50'
                    )}
                    aria-label={`${isSelected ? 'Deselect' : 'Select'} ${project.title}`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Project icon/thumbnail */}
                      {project.thumbnail_url ? (
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={project.thumbnail_url}
                            alt={project.title}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold text-sm">
                            {project.title[0]?.toUpperCase() || 'P'}
                          </span>
                        </div>
                      )}

                      {/* Project info */}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-base font-semibold text-gray-900 truncate">
                          {project.title}
                        </div>
                        {project.contributor_count !== undefined && (
                          <div className="text-sm text-gray-500">
                            {project.contributor_count.toLocaleString()} supporter
                            {project.contributor_count !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Checkmark */}
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-3',
                        isSelected ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
                      )}
                    >
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && projects.length === 0 && (
          <div className="px-4 py-12 text-center">
            <div className="text-gray-500 text-sm">No projects available</div>
            <div className="text-gray-400 text-xs mt-1">
              Create a project to crosspost your updates
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="px-4 py-12 text-center">
            <div className="text-gray-500 text-sm">Loading projects...</div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}














































