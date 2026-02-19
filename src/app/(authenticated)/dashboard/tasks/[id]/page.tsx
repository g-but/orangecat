'use client';

/** Task Detail Page - view details, completion history, and take actions */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useAuth';
import Loading from '@/components/Loading';
import Button from '@/components/ui/Button';
import { logger } from '@/utils/logger';
import {
  TASK_CATEGORY_LABELS,
  TASK_TYPE_LABELS,
  getTaskStatusInfo,
  getPriorityInfo,
} from '@/config/tasks';
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
} from 'lucide-react';
import { useTaskActions } from './useTaskActions';
import { CompleteModal, AttentionModal, RequestModal } from './TaskActionModals';
import CompletionHistory, { type CompletionWithUser } from './CompletionHistory';
import type { TaskWithRelations } from './types';

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

  // Action handlers
  const { actionLoading, handleComplete, handleFlagAttention, handleRequest, handleArchive } =
    useTaskActions({
      taskId,
      onSuccess: () => {
        setShowCompleteModal(false);
        setShowAttentionModal(false);
        setShowRequestModal(false);
        loadTask();
      },
    });

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
        <CompletionHistory completions={completions} />
      </div>

      {/* Action Modals */}
      {showCompleteModal && (
        <CompleteModal
          estimatedMinutes={task.estimated_minutes}
          actionLoading={actionLoading}
          onClose={() => setShowCompleteModal(false)}
          onComplete={handleComplete}
        />
      )}

      {showAttentionModal && (
        <AttentionModal
          actionLoading={actionLoading}
          onClose={() => setShowAttentionModal(false)}
          onFlag={handleFlagAttention}
        />
      )}

      {showRequestModal && (
        <RequestModal
          actionLoading={actionLoading}
          onClose={() => setShowRequestModal(false)}
          onRequest={handleRequest}
        />
      )}
    </div>
  );
}
