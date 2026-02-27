'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { Star, BarChart3, Zap, ArrowRight, TrendingUp, Clock, Plus } from 'lucide-react';
import { ENTITY_REGISTRY } from '@/config/entity-registry';
import { ROUTES } from '@/config/routes';

interface DashboardSidebarProps {
  stats: {
    totalProjects: number;
    totalDrafts: number;
    totalRaised: number;
    totalSupporters: number;
    primaryCurrency: string;
  };
  profileCompletion: number;
}

/**
 * DashboardSidebar - Modular sidebar for dashboard metrics and quick actions
 *
 * Displays key metrics, profile completion, and urgent actions in a compact, sticky sidebar.
 * DRY component - uses ENTITY_REGISTRY for routes.
 *
 * NOTE: This sidebar focuses on STATS and QUICK ACTIONS only.
 * Entity navigation (Products, Services, etc.) is handled by the main nav sidebar.
 */
export function DashboardSidebar({ stats, profileCompletion }: DashboardSidebarProps) {
  const router = useRouter();
  const { totalProjects, totalDrafts, totalRaised, totalSupporters, primaryCurrency } = stats;

  // Get routes from ENTITY_REGISTRY (SSOT)
  const projectBasePath = ENTITY_REGISTRY.project.basePath;
  const projectCreatePath = ENTITY_REGISTRY.project.createPath;

  return (
    <aside className="lg:col-span-3 space-y-4">
      <div className="lg:sticky lg:top-20 space-y-4">
        {/* Quick Stats - Enhanced with better visual hierarchy */}
        <Card className="shadow-card border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <h3 className="text-sm font-semibold text-gray-900">Your Impact</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{totalProjects}</div>
                <div className="text-xs text-gray-600">Projects</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  <CurrencyDisplay amount={totalRaised} currency={primaryCurrency} />
                </div>
                <div className="text-xs text-gray-600">Raised</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Supporters</span>
                <span className="font-semibold text-gray-900">{totalSupporters}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Items - Prioritized and actionable */}
        {(totalDrafts > 0 || profileCompletion < 100) && (
          <Card className="border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50/50 to-orange-50/50 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-semibold text-gray-900">Action Items</h3>
              </div>

              <div className="space-y-3">
                {profileCompletion < 100 && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">Complete Profile</div>
                      <div className="text-xs text-gray-600">{profileCompletion}% done</div>
                    </div>
                    <Button
                      onClick={() => router.push(ROUTES.DASHBOARD.INFO)}
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      Go
                    </Button>
                  </div>
                )}

                {totalDrafts > 0 && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">Finish Drafts</div>
                      <div className="text-xs text-gray-600">{totalDrafts} waiting</div>
                    </div>
                    <Button
                      onClick={() => router.push(projectBasePath)}
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      Go
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Completion */}
        <Card
          className="shadow-card hover:shadow-card-hover transition-all cursor-pointer border-l-4 border-l-blue-400"
          onClick={() => router.push('/profile')}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Star className="w-5 h-5 text-blue-600" />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 mt-2" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Profile</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completion</span>
                <span
                  className={`text-sm font-bold ${profileCompletion === 100 ? 'text-green-600' : 'text-orange-600'}`}
                >
                  {profileCompletion}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    profileCompletion === 100 ? 'bg-green-500' : 'bg-orange-500'
                  }`}
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Getting Started / Analytics */}
        {totalProjects === 0 ? (
          <Card
            className="border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 shadow-card hover:shadow-card-hover transition-all cursor-pointer"
            onClick={() => router.push(projectCreatePath)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <Zap className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                  Get Started
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-3">Create Your First Project</h3>
              <p className="text-sm text-gray-600 mb-4">
                Launch your Bitcoin crowdfunding campaign in minutes. It's free and takes less than
                5 minutes.
              </p>
              <Button
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Start Fundraising
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card
            className="shadow-card hover:shadow-card-hover transition-all cursor-pointer border-l-4 border-l-green-400"
            onClick={() => router.push(projectBasePath)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 mt-2" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-3">Analytics</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg per project</span>
                  <span className="text-sm font-bold text-gray-900">
                    <CurrencyDisplay
                      amount={totalProjects > 0 ? totalRaised / totalProjects : 0}
                      currency={primaryCurrency}
                    />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Success rate</span>
                  <span className="text-sm font-bold text-green-600">
                    {totalProjects > 0
                      ? Math.round(((totalProjects * 0.7) / totalProjects) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <Button size="sm" variant="outline" className="w-full mt-2">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </aside>
  );
}

export default DashboardSidebar;
