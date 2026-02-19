/**
 * Task Detail Page Types
 *
 * Local type extensions for the task detail page and its sub-components.
 *
 * Created: 2026-02-19
 */

import type { Task } from '@/lib/schemas/tasks';

export interface TaskWithRelations extends Task {
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
