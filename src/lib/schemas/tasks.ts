/**
 * Task Management Validation Schemas
 *
 * Zod schemas for all task-related data validation.
 * Types are derived from schemas - SSOT principle.
 *
 * Created: 2026-02-05
 */

import { z } from 'zod';
import {
  TASK_TYPE_OPTIONS,
  TASK_CATEGORY_OPTIONS,
  PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
  PROJECT_STATUS_OPTIONS,
  REQUEST_STATUSES,
  TASK_DEFAULTS,
  PROJECT_DEFAULTS,
} from '@/config/tasks';

// ==================== TASK SCHEMAS ====================

/**
 * Schema for creating/updating a task
 */
export const taskSchema = z.object({
  title: z
    .string()
    .min(1, 'Titel ist erforderlich')
    .max(200, 'Titel darf maximal 200 Zeichen lang sein'),

  description: z
    .string()
    .max(2000, 'Beschreibung darf maximal 2000 Zeichen lang sein')
    .optional()
    .nullable(),

  instructions: z
    .string()
    .max(5000, 'Anleitung darf maximal 5000 Zeichen lang sein')
    .optional()
    .nullable(),

  task_type: z.enum(TASK_TYPE_OPTIONS as unknown as [string, ...string[]]),

  schedule_cron: z.string().max(100).optional().nullable(),

  schedule_human: z
    .string()
    .max(200, 'Zeitplan-Beschreibung darf maximal 200 Zeichen lang sein')
    .optional()
    .nullable(),

  category: z.enum(TASK_CATEGORY_OPTIONS as unknown as [string, ...string[]]),

  tags: z
    .array(z.string().max(50, 'Tag darf maximal 50 Zeichen lang sein'))
    .max(10, 'Maximal 10 Tags erlaubt')
    .optional()
    .default([]),

  priority: z
    .enum(PRIORITY_OPTIONS as unknown as [string, ...string[]])
    .default(TASK_DEFAULTS.priority),

  estimated_minutes: z
    .number()
    .int()
    .min(1, 'Mindestens 1 Minute')
    .max(480, 'Maximal 480 Minuten (8 Stunden)')
    .optional()
    .nullable(),

  project_id: z.string().uuid('Ungültige Projekt-ID').optional().nullable(),
});

/**
 * Schema for task update (all fields optional)
 */
export const taskUpdateSchema = taskSchema.partial().extend({
  current_status: z.enum(TASK_STATUS_OPTIONS as unknown as [string, ...string[]]).optional(),
  is_archived: z.boolean().optional(),
});

// ==================== COMPLETION SCHEMA ====================

/**
 * Schema for recording a task completion
 */
export const taskCompletionSchema = z.object({
  notes: z
    .string()
    .max(1000, 'Notizen dürfen maximal 1000 Zeichen lang sein')
    .optional()
    .nullable(),

  duration_minutes: z
    .number()
    .int()
    .min(1, 'Mindestens 1 Minute')
    .max(480, 'Maximal 480 Minuten (8 Stunden)')
    .optional()
    .nullable(),
});

// ==================== ATTENTION FLAG SCHEMA ====================

/**
 * Schema for flagging a task as needing attention
 */
export const attentionFlagSchema = z.object({
  message: z
    .string()
    .max(500, 'Nachricht darf maximal 500 Zeichen lang sein')
    .optional()
    .nullable(),
});

// ==================== REQUEST SCHEMAS ====================

/**
 * Schema for creating a task request
 * requested_user_id = null means broadcast to all staff
 */
export const taskRequestSchema = z.object({
  requested_user_id: z.string().uuid('Ungültige Benutzer-ID').optional().nullable(),
  message: z
    .string()
    .max(500, 'Nachricht darf maximal 500 Zeichen lang sein')
    .optional()
    .nullable(),
});

/**
 * Schema for responding to a task request
 */
export const requestResponseSchema = z.object({
  status: z.enum([REQUEST_STATUSES.ACCEPTED, REQUEST_STATUSES.DECLINED] as [string, string]),
  response_message: z
    .string()
    .max(500, 'Antwort darf maximal 500 Zeichen lang sein')
    .optional()
    .nullable(),
});

// ==================== PROJECT SCHEMA ====================

/**
 * Schema for creating/updating a task project
 */
export const taskProjectSchema = z.object({
  title: z
    .string()
    .min(1, 'Titel ist erforderlich')
    .max(200, 'Titel darf maximal 200 Zeichen lang sein'),

  description: z
    .string()
    .max(2000, 'Beschreibung darf maximal 2000 Zeichen lang sein')
    .optional()
    .nullable(),

  status: z
    .enum(PROJECT_STATUS_OPTIONS as unknown as [string, ...string[]])
    .default(PROJECT_DEFAULTS.status),

  target_date: z.string().optional().nullable(),
});

/**
 * Schema for project update (all fields optional)
 */
export const taskProjectUpdateSchema = taskProjectSchema.partial();

// ==================== FILTER SCHEMAS ====================

/**
 * Schema for task list filters
 */
export const taskFilterSchema = z.object({
  category: z.enum(TASK_CATEGORY_OPTIONS as unknown as [string, ...string[]]).optional(),
  status: z.enum(TASK_STATUS_OPTIONS as unknown as [string, ...string[]]).optional(),
  task_type: z.enum(TASK_TYPE_OPTIONS as unknown as [string, ...string[]]).optional(),
  priority: z.enum(PRIORITY_OPTIONS as unknown as [string, ...string[]]).optional(),
  project_id: z.string().uuid().optional(),
  is_archived: z.boolean().optional(),
  search: z.string().max(100).optional(),
});

// ==================== DERIVED TYPES ====================

/** Input type for creating a task */
export type TaskInput = z.infer<typeof taskSchema>;

/** Input type for updating a task */
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;

/** Input type for recording a completion */
export type TaskCompletionInput = z.infer<typeof taskCompletionSchema>;

/** Input type for flagging attention */
export type AttentionFlagInput = z.infer<typeof attentionFlagSchema>;

/** Input type for creating a request */
export type TaskRequestInput = z.infer<typeof taskRequestSchema>;

/** Input type for responding to a request */
export type RequestResponseInput = z.infer<typeof requestResponseSchema>;

/** Input type for creating a project */
export type TaskProjectInput = z.infer<typeof taskProjectSchema>;

/** Input type for updating a project */
export type TaskProjectUpdateInput = z.infer<typeof taskProjectUpdateSchema>;

/** Filter type for task listing */
export type TaskFilter = z.infer<typeof taskFilterSchema>;

// ==================== DATABASE TYPES ====================

/**
 * Full task type as stored in database
 */
export interface Task {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  task_type: string;
  schedule_cron: string | null;
  schedule_human: string | null;
  category: string;
  tags: string[];
  priority: string;
  estimated_minutes: number | null;
  current_status: string;
  is_completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  project_id: string | null;
  created_by: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Task completion record
 */
export interface TaskCompletion {
  id: string;
  task_id: string;
  completed_by: string;
  completed_at: string;
  notes: string | null;
  duration_minutes: number | null;
  created_at: string;
}

/**
 * Task attention flag
 */
export interface TaskAttentionFlag {
  id: string;
  task_id: string;
  flagged_by: string;
  message: string | null;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  resolved_by_completion_id: string | null;
  created_at: string;
}

/**
 * Task request
 */
export interface TaskRequest {
  id: string;
  task_id: string;
  requested_by: string;
  requested_user_id: string | null;
  is_broadcast: boolean;
  message: string | null;
  status: string;
  response_message: string | null;
  responded_by: string | null;
  completion_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Task project
 */
export interface TaskProject {
  id: string;
  title: string;
  description: string | null;
  status: string;
  target_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ==================== EXTENDED TYPES (with relations) ====================

/**
 * Task with optional relations
 */
export interface TaskWithRelations extends Task {
  completions?: TaskCompletion[];
  attention_flags?: TaskAttentionFlag[];
  requests?: TaskRequest[];
  project?: TaskProject | null;
  creator?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  } | null;
  completed_by_user?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  } | null;
}

/**
 * Task request with relations
 */
export interface TaskRequestWithRelations extends TaskRequest {
  task?: Task;
  requester?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  } | null;
  requested_user?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  } | null;
}
