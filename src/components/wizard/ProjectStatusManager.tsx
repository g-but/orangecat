/**
 * Project Status Manager Component
 *
 * Handles project status display and status change actions.
 * Extracted from ProjectWizard.tsx for better modularity.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Extracted from ProjectWizard.tsx
 */

'use client';

import { Rocket, Pause, Play, EyeOff, CheckCircle2, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import type { ProjectStatus, StatusAction } from './types';

interface ProjectStatusManagerProps {
  projectId: string;
  currentStatus: ProjectStatus;
  isUpdating: boolean;
  onStatusChange: (newStatus: ProjectStatus) => void;
}

export default function ProjectStatusManager({
  projectId: _projectId,
  currentStatus,
  isUpdating,
  onStatusChange,
}: ProjectStatusManagerProps) {
  const getStatusActions = (): StatusAction[] => {
    switch (currentStatus) {
      case 'draft':
        return [
          {
            label: 'Publish Project',
            status: 'active',
            icon: Rocket,
            variant: 'primary',
          },
        ];
      case 'active':
        return [
          {
            label: 'Pause Funding',
            status: 'paused',
            icon: Pause,
            variant: 'secondary',
          },
          {
            label: 'Unpublish',
            status: 'draft',
            icon: EyeOff,
            variant: 'secondary',
          },
          {
            label: 'Mark as Completed',
            status: 'completed',
            icon: CheckCircle2,
            variant: 'secondary',
          },
        ];
      case 'paused':
        return [
          {
            label: 'Resume Funding',
            status: 'active',
            icon: Play,
            variant: 'primary',
          },
          {
            label: 'Unpublish',
            status: 'draft',
            icon: EyeOff,
            variant: 'secondary',
          },
        ];
      case 'completed':
      case 'cancelled':
        return [
          {
            label: 'Unpublish',
            status: 'draft',
            icon: EyeOff,
            variant: 'secondary',
          },
        ];
      default:
        return [];
    }
  };

  const getStatusBadge = (status: ProjectStatus) => {
    const badges = {
      draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700 border-gray-200' },
      active: { label: 'Active', className: 'bg-green-100 text-green-700 border-green-200' },
      paused: { label: 'Paused', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
      completed: { label: 'Completed', className: 'bg-blue-100 text-blue-700 border-blue-200' },
      cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700 border-red-200' },
    };
    return badges[status];
  };

  const statusBadge = getStatusBadge(currentStatus);
  const statusActions = getStatusActions();

  return (
    <Card className="p-6 bg-gradient-to-r from-orange-50/50 to-tiffany-50/50 border-orange-200">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Current Status:</span>
          <span
            className={`px-3 py-1.5 rounded-full text-sm font-medium border ${statusBadge.className}`}
          >
            {statusBadge.label}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {statusActions.map(action => {
            const Icon = action.icon;
            return (
              <Button
                key={action.status}
                variant={action.variant}
                size="sm"
                onClick={() => onStatusChange(action.status)}
                disabled={isUpdating}
                className="flex items-center gap-2"
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
                {action.label}
              </Button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
