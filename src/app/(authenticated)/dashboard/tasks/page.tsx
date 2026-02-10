'use client';

/**
 * Tasks Page
 *
 * Main task management view for staff members
 * Features: List, filter, complete, request, flag tasks
 *
 * Following Engineering Principles:
 * - DRY: Reusable components
 * - SSOT: Config from tasks.ts
 * - Separation of Concerns: UI only, logic in hooks/services
 *
 * Created: 2026-02-05
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useAuth';
import Loading from '@/components/Loading';
import EntityListShell from '@/components/entity/EntityListShell';
import Button from '@/components/ui/Button';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import {
  TASK_CATEGORIES,
  TASK_STATUSES,
  TASK_TYPES,
  TASK_CATEGORY_LABELS,
  TASK_STATUS_LABELS,
  TASK_TYPE_LABELS,
  getTaskStatusInfo,
  getPriorityInfo,
} from '@/config/tasks';
import type { Task } from '@/lib/schemas/tasks';
import {
  ClipboardList,
  AlertTriangle,
  Play,
  CheckCircle,
  Clock,
  Filter,
  Plus,
  ChevronDown,
  ChevronUp,
  BarChart3,
} from 'lucide-react';

type TaskCategory = (typeof TASK_CATEGORIES)[keyof typeof TASK_CATEGORIES];
type TaskStatus = (typeof TASK_STATUSES)[keyof typeof TASK_STATUSES];
type TaskType = (typeof TASK_TYPES)[keyof typeof TASK_TYPES];

interface TaskWithRelations extends Task {
  creator?: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  project?: {
    id: string;
    title: string;
  } | null;
}

export default function TasksPage() {
  const { user, isLoading: authLoading, hydrated } = useRequireAuth();
  const router = useRouter();

  // State
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | ''>('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<TaskType | ''>('');
  const [showArchived, setShowArchived] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Load tasks
  const loadTasks = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (categoryFilter) {
        params.set('category', categoryFilter);
      }
      if (statusFilter) {
        params.set('status', statusFilter);
      }
      if (typeFilter) {
        params.set('type', typeFilter);
      }
      if (showArchived) {
        params.set('archived', 'true');
      }

      const response = await fetch(`/api/tasks?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load tasks');
      }

      setTasks(data.data?.tasks || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load tasks';
      logger.error('Failed to load tasks', { error: err }, 'TasksPage');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, categoryFilter, statusFilter, typeFilter, showArchived]);

  useEffect(() => {
    if (hydrated && !authLoading && user) {
      loadTasks();
    }
  }, [hydrated, authLoading, user, loadTasks]);

  // Group tasks by status for quick overview
  const taskCounts = useMemo(() => {
    return {
      total: tasks.length,
      idle: tasks.filter(t => t.current_status === TASK_STATUSES.IDLE).length,
      needsAttention: tasks.filter(t => t.current_status === TASK_STATUSES.NEEDS_ATTENTION).length,
      requested: tasks.filter(t => t.current_status === TASK_STATUSES.REQUESTED).length,
      inProgress: tasks.filter(t => t.current_status === TASK_STATUSES.IN_PROGRESS).length,
    };
  }, [tasks]);

  // Handle task completion
  const handleComplete = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to complete task');
      }

      toast.success('Task completed!');
      loadTasks();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete task';
      toast.error(message);
    }
  };

  // Handle flag as needs attention
  const handleFlagAttention = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/attention`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Needs attention' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to flag task');
      }

      toast.success('Task flagged');
      loadTasks();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to flag task';
      toast.error(message);
    }
  };

  if (authLoading) {
    return <Loading fullScreen message="Loading tasks..." />;
  }

  if (!user) {
    return null;
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        href="/dashboard/tasks/analytics"
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <BarChart3 className="h-4 w-4" />
        <span className="hidden sm:inline">Analytics</span>
      </Button>
      <Button
        onClick={() => setShowFilters(!showFilters)}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Filter className="h-4 w-4" />
        <span className="hidden sm:inline">Filter</span>
        {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>
      <Button
        href="/dashboard/tasks/new"
        className="flex items-center gap-2 bg-gradient-to-r from-tiffany-600 to-tiffany-700"
      >
        <Plus className="h-4 w-4" />
        <span>New task</span>
      </Button>
    </div>
  );

  return (
    <EntityListShell
      title="Tasks"
      description="Manage and complete team tasks"
      headerActions={headerActions}
    >
      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <QuickStatCard icon={ClipboardList} label="Total" value={taskCounts.total} color="gray" />
        <QuickStatCard icon={Clock} label="Ready" value={taskCounts.idle} color="blue" />
        <QuickStatCard
          icon={AlertTriangle}
          label="Needs attention"
          value={taskCounts.needsAttention}
          color="amber"
        />
        <QuickStatCard
          icon={Play}
          label="In progress"
          value={taskCounts.inProgress}
          color="green"
        />
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value as TaskCategory | '')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tiffany-500"
              >
                <option value="">All categories</option>
                {Object.entries(TASK_CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as TaskStatus | '')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tiffany-500"
              >
                <option value="">All statuses</option>
                {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as TaskType | '')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tiffany-500"
              >
                <option value="">All types</option>
                {Object.entries(TASK_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={e => setShowArchived(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-tiffany-600 focus:ring-tiffany-500"
              />
              <span>Show archived</span>
            </label>
          </div>
        </div>
      )}

      {/* Task List */}
      {error ? (
        <div className="rounded-xl border bg-white p-6 text-red-600">{error}</div>
      ) : loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-600 mb-6">
            {categoryFilter || statusFilter || typeFilter
              ? 'Try different filter settings'
              : 'Create your first task'}
          </p>
          <Button href="/dashboard/tasks/new" className="inline-flex">
            <Plus className="h-4 w-4 mr-2" />
            New task
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={() => handleComplete(task.id)}
              onFlagAttention={() => handleFlagAttention(task.id)}
              onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
            />
          ))}
        </div>
      )}
    </EntityListShell>
  );
}

// Quick Stat Card Component
function QuickStatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof ClipboardList;
  label: string;
  value: number;
  color: 'gray' | 'blue' | 'amber' | 'green';
}) {
  const colorClasses = {
    gray: 'bg-gray-50 text-gray-600 border-gray-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    green: 'bg-green-50 text-green-600 border-green-200',
  };

  return (
    <div className={`rounded-xl border p-3 ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium truncate">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

// Task Card Component
function TaskCard({
  task,
  onComplete,
  onFlagAttention,
  onClick,
}: {
  task: TaskWithRelations;
  onComplete: () => void;
  onFlagAttention: () => void;
  onClick: () => void;
}) {
  const statusInfo = getTaskStatusInfo(task.current_status);
  const priorityInfo = getPriorityInfo(task.priority);

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-base font-semibold text-gray-900 truncate">{task.title}</h3>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `${statusInfo.color}20`,
                color: statusInfo.color,
              }}
            >
              {statusInfo.label}
            </span>
            {task.priority !== 'normal' && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${priorityInfo.color}20`,
                  color: priorityInfo.color,
                }}
              >
                {priorityInfo.label}
              </span>
            )}
          </div>
          {task.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">{task.description}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{TASK_CATEGORY_LABELS[task.category as keyof typeof TASK_CATEGORY_LABELS]}</span>
            <span>•</span>
            <span>{TASK_TYPE_LABELS[task.task_type as keyof typeof TASK_TYPE_LABELS]}</span>
            {task.estimated_minutes && (
              <>
                <span>•</span>
                <span>~{task.estimated_minutes} min</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          {task.current_status !== TASK_STATUSES.NEEDS_ATTENTION && (
            <button
              onClick={onFlagAttention}
              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
              title="Flag as needs attention"
            >
              <AlertTriangle className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={onComplete}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Mark as complete"
          >
            <CheckCircle className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
