'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import {
  Target,
  Users,
  Star,
  BarChart3,
  Wallet,
  Zap,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

interface DashboardSidebarProps {
  stats: {
    totalProjects: number;
    totalDrafts: number;
    totalRaised: number;
    totalSupporters: number;
    primaryCurrency: string;
  };
  profileCompletion: number;
  profile: any;
}

/**
 * DashboardSidebar - Modular sidebar for dashboard metrics and quick actions
 *
 * Displays key metrics, profile completion, and urgent actions in a compact, sticky sidebar.
 * DRY component - reusable and maintainable.
 */
export function DashboardSidebar({ stats, profileCompletion, profile }: DashboardSidebarProps) {
  const router = useRouter();
  const { totalProjects, totalDrafts, totalRaised, totalSupporters, primaryCurrency } = stats;

  return (
    <aside className="lg:col-span-3 space-y-4">
      <div className="lg:sticky lg:top-20 space-y-4">
        {/* Key Metrics */}
        <Card className="shadow-card">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-gray-600">Projects</span>
                </div>
                <span className="text-lg font-bold text-gray-900">{totalProjects}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Raised</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  <CurrencyDisplay amount={totalRaised} currency={primaryCurrency} />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-gray-600">Supporters</span>
                </div>
                <span className="text-lg font-bold text-gray-900">{totalSupporters}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Urgent Actions */}
        {(totalDrafts > 0 || profileCompletion < 100) && (
          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-start gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <h3 className="text-sm font-semibold text-gray-900">Action Required</h3>
              </div>

              {profileCompletion < 100 && (
                <div className="mb-3 p-3 bg-white rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">Profile</span>
                    <span className="text-sm font-bold text-orange-600">{profileCompletion}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-orange-600"
                      style={{ width: `${profileCompletion}%` }}
                    />
                  </div>
                  <Button
                    onClick={() => router.push('/dashboard/info')}
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                  >
                    Complete Profile
                  </Button>
                </div>
              )}

              {totalDrafts > 0 && (
                <div className="p-3 bg-white rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {totalDrafts} Draft Project{totalDrafts !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <Button
                    onClick={() => router.push('/dashboard/projects')}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Finish Drafts
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Profile Card */}
        <Card className="shadow-card hover:shadow-card-hover transition-all cursor-pointer" onClick={() => router.push('/profile')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-6 h-6 text-blue-600" />
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Profile</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="font-medium text-base text-gray-900">{profileCompletion}%</div>
              <div className={profileCompletion === 100 ? 'text-green-600 font-medium' : 'text-orange-600'}>
                {profileCompletion === 100 ? 'All set!' : 'Needs attention'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        {totalProjects === 0 && (
          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 shadow-card hover:shadow-card-hover transition-all cursor-pointer" onClick={() => router.push('/projects/create')}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Zap className="w-6 h-6 text-orange-600" />
                </div>
                <ArrowRight className="w-5 h-5 text-orange-500" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Create Your First Project</h3>
              <p className="text-sm text-gray-600 mb-3">
                Launch your Bitcoin fundraising page in minutes
              </p>
              <Button className="w-full bg-gradient-to-r from-orange-600 to-orange-700" size="sm">
                Start Now
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Analytics Card (if has projects) */}
        {totalProjects > 0 && (
          <Card className="shadow-card hover:shadow-card-hover transition-all cursor-pointer" onClick={() => router.push('/dashboard/projects')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="w-6 h-6 text-green-600" />
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Performance</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="font-medium text-base text-gray-900">
                  <CurrencyDisplay
                    amount={totalProjects > 0 ? totalRaised / totalProjects : 0}
                    currency={primaryCurrency}
                    size="sm"
                  />
                </div>
                <div>Avg per project</div>
                <div className="text-green-600 font-medium">View analytics</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </aside>
  );
}
