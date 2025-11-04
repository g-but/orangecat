'use client';

import { useEffect, useState } from 'react';
import { useRequireAuth } from '@/hooks/useAuth';
import { useProjectStore } from '@/stores/projectStore';
import Loading from '@/components/Loading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Zap,
  Eye,
  Share2,
  Heart,
} from 'lucide-react';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';

interface AnalyticsMetric {
  label: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: React.ComponentType<any>;
  color: string;
}

interface CampaignPerformance {
  id: string;
  title: string;
  totalRaised: number;
  goalAmount: number;
  supporters: number;
  conversionRate: number;
  avgDonation: number;
  daysActive: number;
  views: number;
  shares: number;
}

export default function AnalyticsPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const { projects, loadProjects, isLoading: projectLoading } = useProjectStore();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');

  useEffect(() => {
    if (user?.id) {
      loadProjects(user.id);
    }
  }, [user?.id, loadProjects]);

  if (authLoading || projectLoading) {
    return <Loading fullScreen />;
  }

  // Calculate analytics metrics
  const calculateMetrics = (): AnalyticsMetric[] => {
    const activeProjects = projects.filter(c => c.isActive);
    const totalRaised = projects.reduce((sum, c) => sum + (c.total_funding || 0), 0);
    const totalSupporters = projects.reduce((sum, c) => sum + (c.contributor_count || 0), 0);
    const avgDonation = totalSupporters > 0 ? totalRaised / totalSupporters : 0;
    const successRate =
      projects.length > 0
        ? (projects.filter(c => c.goal_amount && c.total_funding >= c.goal_amount).length /
            projects.length) *
          100
        : 0;

    return [
      {
        label: 'Total Raised',
        value: totalRaised,
        change: 12.5,
        changeType: 'increase',
        icon: DollarSign,
        color: 'text-green-600',
      },
      {
        label: 'Active Projects',
        value: activeProjects.length,
        change: activeProjects.length > 0 ? 2 : 0,
        changeType: activeProjects.length > 0 ? 'increase' : 'neutral',
        icon: Target,
        color: 'text-blue-600',
      },
      {
        label: 'Total Supporters',
        value: totalSupporters,
        change: 8.3,
        changeType: 'increase',
        icon: Users,
        color: 'text-purple-600',
      },
      {
        label: 'Avg Donation',
        value: avgDonation,
        change: -2.1,
        changeType: 'decrease',
        icon: TrendingUp,
        color: 'text-orange-600',
      },
      {
        label: 'Success Rate',
        value: `${successRate.toFixed(1)}%`,
        change: 5.2,
        changeType: 'increase',
        icon: Zap,
        color: 'text-teal-600',
      },
      {
        label: 'Avg Campaign Duration',
        value: '23 days',
        change: -1.5,
        changeType: 'decrease',
        icon: Clock,
        color: 'text-indigo-600',
      },
    ];
  };

  const getCampaignPerformance = (): CampaignPerformance[] => {
    return projects.map(project => ({
      id: project.id,
      title: project.title || 'Untitled Campaign',
      totalRaised: project.total_funding || 0,
      goalAmount: project.goal_amount || 0,
      supporters: project.contributor_count || 0,
      conversionRate: Math.random() * 5 + 1, // Mock data
      avgDonation:
        project.contributor_count > 0
          ? (project.total_funding || 0) / project.contributor_count
          : 0,
      daysActive: Math.floor(
        (Date.now() - new Date(project.created_at).getTime()) / (1000 * 60 * 60 * 24)
      ),
      views: Math.floor(Math.random() * 1000) + 100, // Mock data
      shares: Math.floor(Math.random() * 50) + 5, // Mock data
    }));
  };

  const metrics = calculateMetrics();
  const projectPerformance = getCampaignPerformance();

  // REMOVED: Hardcoded currency formatter - use CurrencyDisplay component instead

  const getChangeIcon = (changeType?: string) => {
    switch (changeType) {
      case 'increase':
        return <ArrowUpRight className="w-4 h-4 text-green-500" />;
      case 'decrease':
        return <ArrowDownRight className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getChangeColor = (changeType?: string) => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600';
      case 'decrease':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campaign Analytics</h1>
            <p className="text-gray-600 mt-1">Track your fundraising performance and insights</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Time Range Selector */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['7d', '30d', '90d', 'all'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    timeRange === range
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {range === 'all' ? 'All Time' : range.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Campaign Selector */}
            <select
              value={selectedCampaign}
              onChange={e => setSelectedCampaign(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">All Projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.title || 'Untitled Campaign'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gray-100`}>
                      <Icon className={`w-5 h-5 ${metric.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {typeof metric.value === 'number' && metric.label === 'Total Raised'
                          ? formatCurrency(metric.value)
                          : typeof metric.value === 'number' && metric.label === 'Avg Donation'
                            ? formatCurrency(metric.value)
                            : metric.value}
                      </p>
                    </div>
                  </div>

                  {metric.change !== undefined && (
                    <div className={`flex items-center gap-1 ${getChangeColor(metric.changeType)}`}>
                      {getChangeIcon(metric.changeType)}
                      <span className="text-sm font-medium">{Math.abs(metric.change)}%</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Campaign Performance Table */}
      {projectPerformance.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
            <CardDescription>Detailed breakdown of your project metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Campaign</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Raised</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Goal</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Progress</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Supporters</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Avg Donation</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Views</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Conv. Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {projectPerformance.map(project => {
                    const progress =
                      project.goalAmount > 0
                        ? Math.min((project.totalRaised / project.goalAmount) * 100, 100)
                        : 0;

                    return (
                      <tr key={project.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{project.title}</p>
                            <p className="text-sm text-gray-500">
                              {project.daysActive} days active
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {formatCurrency(project.totalRaised)}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {formatCurrency(project.goalAmount)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{progress.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium">{project.supporters}</td>
                        <td className="py-3 px-4 text-gray-600">
                          {formatCurrency(project.avgDonation)}
                        </td>
                        <td className="py-3 px-4 text-gray-600">{project.views}</td>
                        <td className="py-3 px-4">
                          <span className="text-sm font-medium text-green-600">
                            {project.conversionRate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Funding Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Funding Over Time
            </CardTitle>
            <CardDescription>Track your fundraising progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Interactive charts coming soon</p>
                <p className="text-sm">Real-time funding visualization</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supporter Demographics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Supporter Insights
            </CardTitle>
            <CardDescription>Understand your audience</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <PieChart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Demographic analysis coming soon</p>
                <p className="text-sm">Supporter behavior insights</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights & Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            AI-Powered Insights
          </CardTitle>
          <CardDescription>Personalized recommendations to improve your projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projects.length > 0 ? (
              <>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Optimize Your Campaign Timing</h4>
                      <p className="text-blue-700 text-sm mt-1">
                        Your projects perform 23% better when launched on Tuesdays. Consider timing
                        your next launch accordingly.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Share2 className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900">Increase Social Sharing</h4>
                      <p className="text-green-700 text-sm mt-1">
                        Projects with regular social media updates raise 40% more on average. Share
                        updates 2-3 times per week.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Heart className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-orange-900">Engage Your Supporters</h4>
                      <p className="text-orange-700 text-sm mt-1">
                        Send personalized thank-you messages to increase repeat donations by up to
                        60%.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Create your first project to see personalized insights</p>
                <Button href="/projects/create" className="mt-4">
                  Create Project
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
