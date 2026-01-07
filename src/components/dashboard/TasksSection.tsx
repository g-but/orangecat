/**
 * TASKS SECTION
 *
 * Dynamic recommendations based on user state.
 * All task logic comes from the SSOT recommendations service.
 *
 * KEY PRINCIPLES:
 * - No hardcoded tasks - all from SSOT
 * - Context-aware - shows only relevant tasks
 * - Progressive - harder tasks after basics complete
 * - Low friction - minimal clicks, immediate feedback
 *
 * Created: 2025-01-XX (original)
 * Last Modified: 2026-01-07
 * Last Modified Summary: Refactored to use recommendations service SSOT
 */

'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Target,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { useRecommendations } from '@/hooks/useRecommendations';
import { SmartQuestionsPanel } from './SmartQuestionsPanel';
import type { RecommendedTask, TaskPriority } from '@/services/recommendations/types';

interface TasksSectionProps {
  className?: string;
  /** Maximum tasks to display */
  maxTasks?: number;
  /** Show smart questions when profile complete */
  showQuestions?: boolean;
}

/**
 * Get priority styling
 */
function getPriorityColor(priority: TaskPriority): string {
  switch (priority) {
    case 'critical':
      return 'text-red-700 bg-red-50 border-red-200';
    case 'high':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'low':
      return 'text-green-600 bg-green-50 border-green-200';
  }
}

/**
 * Get priority label
 */
function getPriorityLabel(priority: TaskPriority): string {
  switch (priority) {
    case 'critical':
      return 'Critical';
    case 'high':
      return 'Important';
    case 'medium':
      return 'Suggested';
    case 'low':
      return 'Optional';
  }
}

export default function TasksSection({
  className,
  maxTasks = 4,
  showQuestions = true,
}: TasksSectionProps) {
  const { user, profile } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true);

  const {
    isLoading,
    error,
    profileCompletion,
    taskCompletion,
    tasks,
    questions,
    celebration,
    markTaskCompleted,
    completedTaskIds,
  } = useRecommendations({ limit: maxTasks + 2 }); // Fetch extra for "show more"

  // Not authenticated
  if (!user || !profile) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading recommendations...</span>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return null; // Silent fail - don't block dashboard
  }

  // Celebration state - all setup tasks done
  if (celebration) {
    return (
      <div className={className}>
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {celebration.title}
            </h3>
            <p className="text-gray-600 mb-4">{celebration.description}</p>

            {/* Show smart questions for engaged users */}
            {showQuestions && questions.length > 0 && (
              <SmartQuestionsPanel
                questions={questions}
                className="mt-6 text-left"
              />
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // No tasks - shouldn't happen but handle gracefully
  if (tasks.length === 0) {
    return null;
  }

  const visibleTasks = tasks.slice(0, maxTasks);
  const hiddenCount = tasks.length - maxTasks;

  return (
    <div className={className}>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-tiffany-600" />
                Recommended Next Steps
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Complete these to get the most out of OrangeCat
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {taskCompletion}% Setup
                </div>
                <div className="text-xs text-gray-500">
                  {tasks.length} task{tasks.length !== 1 ? 's' : ''} remaining
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label={isExpanded ? 'Collapse tasks' : 'Expand tasks'}
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div
              className="bg-tiffany-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${taskCompletion}%` }}
            />
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0">
            <div className="space-y-3">
              {visibleTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={() => markTaskCompleted(task.id)}
                  isCompleted={completedTaskIds.has(task.id)}
                />
              ))}

              {hiddenCount > 0 && (
                <div className="text-center pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(true)}
                  >
                    Show {hiddenCount} more task{hiddenCount !== 1 ? 's' : ''}
                  </Button>
                </div>
              )}
            </div>

            {/* Show smart questions if profile is mostly complete */}
            {showQuestions && questions.length > 0 && profileCompletion >= 75 && (
              <SmartQuestionsPanel
                questions={questions}
                className="mt-6 pt-4 border-t"
              />
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

/**
 * Individual task card
 */
function TaskCard({
  task,
  onComplete,
  isCompleted,
}: {
  task: RecommendedTask;
  onComplete: () => void;
  isCompleted: boolean;
}) {
  const IconComponent = task.icon;

  return (
    <div
      className={`
        flex items-start gap-4 p-4 border rounded-lg transition-all
        ${isCompleted
          ? 'border-green-200 bg-green-50 opacity-60'
          : 'border-gray-200 hover:border-tiffany-300 hover:shadow-sm'
        }
      `}
    >
      {/* Checkbox */}
      <button
        onClick={onComplete}
        className="mt-0.5 text-gray-400 hover:text-tiffany-600 transition-colors flex-shrink-0"
        aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
      >
        {isCompleted ? (
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        ) : (
          <Circle className="w-5 h-5" />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {/* Title row */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <IconComponent className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <h4 className={`font-medium ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                {task.title}
              </h4>
              <span
                className={`px-2 py-0.5 text-xs rounded-full border ${getPriorityColor(task.priority)}`}
              >
                {getPriorityLabel(task.priority)}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-3">{task.description}</p>

            {/* Action button */}
            {!isCompleted && (
              <Link href={task.action.href}>
                <Button
                  size="sm"
                  variant="outline"
                  className="hover:bg-tiffany-50 hover:border-tiffany-300 hover:text-tiffany-700"
                >
                  {task.action.label}
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Export for testing
export { TaskCard };
