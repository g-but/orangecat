'use client';

/**
 * Task Analytics Page
 *
 * View task completion statistics and fairness metrics
 *
 * Created: 2026-02-05
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useAuth';
import Loading from '@/components/Loading';
import Button from '@/components/ui/Button';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { TASK_CATEGORY_LABELS } from '@/config/tasks';
import {
  ArrowLeft,
  BarChart3,
  Users,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Award,
} from 'lucide-react';

interface ContributionData {
  user: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  totalCompletions: number;
  totalMinutes: number;
  byCategory: Record<string, number>;
}

interface FairnessData {
  task: {
    id: string;
    title: string;
    category: string;
    task_type: string;
  };
  totalCompletions: number;
  uniqueCompleterCount: number;
  completers: Array<{
    id: string;
    username: string;
    display_name: string | null;
    count: number;
  }>;
  fairnessScore: number;
  fairnessLevel: 'good' | 'moderate' | 'needs_attention';
}

interface DashboardStats {
  total: number;
  pending: number;
  needsAttention: number;
  inProgress: number;
  completedToday: number;
  completedThisWeek: number;
  myCompletedToday: number;
  openRequests: number;
}

export default function TaskAnalyticsPage() {
  const { user, isLoading: authLoading, hydrated } = useRequireAuth();
  const router = useRouter();

  // State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [contributions, setContributions] = useState<ContributionData[]>([]);
  const [fairnessData, setFairnessData] = useState<FairnessData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [days, setDays] = useState(30);

  // Load data
  const loadData = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [statsRes, contributionsRes, fairnessRes] = await Promise.all([
        fetch('/api/task-analytics'),
        fetch(`/api/task-analytics/contributions?days=${days}`),
        fetch(`/api/task-analytics/fairness?days=${days}`),
      ]);

      const [statsData, contributionsData, fairnessDataRes] = await Promise.all([
        statsRes.json(),
        contributionsRes.json(),
        fairnessRes.json(),
      ]);

      if (!statsRes.ok) {
        throw new Error(statsData.error || 'Failed to load stats');
      }
      if (!contributionsRes.ok) {
        throw new Error(contributionsData.error || 'Failed to load contributions');
      }
      if (!fairnessRes.ok) {
        throw new Error(fairnessDataRes.error || 'Failed to load fairness data');
      }

      setStats(statsData.data?.stats || null);
      setContributions(contributionsData.data?.contributions || []);
      setFairnessData(fairnessDataRes.data?.fairnessMetrics || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load analytics';
      logger.error('Failed to load analytics', { error: err }, 'TaskAnalyticsPage');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, days]);

  useEffect(() => {
    if (hydrated && !authLoading && user) {
      loadData();
    }
  }, [hydrated, authLoading, user, loadData]);

  if (authLoading || loading) {
    return <Loading fullScreen message="Loading statistics..." />;
  }

  if (!user) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-tiffany-50/20 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Button onClick={() => router.back()} variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="bg-white rounded-xl border border-red-200 p-6 text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  // Calculate max completions for progress bars
  const maxCompletions = Math.max(...contributions.map(c => c.totalCompletions), 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-tiffany-50/20 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={() => router.back()} variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Task Statistics</h1>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={days}
              onChange={e => setDays(parseInt(e.target.value))}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tiffany-500"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </div>

        {/* Overview Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              icon={CheckCircle}
              label="Completed today"
              value={stats.completedToday}
              color="green"
            />
            <StatCard
              icon={TrendingUp}
              label="This week"
              value={stats.completedThisWeek}
              color="blue"
            />
            <StatCard
              icon={AlertTriangle}
              label="Needs attention"
              value={stats.needsAttention}
              color="amber"
            />
            <StatCard
              icon={Clock}
              label="Open requests"
              value={stats.openRequests}
              color="purple"
            />
          </div>
        )}

        {/* Contributions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Contributions by Person
          </h2>
          {contributions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No data for the selected period</p>
          ) : (
            <div className="space-y-4">
              {contributions.map((contribution, index) => (
                <div key={contribution.user.id} className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-tiffany-100 text-tiffany-700 font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 truncate">
                        {contribution.user.display_name || contribution.user.username}
                      </span>
                      <span className="text-sm text-gray-600">
                        {contribution.totalCompletions} tasks
                        {contribution.totalMinutes > 0 && (
                          <span className="text-gray-400 ml-2">
                            ({Math.round(contribution.totalMinutes / 60)}h)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-tiffany-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${(contribution.totalCompletions / maxCompletions) * 100}%`,
                        }}
                      />
                    </div>
                    {Object.keys(contribution.byCategory).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(contribution.byCategory)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 3)
                          .map(([category, count]) => (
                            <span
                              key={category}
                              className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600"
                            >
                              {TASK_CATEGORY_LABELS[
                                category as keyof typeof TASK_CATEGORY_LABELS
                              ] || category}
                              : {count}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fairness */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="h-5 w-5" />
            Fairness Overview
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Shows how evenly recurring tasks are distributed. Low values indicate that a task is
            being completed by only a few people.
          </p>
          {fairnessData.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recurring tasks with completions</p>
          ) : (
            <div className="space-y-3">
              {fairnessData.slice(0, 10).map(item => (
                <div
                  key={item.task.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/tasks/${item.task.id}`)}
                >
                  <FairnessIndicator level={item.fairnessLevel} score={item.fairnessScore} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{item.task.title}</div>
                    <div className="text-sm text-gray-500">
                      {item.totalCompletions} completions by {item.uniqueCompleterCount} person
                      {item.uniqueCompleterCount !== 1 && 's'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">{item.fairnessScore}%</div>
                    <div className="text-xs text-gray-500">Fairness</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof BarChart3;
  label: string;
  value: number;
  color: 'green' | 'blue' | 'amber' | 'purple';
}) {
  const colorClasses = {
    green: 'bg-green-50 text-green-600 border-green-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );
}

// Fairness Indicator Component
function FairnessIndicator({
  level,
  score: _score,
}: {
  level: 'good' | 'moderate' | 'needs_attention';
  score: number;
}) {
  const config = {
    good: {
      color: 'bg-green-100 text-green-700',
      icon: CheckCircle,
    },
    moderate: {
      color: 'bg-amber-100 text-amber-700',
      icon: Clock,
    },
    needs_attention: {
      color: 'bg-red-100 text-red-700',
      icon: AlertTriangle,
    },
  };

  const { color, icon: Icon } = config[level];

  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
      <Icon className="h-5 w-5" />
    </div>
  );
}
