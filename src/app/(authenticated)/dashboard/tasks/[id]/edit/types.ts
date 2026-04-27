import { TASK_CATEGORIES, TASK_TYPES, PRIORITIES } from '@/config/tasks';

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
