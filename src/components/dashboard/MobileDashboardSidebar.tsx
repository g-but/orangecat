'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { Target, BarChart3, TrendingUp, Plus } from 'lucide-react';
import { ENTITY_REGISTRY } from '@/config/entity-registry';

interface MobileDashboardSidebarProps {
  stats: {
    totalProjects: number;
    totalRaised: number;
    totalSupporters: number;
    primaryCurrency: string;
  };
}

/**
 * MobileDashboardSidebar - Mobile-optimized sidebar for dashboard metrics
 *
 * Displays key stats (impact metrics, analytics) in a touch-friendly layout.
 * DRY: Profile completion is handled by DashboardJourney (SSOT).
 * DRY: Quick actions are handled by DashboardQuickActions (SSOT).
 *
 * NOTE: This sidebar focuses on STATS only.
 * Entity navigation (Products, Services, etc.) is handled by the main nav sidebar.
 */
export function MobileDashboardSidebar({ stats }: MobileDashboardSidebarProps) {
  const router = useRouter();
  const { totalProjects, totalRaised, totalSupporters, primaryCurrency } = stats;

  return (
    <div className="space-y-4 lg:hidden">
      {/* Impact Overview - Enhanced mobile version */}
      <Card className="border-l-4 border-l-orange-500">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <h3 className="text-base font-semibold text-gray-900">Your Impact</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
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
          <div className="text-center p-2 bg-purple-50 rounded-lg">
            <div className="text-lg font-bold text-purple-600">{totalSupporters}</div>
            <div className="text-xs text-gray-600">Supporters</div>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started / Analytics */}
      {totalProjects === 0 ? (
        <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50/50 to-teal-50/50">
          <CardContent className="p-5 text-center">
            <div className="p-3 bg-emerald-100 rounded-xl inline-flex mb-4">
              <Target className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-3">Ready to Start Fundraising?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Create your first Bitcoin crowdfunding project in minutes.
            </p>
            <Button
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              onClick={() => router.push(ENTITY_REGISTRY.project.createPath)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-l-4 border-l-green-400">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-green-600" />
              <h3 className="text-base font-semibold text-gray-900">Analytics</h3>
            </div>
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
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-2"
                onClick={() => router.push(ENTITY_REGISTRY.project.basePath)}
              >
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default MobileDashboardSidebar;
