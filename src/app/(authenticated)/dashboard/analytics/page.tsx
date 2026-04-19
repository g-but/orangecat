'use client';

import { useEffect, useState } from 'react';
import { useRequireAuth } from '@/hooks/useAuth';
import { useProjectStore } from '@/stores/projectStore';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import Loading from '@/components/Loading';
import { TrendingUp, Users, DollarSign, Target, Zap, Clock } from 'lucide-react';
import AnalyticsMetricsGrid from './components/AnalyticsMetricsGrid';
import type { AnalyticsMetric } from './components/AnalyticsMetricsGrid';
import CampaignPerformanceTable from './components/CampaignPerformanceTable';
import type { CampaignPerformance } from './components/CampaignPerformanceTable';
import AnalyticsInsights from './components/AnalyticsInsights';

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
      { label: 'Total Raised', value: totalRaised, change: 12.5, changeType: 'increase', icon: DollarSign, color: 'text-green-600' },
      { label: 'Active Projects', value: activeProjects.length, change: activeProjects.length > 0 ? 2 : 0, changeType: activeProjects.length > 0 ? 'increase' : 'neutral', icon: Target, color: 'text-blue-600' },
      { label: 'Total Supporters', value: totalSupporters, change: 8.3, changeType: 'increase', icon: Users, color: 'text-purple-600' },
      { label: 'Avg Contribution', value: avgDonation, change: -2.1, changeType: 'decrease', icon: TrendingUp, color: 'text-orange-600' },
      { label: 'Success Rate', value: `${successRate.toFixed(1)}%`, change: 5.2, changeType: 'increase', icon: Zap, color: 'text-teal-600' },
      { label: 'Avg Campaign Duration', value: '23 days', change: -1.5, changeType: 'decrease', icon: Clock, color: 'text-indigo-600' },
    ];
  };

  const getCampaignPerformance = (): CampaignPerformance[] => {
    return projects.map(project => ({
      id: project.id,
      title: project.title || 'Untitled Campaign',
      totalRaised: project.total_funding || 0,
      goalAmount: project.goal_amount || 0,
      supporters: project.contributor_count || 0,
      conversionRate: Math.random() * 5 + 1,
      avgDonation: project.contributor_count > 0 ? (project.total_funding || 0) / project.contributor_count : 0,
      daysActive: Math.floor((Date.now() - new Date(project.created_at).getTime()) / (1000 * 60 * 60 * 24)),
      views: Math.floor(Math.random() * 1000) + 100,
      shares: Math.floor(Math.random() * 50) + 5,
    }));
  };

  const metrics = calculateMetrics();
  const projectPerformance = getCampaignPerformance();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Breadcrumb items={[{ label: 'Analytics' }]} className="mb-4" />
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campaign Analytics</h1>
            <p className="text-gray-600 mt-1">Track your fundraising performance and insights</p>
          </div>

          <div className="flex items-center gap-4">
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

      <AnalyticsMetricsGrid metrics={metrics} />
      <CampaignPerformanceTable campaigns={projectPerformance} />
      <AnalyticsInsights hasProjects={projects.length > 0} />
    </div>
  );
}
