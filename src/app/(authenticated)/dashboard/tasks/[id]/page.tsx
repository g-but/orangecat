'use client';

/**
 * Task Detail Page
 *
 * View task details, completion history, and take actions
 *
 * Created: 2026-02-05
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useAuth';
import Loading from '@/components/Loading';
import Button from '@/components/ui/Button';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import {
  TASK_CATEGORY_LABELS,
  TASK_TYPE_LABELS,
  getTaskStatusInfo,
  getPriorityInfo,
} from '@/config/tasks';
import type { Task, TaskCompletion } from '@/lib/schemas/tasks';
import {
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Send,
  Clock,
  User,
  Calendar,
  Tag,
  FileText,
  History,
  Users,
} from 'lucide-react';

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

interface CompletionWithUser extends TaskCompletion {
  completer?: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export default function TaskDetailPage() {
  const { user, isLoading: authLoading, hydrated } = useRequireAuth();
  const router = useRouter();
  const params = useParams();
  const taskId = params?.id as string;

  // State
  const [task, setTask] = useState<TaskWithRelations | null>(null);
  const [completions, setCompletions] = useState<CompletionWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showAttentionModal, setShowAttentionModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionDuration, setCompletionDuration] = useState<number | ''>('');
  const [attentionMessage, setAttentionMessage] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [requestUserId, setRequestUserId] = useState<string>(''); // Empty = broadcast

  // Load task
  const loadTask = useCallback(async () => {
    if (!taskId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tasks/${taskId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load task');
      }

      const taskData = data.data?.task || null;
      setTask(taskData);
      // Completions are nested inside the task object from the API
      setCompletions(taskData?.completions || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load task';
      logger.error('Failed to load task', { error: err, taskId }, 'TaskDetailPage');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (hydrated && !authLoading && user) {
      loadTask();
    }
  }, [hydrated, authLoading, user, loadTask]);

  // Handle complete task
  const handleComplete = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: completionNotes || null,
          duration_minutes: completionDuration || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to complete task');
      }

      toast.success('Task completed!');
      setShowCompleteModal(false);
      setCompletionNotes('');
      setCompletionDuration('');
      loadTask();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete task';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle flag attention
  const handleFlagAttention = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/attention`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: attentionMessage || null }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to flag task');
      }

      toast.success('Task flagged');
      setShowAttentionModal(false);
      setAttentionMessage('');
      loadTask();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to flag task';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle request
  const handleRequest = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requested_user_id: requestUserId || null, // null = broadcast
          message: requestMessage || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send request');
      }

      toast.success(requestUserId ? 'Request sent' : 'Request sent to everyone');
      setShowRequestModal(false);
      setRequestMessage('');
      setRequestUserId('');
      loadTask();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send request';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle archive
  const handleArchive = async () => {
    if (!window.confirm('Are you sure you want to archive this task?')) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to archive task');
      }

      toast.success('Task archived');
      router.push('/dashboard/tasks');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to archive task';
      toast.error(message);
    }
  };

  if (authLoading || loading) {
    return <Loading fullScreen message="Loading task..." />;
  }

  if (!user) {
    return null;
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-tiffany-50/20 p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <Button onClick={() => router.back()} variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="bg-white rounded-xl border border-red-200 p-6 text-red-600">
            {error || 'Task not found'}
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getTaskStatusInfo(task.current_status);
  const priorityInfo = getPriorityInfo(task.priority);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-tiffany-50/20 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button onClick={() => router.back()} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Button href={`/dashboard/tasks/${taskId}/edit`} variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              onClick={handleArchive}
              variant="ghost"
              size="sm"
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Task Card */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6">
            {/* Title and status */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{task.title}</h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: `${statusInfo.color}20`,
                      color: statusInfo.color,
                    }}
                  >
                    {statusInfo.label}
                  </span>
                  <span
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: `${priorityInfo.color}20`,
                      color: priorityInfo.color,
                    }}
                  >
                    {priorityInfo.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <div className="mb-6">
                <h2 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Description
                </h2>
                <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
              </div>
            )}

            {/* Instructions */}
            {task.instructions && (
              <div className="mb-6 bg-blue-50 rounded-lg p-4">
                <h2 className="text-sm font-medium text-blue-800 mb-2">Instructions</h2>
                <p className="text-blue-700 whitespace-pre-wrap">{task.instructions}</p>
              </div>
            )}

            {/* Meta info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500 flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  Category
                </span>
                <span className="font-medium text-gray-900">
                  {TASK_CATEGORY_LABELS[task.category as keyof typeof TASK_CATEGORY_LABELS]}
                </span>
              </div>
              <div>
                <span className="text-gray-500 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Type
                </span>
                <span className="font-medium text-gray-900">
                  {TASK_TYPE_LABELS[task.task_type as keyof typeof TASK_TYPE_LABELS]}
                </span>
              </div>
              {task.estimated_minutes && (
                <div>
                  <span className="text-gray-500 flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Estimated Time
                  </span>
                  <span className="font-medium text-gray-900">
                    ~{task.estimated_minutes} minutes
                  </span>
                </div>
              )}
              {task.creator && (
                <div>
                  <span className="text-gray-500 flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Created by
                  </span>
                  <span className="font-medium text-gray-900">
                    {task.creator.display_name || task.creator.username}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 p-4 bg-gray-50 flex flex-wrap gap-2">
            <Button onClick={() => setShowCompleteModal(true)} className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Done
            </Button>
            <Button
              onClick={() => setShowRequestModal(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Request
            </Button>
            <Button
              onClick={() => setShowAttentionModal(true)}
              variant="outline"
              className="flex items-center gap-2 text-amber-600 border-amber-300 hover:bg-amber-50"
            >
              <AlertTriangle className="h-4 w-4" />
              Flag
            </Button>
          </div>
        </div>

        {/* Completion History */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <History className="h-5 w-5" />
            Completions ({completions.length})
          </h2>
          {completions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No completions yet</p>
          ) : (
            <div className="space-y-3">
              {completions.map(completion => (
                <div
                  key={completion.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-gray-900">
                        {completion.completer?.display_name ||
                          completion.completer?.username ||
                          'Unknown'}
                      </span>
                      <span className="text-gray-500">
                        {new Date(completion.completed_at).toLocaleDateString('en-US', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {completion.duration_minutes && (
                        <span className="text-gray-500">• {completion.duration_minutes} min.</span>
                      )}
                    </div>
                    {completion.notes && (
                      <p className="text-sm text-gray-600 mt-1">{completion.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Complete Modal */}
      {showCompleteModal && (
        <Modal onClose={() => setShowCompleteModal(false)} title="Complete Task">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={completionDuration}
                onChange={e =>
                  setCompletionDuration(e.target.value ? parseInt(e.target.value) : '')
                }
                placeholder={task.estimated_minutes?.toString() || ''}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tiffany-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={completionNotes}
                onChange={e => setCompletionNotes(e.target.value)}
                rows={3}
                placeholder="Notes about the completion..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tiffany-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCompleteModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleComplete} isLoading={actionLoading}>
                Mark as Done
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Attention Modal */}
      {showAttentionModal && (
        <Modal onClose={() => setShowAttentionModal(false)} title="Flag Task">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Flag this task as &quot;needs attention&quot;. All team members will be notified.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message (optional)
              </label>
              <textarea
                value={attentionMessage}
                onChange={e => setAttentionMessage(e.target.value)}
                rows={3}
                placeholder="What is the problem?"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tiffany-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAttentionModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleFlagAttention}
                isLoading={actionLoading}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Flag
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Request Modal */}
      {showRequestModal && (
        <Modal onClose={() => setShowRequestModal(false)} title="Request Task">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To whom?</label>
              <select
                value={requestUserId}
                onChange={e => setRequestUserId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tiffany-500"
              >
                <option value="">
                  <Users className="h-4 w-4 inline mr-2" />
                  All Team Members (Broadcast)
                </option>
                {/* TODO: Load team members here */}
              </select>
              <p className="text-xs text-gray-500 mt-1">Leave empty to notify all team members</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message (optional)
              </label>
              <textarea
                value={requestMessage}
                onChange={e => setRequestMessage(e.target.value)}
                rows={3}
                placeholder="Could you take care of this task?"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tiffany-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRequestModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleRequest} isLoading={actionLoading}>
                Send Request
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Simple Modal Component
function Modal({
  onClose,
  title,
  children,
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}
