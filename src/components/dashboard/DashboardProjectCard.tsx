'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { Users, Eye, Edit3 } from 'lucide-react';
import { Project } from '@/types/project';

interface DashboardProjectCardProps {
  project: Project;
}

/**
 * DashboardProjectCard - Reusable project card for dashboard
 *
 * Displays project information with progress, funding, and quick actions.
 * Modular, DRY component for consistent project display across dashboard.
 */
export function DashboardProjectCard({ project }: DashboardProjectCardProps) {
  const goalAmount = project.goal_amount || 0;
  const totalFunding = project.total_funding || 0;
  const progressPercentage = goalAmount > 0 ? Math.min((totalFunding / goalAmount) * 100, 100) : 0;
  const projectCurrency = project.currency || 'CHF';

  // Determine status badge
  const getStatusBadge = () => {
    if (project.isDraft) {
      return {
        label: 'Draft',
        className:
          'px-3 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap',
      };
    }
    if (project.isPaused) {
      return {
        label: 'Paused',
        className:
          'px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200 whitespace-nowrap',
      };
    }
    if (project.isActive) {
      return {
        label: 'Active',
        className:
          'px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-200 whitespace-nowrap',
      };
    }
    return {
      label: 'Inactive',
      className:
        'px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 border border-gray-200 whitespace-nowrap',
    };
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 hover:shadow-lg hover:border-gray-300 transition-all duration-200 group">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <Link href={`/projects/${project.id}`} className="flex-1 min-w-0">
              <h4 className="font-bold text-base sm:text-lg text-gray-900 hover:text-bitcoinOrange transition-colors duration-200 cursor-pointer group-hover:underline truncate">
                {project.title}
              </h4>
            </Link>
            <div className={statusBadge.className}>{statusBadge.label}</div>
          </div>

          {/* Progress Bar */}
          {goalAmount > 0 ? (
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-900">
                  <CurrencyDisplay amount={totalFunding} currency={projectCurrency} size="sm" />{' '}
                  raised
                </span>
                <span className="text-sm font-medium text-bitcoinOrange">
                  {progressPercentage.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                <div
                  className="bg-gradient-to-r from-bitcoinOrange to-orange-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="text-xs text-gray-500">
                of <CurrencyDisplay amount={goalAmount} currency={projectCurrency} size="sm" /> goal
              </div>
            </div>
          ) : (
            <div className="mb-3">
              <div className="text-sm font-medium text-gray-900">
                <CurrencyDisplay amount={totalFunding} currency={projectCurrency} size="sm" />{' '}
                raised
              </div>
            </div>
          )}

          {/* Stats Row */}
          <div className="flex items-center gap-4 sm:gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span className="font-medium">{project.contributor_count || 0}</span>
              <span className="hidden sm:inline">supporters</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-shrink-0 sm:flex-col">
          <Link href={`/projects/${project.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto hover:bg-bitcoinOrange/10 hover:border-bitcoinOrange"
            >
              <Eye className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">View</span>
            </Button>
          </Link>
          <Link href={`/projects/create?draft=${project.id}`}>
            <Button variant="outline" size="sm" className="w-full sm:w-auto hover:bg-gray-100">
              <Edit3 className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
