'use client';

/**
 * New Task Page
 *
 * Create a new task
 *
 * Created: 2026-02-05
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useAuth';
import Loading from '@/components/Loading';
import Button from '@/components/ui/Button';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import {
  TASK_CATEGORIES,
  TASK_TYPES,
  PRIORITIES,
  TASK_CATEGORY_LABELS,
  TASK_TYPE_LABELS,
  PRIORITY_LABELS,
  TASK_DEFAULTS,
} from '@/config/tasks';
import { ArrowLeft, Save } from 'lucide-react';

type TaskCategory = (typeof TASK_CATEGORIES)[keyof typeof TASK_CATEGORIES];
type TaskType = (typeof TASK_TYPES)[keyof typeof TASK_TYPES];
type Priority = (typeof PRIORITIES)[keyof typeof PRIORITIES];

interface TaskFormData {
  title: string;
  description: string;
  instructions: string;
  task_type: TaskType;
  schedule_cron: string;
  schedule_human: string;
  category: TaskCategory;
  tags: string[];
  priority: Priority;
  estimated_minutes: number | '';
  project_id: string;
}

export default function NewTaskPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const router = useRouter();

  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    instructions: '',
    task_type: TASK_DEFAULTS.task_type as TaskType,
    schedule_cron: '',
    schedule_human: '',
    category: TASK_DEFAULTS.category as TaskCategory,
    tags: [],
    priority: TASK_DEFAULTS.priority as Priority,
    estimated_minutes: '',
    project_id: '',
  });

  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when field changes
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove),
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be at most 200 characters';
    }

    if (formData.description && formData.description.length > 2000) {
      newErrors.description = 'Description must be at most 2000 characters';
    }

    if (formData.instructions && formData.instructions.length > 5000) {
      newErrors.instructions = 'Instructions must be at most 5000 characters';
    }

    if (
      formData.estimated_minutes &&
      (formData.estimated_minutes < 1 || formData.estimated_minutes > 480)
    ) {
      newErrors.estimated_minutes = 'Estimated time must be between 1 and 480 minutes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          instructions: formData.instructions.trim() || null,
          task_type: formData.task_type,
          schedule_cron: formData.schedule_cron.trim() || null,
          schedule_human: formData.schedule_human.trim() || null,
          category: formData.category,
          tags: formData.tags,
          priority: formData.priority,
          estimated_minutes: formData.estimated_minutes || null,
          project_id: formData.project_id || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create task');
      }

      toast.success('Task created!');
      router.push(`/dashboard/tasks/${data.data.task.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create task';
      logger.error('Failed to create task', { error: err }, 'NewTaskPage');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return <Loading fullScreen message="Loading..." />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-tiffany-50/20 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button onClick={() => router.back()} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">New Task</h1>
            <p className="text-gray-600 mt-1">Create a new task for the team</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Clean kitchen"
                className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tiffany-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            {/* Task Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Type <span className="text-red-500">*</span>
              </label>
              <select
                name="task_type"
                value={formData.task_type}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tiffany-500"
              >
                {Object.entries(TASK_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {formData.task_type === TASK_TYPES.ONE_TIME &&
                  'One-time task, marked as completed once done'}
                {formData.task_type === TASK_TYPES.RECURRING_SCHEDULED &&
                  'Recurring task with a fixed schedule'}
                {formData.task_type === TASK_TYPES.RECURRING_AS_NEEDED &&
                  'Recurring task, completed as needed'}
              </p>
            </div>

            {/* Schedule (only for recurring_scheduled) */}
            {formData.task_type === TASK_TYPES.RECURRING_SCHEDULED && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label>
                <input
                  type="text"
                  name="schedule_human"
                  value={formData.schedule_human}
                  onChange={handleChange}
                  placeholder="e.g. Every Monday, Daily at 9 AM"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tiffany-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Describe when this task should be completed
                </p>
              </div>
            )}

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tiffany-500"
              >
                {Object.entries(TASK_CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tiffany-500"
              >
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Estimated Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Time (Minutes)
              </label>
              <input
                type="number"
                name="estimated_minutes"
                value={formData.estimated_minutes}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    estimated_minutes: e.target.value ? parseInt(e.target.value) : '',
                  }))
                }
                min={1}
                max={480}
                placeholder="e.g. 30"
                className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tiffany-500 ${
                  errors.estimated_minutes ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.estimated_minutes && (
                <p className="text-red-500 text-sm mt-1">{errors.estimated_minutes}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="What needs to be done for this task?"
                className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tiffany-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
              <textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleChange}
                rows={4}
                placeholder="Step-by-step instructions (optional)"
                className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tiffany-500 ${
                  errors.instructions ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.instructions && (
                <p className="text-red-500 text-sm mt-1">{errors.instructions}</p>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add tag..."
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tiffany-500"
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  Add
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" isLoading={submitting}>
                <Save className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
