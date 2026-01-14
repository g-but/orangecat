'use client';

import React, { useState } from 'react';
import BottomSheet from '@/components/ui/BottomSheet';
import { Globe, Lock, ChevronDown, Check } from 'lucide-react';
import { usePostComposer } from '@/hooks/usePostComposerNew';

interface PostOptionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  showVisibilityToggle: boolean;
  showProjectSelection: boolean;
}

/**
 * Component encapsulating the BottomSheet and its content for PostComposerMobile.
 * This component is designed to be lazy-loaded.
 */
export function PostOptionsSheet({
  isOpen,
  onClose,
  showVisibilityToggle,
  showProjectSelection,
}: PostOptionsSheetProps) {
  const composer = usePostComposer(); // Access composer state from context or pass down
  const [showProjectSelector, setShowProjectSelector] = useState(false);

  // If composer is not available (e.g., context not set up for this component),
  // we might need to pass down more props or ensure context is available globally.
  // For now, assuming usePostComposer can be called here.

  return (
    <BottomSheet id="post-options-sheet" isOpen={isOpen} onClose={onClose} title="Post Options">
      <div className="p-4 space-y-4">
        {/* Visibility Toggle */}
        {showVisibilityToggle && (
          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Visibility</span>
            <div className="flex bg-gray-100 rounded-lg p-1 border">
              <button
                onClick={() => composer.setVisibility('public')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                  composer.visibility === 'public'
                    ? 'bg-orange-100 text-orange-800 shadow-sm'
                    : 'text-gray-600 hover:bg-white'
                }`}
                aria-pressed={composer.visibility === 'public'}
              >
                <Globe className="w-4 h-4" />
                Public
              </button>
              <button
                onClick={() => composer.setVisibility('private')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                  composer.visibility === 'private'
                    ? 'bg-gray-800 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-white'
                }`}
                aria-pressed={composer.visibility === 'private'}
              >
                <Lock className="w-4 h-4" />
                Private
              </button>
            </div>
          </div>
        )}

        {/* Project Selection */}
        {showProjectSelection && composer.userProjects.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowProjectSelector(!showProjectSelector)}
              className="flex items-center justify-between w-full text-sm font-medium text-gray-700 min-h-[44px]"
              aria-expanded={showProjectSelector}
            >
              Also post to projects{' '}
              {composer.selectedProjects.length > 0 && `(${composer.selectedProjects.length})`}
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showProjectSelector ? 'rotate-180' : ''}`}
              />
            </button>

            {showProjectSelector && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {composer.userProjects.map(project => (
                  <button
                    key={project.id}
                    onClick={() => composer.toggleProjectSelection(project.id)}
                    className={`
                      flex items-center gap-3 w-full p-3 rounded-lg border transition-colors
                      ${
                        composer.selectedProjects.includes(project.id)
                          ? 'bg-orange-50 border-orange-200'
                          : 'bg-white border-gray-200 hover:border-orange-300'
                      }
                    `}
                    disabled={composer.isPosting}
                  >
                    <div
                      className={`
                      w-5 h-5 rounded border-2 flex items-center justify-center
                      ${
                        composer.selectedProjects.includes(project.id)
                          ? 'bg-orange-500 border-orange-500'
                          : 'border-gray-300'
                      }
                    `}
                    >
                      {composer.selectedProjects.includes(project.id) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-gray-900">{project.title}</div>
                      {project.description && (
                        <div className="text-xs text-gray-700 truncate">{project.description}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
