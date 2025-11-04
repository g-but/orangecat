/**
 * ProjectTile Component
 *
 * Standardized, reusable project card with:
 * - Consistent height and layout
 * - Primary currency display with BTC equivalent
 * - Proper spacing and line clamping
 * - Status badges and actions
 *
 * Created: 2025-06-05
 */

'use client';

import { Project } from '@/stores/projectStore';
import Button from '@/components/ui/Button';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { CheckSquare, Square, Trash2 } from 'lucide-react';
import { useCurrencyConversion } from '@/hooks/useCurrencyConversion';

interface ProjectTileProps {
  project: Project;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onDelete?: (project: Project) => void;
  isDeleting?: boolean;
}

export function ProjectTile({
  project,
  isSelected = false,
  onToggleSelect,
  onDelete,
  isDeleting = false,
}: ProjectTileProps) {
  const currency = project.currency || 'CHF';
  const { convertToBTC } = useCurrencyConversion();

  // Convert to BTC equivalent for display
  const btcEquivalent = convertToBTC(project.total_funding || 0, currency);
  const goalBtcEquivalent = project.goal_amount
    ? convertToBTC(project.goal_amount, currency)
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header with selection and delete */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {onToggleSelect && (
            <button
              onClick={e => {
                e.stopPropagation();
                onToggleSelect(project.id);
              }}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              {isSelected ? (
                <CheckSquare className="w-5 h-5 text-[#F7931A]" />
              ) : (
                <Square className="w-5 h-5" />
              )}
            </button>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {project.title || 'Untitled Project'}
            </h3>
          </div>
        </div>

        <div className="flex items-start gap-2 flex-shrink-0">
          <span
            className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
              project.isActive
                ? 'bg-green-100 text-green-700'
                : project.isDraft
                  ? 'bg-gray-100 text-gray-700'
                  : 'bg-blue-100 text-blue-700'
            }`}
          >
            {project.isActive ? 'Active' : project.isDraft ? 'Draft' : 'Completed'}
          </span>

          {onDelete && (
            <button
              onClick={() => onDelete(project)}
              disabled={isDeleting}
              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
              title="Delete project"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Description - Fixed height with line clamp */}
      <div className="flex-1 mb-3 min-h-[3rem]">
        {project.description ? (
          <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
        ) : (
          <p className="text-sm text-gray-400 italic">No description</p>
        )}
      </div>

      {/* Category badge */}
      {project.category && (
        <div className="mb-3">
          <span className="inline-flex items-center text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
            {project.category}
          </span>
        </div>
      )}

      {/* Creator info */}
      {project.creator_name && (
        <div className="mb-3 text-xs text-gray-500">
          Created by <span className="font-medium">{project.creator_name}</span>
        </div>
      )}

      {/* Funding display - Primary currency with BTC equivalent */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="space-y-2">
          <div>
            <p className="text-xs text-gray-500 mb-1">Raised</p>
            <div className="space-y-1">
              <div className="font-semibold">
                <CurrencyDisplay
                  amount={project.total_funding || 0}
                  currency={currency}
                  size="md"
                />
              </div>
              {currency !== 'BTC' && (
                <div className="text-xs text-gray-500">
                  <CurrencyDisplay amount={btcEquivalent} currency="BTC" size="sm" />
                </div>
              )}
            </div>
          </div>

          {project.goal_amount && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Goal</p>
              <div className="space-y-1">
                <div className="font-medium text-gray-700">
                  <CurrencyDisplay amount={project.goal_amount} currency={currency} size="sm" />
                </div>
                {currency !== 'BTC' && goalBtcEquivalent !== null && (
                  <div className="text-xs text-gray-500">
                    <CurrencyDisplay amount={goalBtcEquivalent} currency="BTC" size="sm" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        {project.isActive ? (
          <Button href={`/project/${project.id}`} size="sm" variant="outline" className="flex-1">
            View
          </Button>
        ) : (
          <Button
            href={`/projects/create?edit=${project.id}`}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            Edit
          </Button>
        )}
      </div>
    </div>
  );
}
