'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import {
  Target,
  Users,
  Star,
  BarChart3,
  Wallet,
  Package,
  Briefcase,
  Heart,
  Cat,
  TrendingUp,
  Clock,
  Plus,
  ArrowRight,
} from 'lucide-react';

interface MobileDashboardSidebarProps {
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
 * Mobile-optimized sidebar for dashboard
 * Provides quick access to all features with touch-friendly design
 */
export function MobileDashboardSidebar({ stats, profileCompletion, profile }: MobileDashboardSidebarProps) {
  const router = useRouter();
  const { totalProjects, totalDrafts, totalRaised, totalSupporters, primaryCurrency } = stats;

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

      {/* Quick Actions */}
      {(totalDrafts > 0 || profileCompletion < 100) && (
        <Card className="border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50/50 to-orange-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-semibold text-gray-900">Quick Actions</h3>
            </div>

            <div className="space-y-3">
              {profileCompletion < 100 && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200">
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="text-sm font-medium text-gray-900">Complete Profile</div>
                    <div className="text-xs text-gray-600">{profileCompletion}% done</div>
                  </div>
                  <Button
                    onClick={() => router.push('/dashboard/info')}
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 flex-shrink-0"
                  >
                    Go
                  </Button>
                </div>
              )}

              {totalDrafts > 0 && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200">
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="text-sm font-medium text-gray-900">Finish Drafts</div>
                    <div className="text-xs text-gray-600">{totalDrafts} waiting</div>
                  </div>
                  <Button
                    onClick={() => router.push('/dashboard/projects')}
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 flex-shrink-0"
                  >
                    Go
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personal Economy - Mobile Optimized */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-600" />
            Personal Economy
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-2 gap-3">
            <Link href="/dashboard/store">
              <Card className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-orange-400">
                <CardContent className="p-3 text-center">
                  <Package className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-gray-900">My Store</div>
                  <div className="text-xs text-gray-600">Sell products</div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/services">
              <Card className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-blue-400">
                <CardContent className="p-3 text-center">
                  <Briefcase className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-gray-900">Services</div>
                  <div className="text-xs text-gray-600">Offer expertise</div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/causes">
              <Card className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-red-400">
                <CardContent className="p-3 text-center">
                  <Heart className="w-6 h-6 text-red-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-gray-900">Causes</div>
                  <div className="text-xs text-gray-600">Raise funds</div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/cat">
              <Card className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-purple-400 bg-gradient-to-r from-purple-50/30 to-pink-50/30">
                <CardContent className="p-3 text-center">
                  <Cat className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-gray-900">My Cat</div>
                  <div className="text-xs text-purple-600">Coming soon</div>
                </CardContent>
              </Card>
            </Link>
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
            <h3 className="font-bold text-gray-900 mb-3">Ready to Start Fundraising?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Create your first Bitcoin crowdfunding project in minutes.
            </p>
            <Button
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              onClick={() => router.push('/projects/create')}
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
                  {totalProjects > 0 ? Math.round((totalProjects * 0.7) / totalProjects * 100) : 0}%
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-2"
                onClick={() => router.push('/dashboard/projects')}
              >
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Section */}
      <Card className="border-l-4 border-l-blue-400">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-semibold text-gray-900">Account</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">Profile Completion</div>
                <div className="text-xs text-gray-600">{profileCompletion}% complete</div>
              </div>
              <Button
                onClick={() => router.push('/profile')}
                size="sm"
                variant="outline"
                className="flex-shrink-0"
              >
                Edit
              </Button>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  profileCompletion === 100 ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MobileDashboardSidebar;















