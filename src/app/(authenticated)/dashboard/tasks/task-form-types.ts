import {
  TASK_CATEGORIES,
  TASK_TYPES,
  PRIORITIES,
  TASK_TYPE_OPTIONS,
  TASK_CATEGORY_OPTIONS,
  PRIORITY_OPTIONS,
} from '@/config/tasks';

export type TaskCategory = (typeof TASK_CATEGORIES)[keyof typeof TASK_CATEGORIES];
export type TaskType = (typeof TASK_TYPES)[keyof typeof TASK_TYPES];
export type Priority = (typeof PRIORITIES)[keyof typeof PRIORITIES];

export interface TaskFormData {
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

/**
 * Apply AI-generated values onto the task form state.
 *
 * The server already coerces values against the declared assist fields (see
 * `sanitizeAiFields`); this is the last line of defense at the state boundary:
 * only known fields land, enums must be valid option values, and anything
 * malformed keeps the previous value instead of corrupting the form.
 */
export function applyTaskAiData(prev: TaskFormData, data: Record<string, unknown>): TaskFormData {
  const next: TaskFormData = { ...prev };
  if (typeof data.title === 'string') {
    next.title = data.title;
  }
  if (typeof data.description === 'string') {
    next.description = data.description;
  }
  if (typeof data.instructions === 'string') {
    next.instructions = data.instructions;
  }
  if (typeof data.schedule_human === 'string') {
    next.schedule_human = data.schedule_human;
  }
  if (
    typeof data.task_type === 'string' &&
    TASK_TYPE_OPTIONS.includes(data.task_type as TaskType)
  ) {
    next.task_type = data.task_type as TaskType;
  }
  if (
    typeof data.category === 'string' &&
    TASK_CATEGORY_OPTIONS.includes(data.category as TaskCategory)
  ) {
    next.category = data.category as TaskCategory;
  }
  if (typeof data.priority === 'string' && PRIORITY_OPTIONS.includes(data.priority as Priority)) {
    next.priority = data.priority as Priority;
  }
  if (typeof data.estimated_minutes === 'number' && Number.isFinite(data.estimated_minutes)) {
    next.estimated_minutes = Math.round(data.estimated_minutes);
  }
  if (Array.isArray(data.tags)) {
    next.tags = data.tags.filter((tag): tag is string => typeof tag === 'string').slice(0, 10);
  }
  return next;
}

/**
 * Validate task form state. Shared by the new-task and edit-task hooks so the
 * field limits live in one place. Returns a field → message map (empty = valid).
 */
export function validateTaskForm(formData: TaskFormData): Record<string, string> {
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
  return newErrors;
}

/**
 * Map task form state to the API request body (POST and PATCH share the shape).
 */
export function taskFormToPayload(formData: TaskFormData) {
  return {
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
  };
}
