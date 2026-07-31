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
  if (typeof data.task_type === 'string' && TASK_TYPE_OPTIONS.includes(data.task_type as TaskType)) {
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
