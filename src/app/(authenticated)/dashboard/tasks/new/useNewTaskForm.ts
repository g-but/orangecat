import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { TASK_DEFAULTS } from '@/config/tasks';
import { API_ROUTES } from '@/config/api-routes';
import type { TaskFormData, TaskCategory, TaskType, Priority } from '../task-form-types';

const INITIAL_FORM_DATA: TaskFormData = {
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
};

export function useNewTaskForm() {
  const router = useRouter();

  const [formData, setFormData] = useState<TaskFormData>(INITIAL_FORM_DATA);
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleEstimatedMinutesChange = (value: number | '') => {
    setFormData(prev => ({ ...prev, estimated_minutes: value }));
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
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
      const response = await fetch(API_ROUTES.TASKS.BASE, {
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

  return {
    formData,
    tagInput,
    setTagInput,
    submitting,
    errors,
    handleChange,
    handleEstimatedMinutesChange,
    handleAddTag,
    handleRemoveTag,
    handleSubmit,
  };
}
