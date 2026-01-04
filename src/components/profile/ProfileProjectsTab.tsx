'use client';
import { logger } from '@/utils/logger';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Target, Bitcoin, ArrowRight } from 'lucide-react';
import { Profile } from '@/types/database';
import Button from '@/components/ui/Button';
import { ROUTES } from '@/lib/routes';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';

interface ProfileProjectsTabProps {
  profile: Profile;
  isOwnProfile?: boolean;
}

/**
 * ProfileProjectsTab Component
 *
 * Displays user's projects in a tab context.
 * Reuses project display logic for DRY principle.
 */
export default function ProfileProjectsTab({ profile, isOwnProfile }: ProfileProjectsTabProps) {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/profiles/${profile.id}/projects`);
        const result = await response.json();

        if (result.success && result.data && Array.isArray(result.data.data)) {
          setProjects(result.data.data);
        }
      } catch (error) {
        logger.error('Failed to fetch projects:', error);
      } finally {
        setLoading(false);
      }
    };

    if (profile.id) {
      fetchProjects();
    }
  }, [profile.id]);

  // Helper function to get status display info
  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      active: { label: 'Active', className: 'bg-green-100 text-green-700' },
      draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
      completed: { label: 'Completed', className: 'bg-blue-100 text-blue-700' },
      cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
      paused: { label: 'Paused', className: 'bg-yellow-100 text-yellow-700' },
    };
    return (
      statusMap[status?.toLowerCase()] || {
        label: status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown',
        className: 'bg-gray-100 text-gray-700',
      }
    );
  };

  // Format bitcoin display
  const formatBitcoinDisplay = (btc: number, unit: string) => {
    return `${btc.toFixed(8)} ${unit}`;
  };

  if (loading) {
    return <div className="text-gray-500 text-sm py-8 text-center">Loading projects...</div>;
  }

  // Filter out drafts for public display
  const publicProjects = projects.filter(project => project.status?.toLowerCase() !== 'draft');

  if (publicProjects.length === 0) {
    return (
      <div className="text-center py-12">
        <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Projects Yet</h3>
        <p className="text-gray-500 mb-6">
          {isOwnProfile ? "You haven't published any projects yet" : 'No projects to display'}
        </p>
        {isOwnProfile && (
          <Link href="/projects/create">
            <Button>
              <Target className="w-4 h-4 mr-2" />
              Create Your First Project
            </Button>
          </Link>
        )}
      </div>
    );
  }

  // Format relative time
  const getRelativeTime = (date: string) => {
    const created = new Date(date);
    const now = new Date();
    const days = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) {
      return 'Today';
    }
    if (days === 1) {
      return 'Yesterday';
    }
    if (days < 7) {
      return `${days}d ago`;
    }
    if (days < 30) {
      return `${Math.floor(days / 7)}w ago`;
    }
    return created.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      {/* Header with count */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Target className="w-5 h-5 text-orange-500" />
          {publicProjects.length} {publicProjects.length === 1 ? 'Project' : 'Projects'}
        </h3>
        {isOwnProfile && (
          <Link href="/dashboard/projects">
            <Button variant="ghost" size="sm">
              Manage All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        )}
      </div>

      {/* Projects Grid */}
      <div className="space-y-4">
        {publicProjects.map(project => {
          const statusInfo = getStatusInfo(project.status);
          const balanceBTC = project.bitcoin_balance_btc || 0;
          const goalAmount = project.goal_amount || 0;
          const raisedAmount = project.raised_amount || 0;
          const currentAmount = balanceBTC > 0 ? balanceBTC * 100_000_000 : raisedAmount;
          const progress = goalAmount > 0 ? Math.min((currentAmount / goalAmount) * 100, 100) : 0;
          const showStatusBadge =
            project.status && !['active', 'draft'].includes(project.status.toLowerCase());

          return (
            <Link
              key={project.id}
              href={ROUTES.PROJECTS.VIEW(project.id)}
              className="block overflow-hidden rounded-xl border-2 border-gray-200 hover:border-orange-300 hover:shadow-lg bg-white transition-all duration-200 group"
            >
              <div className="flex flex-col sm:flex-row">
                {/* Thumbnail */}
                <div className="relative w-full sm:w-32 h-48 sm:h-auto flex-shrink-0 bg-gradient-to-br from-orange-100 to-amber-100">
                  {project.thumbnail_url ? (
                    <Image
                      src={project.thumbnail_url}
                      alt={project.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Target className="w-12 h-12 text-orange-400" />
                    </div>
                  )}
                  {project.category && (
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-md text-xs font-medium text-gray-700">
                        {project.category}
                      </span>
                    </div>
                  )}
                  {showStatusBadge && (
                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-medium ${statusInfo.className}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-4 sm:p-5 flex flex-col">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-lg mb-1.5 group-hover:text-orange-600 transition-colors line-clamp-1">
                      {project.title}
                    </h4>
                    {project.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {project.description}
                      </p>
                    )}
                  </div>

                  {/* Progress */}
                  {goalAmount > 0 ? (
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-semibold text-gray-900">{progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">
                          <CurrencyDisplay
                            amount={currentAmount}
                            currency={project.currency || 'CHF'}
                            size="sm"
                          />
                        </span>
                        <span className="text-gray-500">
                          of{' '}
                          <CurrencyDisplay
                            amount={goalAmount}
                            currency={project.currency || 'CHF'}
                            size="sm"
                          />
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-3">
                      <div className="flex items-center gap-2">
                        <Bitcoin className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-semibold text-gray-900">
                          {balanceBTC > 0 ? (
                            formatBitcoinDisplay(balanceBTC, 'BTC')
                          ) : raisedAmount > 0 ? (
                            <CurrencyDisplay
                              amount={raisedAmount}
                              currency={project.currency || 'CHF'}
                              size="sm"
                            />
                          ) : (
                            'No funds yet'
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                    <span>{getRelativeTime(project.created_at)}</span>
                    {project.bitcoin_address && (
                      <span className="flex items-center gap-1 text-orange-600">
                        <Bitcoin className="w-3 h-3" />
                        Wallet
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
