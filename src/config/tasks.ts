/**
 * Task Management Configuration - Single Source of Truth
 *
 * All task-related constants, labels, and types.
 * Components should import from here instead of defining their own mappings.
 *
 * BENEFITS:
 * - Consistent task presentation across the app
 * - Easy to update labels/colors in one place
 * - Follows DRY and SSOT principles from CLAUDE.md
 *
 * Created: 2026-02-05
 */

// ==================== TASK TYPES ====================

/**
 * Task types define how a task behaves
 * - one_time: Complete once, then done
 * - recurring_scheduled: Happens on a schedule (e.g., weekly cleaning)
 * - recurring_as_needed: Done when needed, no fixed schedule
 */
export const TASK_TYPES = {
  ONE_TIME: 'one_time',
  RECURRING_SCHEDULED: 'recurring_scheduled',
  RECURRING_AS_NEEDED: 'recurring_as_needed',
} as const;

export type TaskType = (typeof TASK_TYPES)[keyof typeof TASK_TYPES];

export const TASK_TYPE_OPTIONS = Object.values(TASK_TYPES);

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  one_time: 'One-time',
  recurring_scheduled: 'Recurring (scheduled)',
  recurring_as_needed: 'Recurring (as needed)',
};

export const TASK_TYPE_DESCRIPTIONS: Record<TaskType, string> = {
  one_time: 'A one-time task that is done once completed',
  recurring_scheduled: 'Recurring task on a fixed schedule (e.g., weekly cleaning)',
  recurring_as_needed: 'Recurring task without a fixed schedule (e.g., restocking)',
};

// ==================== TASK STATUSES ====================

/**
 * Task statuses reflect the current state
 * - idle: Ready, no action needed
 * - needs_attention: Someone flagged it as needing attention
 * - requested: Someone specifically requested it to be done
 * - in_progress: Someone is working on it
 */
export const TASK_STATUSES = {
  IDLE: 'idle',
  NEEDS_ATTENTION: 'needs_attention',
  REQUESTED: 'requested',
  IN_PROGRESS: 'in_progress',
} as const;

export type TaskStatus = (typeof TASK_STATUSES)[keyof typeof TASK_STATUSES];

export const TASK_STATUS_OPTIONS = Object.values(TASK_STATUSES);

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  idle: 'Ready',
  needs_attention: 'Needs Attention',
  requested: 'Requested',
  in_progress: 'In Progress',
};

export interface TaskStatusInfo {
  label: string;
  className: string;
  color: string;
  description?: string;
}

export const TASK_STATUS_CONFIG: Record<TaskStatus, TaskStatusInfo> = {
  idle: {
    label: 'Ready',
    className: 'bg-gray-100 text-gray-700',
    color: '#6b7280',
    description: 'Task is ready and waiting',
  },
  needs_attention: {
    label: 'Needs Attention',
    className: 'bg-amber-100 text-amber-700',
    color: '#d97706',
    description: 'Someone flagged this task as urgent',
  },
  requested: {
    label: 'Requested',
    className: 'bg-blue-100 text-blue-700',
    color: '#2563eb',
    description: 'Someone has been asked to complete this task',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-purple-100 text-purple-700',
    color: '#7c3aed',
    description: 'Someone is currently working on this',
  },
};

// ==================== TASK CATEGORIES ====================

/**
 * Categories for organizing tasks
 */
export const TASK_CATEGORIES = {
  CLEANING: 'cleaning',
  MAINTENANCE: 'maintenance',
  ADMIN: 'admin',
  INVENTORY: 'inventory',
  IT: 'it',
  KITCHEN: 'kitchen',
  WORKSHOP: 'workshop',
  LOGISTICS: 'logistics',
  OTHER: 'other',
} as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[keyof typeof TASK_CATEGORIES];

export const TASK_CATEGORY_OPTIONS = Object.values(TASK_CATEGORIES);

export const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
  cleaning: 'Cleaning',
  maintenance: 'Maintenance',
  admin: 'Administration',
  inventory: 'Inventory',
  it: 'IT',
  kitchen: 'Kitchen',
  workshop: 'Workshop',
  logistics: 'Logistics',
  other: 'Other',
};

export const TASK_CATEGORY_ICONS: Record<TaskCategory, string> = {
  cleaning: '🧹',
  maintenance: '🔧',
  admin: '📋',
  inventory: '📦',
  it: '💻',
  kitchen: '🍳',
  workshop: '🛠️',
  logistics: '🚚',
  other: '📌',
};

// ==================== PRIORITIES ====================

/**
 * Task priority levels
 */
export const PRIORITIES = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export type Priority = (typeof PRIORITIES)[keyof typeof PRIORITIES];

export const PRIORITY_OPTIONS = Object.values(PRIORITIES);

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
};

export interface PriorityInfo {
  label: string;
  className: string;
  color: string;
  order: number;
}

export const PRIORITY_CONFIG: Record<Priority, PriorityInfo> = {
  low: {
    label: 'Low',
    className: 'bg-slate-100 text-slate-600',
    color: '#64748b',
    order: 1,
  },
  normal: {
    label: 'Normal',
    className: 'bg-gray-100 text-gray-700',
    color: '#6b7280',
    order: 2,
  },
  high: {
    label: 'High',
    className: 'bg-orange-100 text-orange-700',
    color: '#ea580c',
    order: 3,
  },
  urgent: {
    label: 'Urgent',
    className: 'bg-red-100 text-red-700',
    color: '#dc2626',
    order: 4,
  },
};

// ==================== PROJECT STATUSES ====================

/**
 * Project statuses for task grouping
 */
export const PROJECT_STATUSES = {
  PLANNING: 'planning',
  ACTIVE: 'active',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[keyof typeof PROJECT_STATUSES];

export const PROJECT_STATUS_OPTIONS = Object.values(PROJECT_STATUSES);

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: 'Planning',
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; className: string }> = {
  planning: {
    label: 'Planning',
    className: 'bg-gray-100 text-gray-700',
  },
  active: {
    label: 'Active',
    className: 'bg-green-100 text-green-700',
  },
  on_hold: {
    label: 'On Hold',
    className: 'bg-yellow-100 text-yellow-700',
  },
  completed: {
    label: 'Completed',
    className: 'bg-blue-100 text-blue-700',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-700',
  },
};

// ==================== REQUEST STATUSES ====================

/**
 * Request statuses for task requests
 */
export const REQUEST_STATUSES = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  COMPLETED: 'completed',
} as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[keyof typeof REQUEST_STATUSES];

export const REQUEST_STATUS_OPTIONS = Object.values(REQUEST_STATUSES);

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
  completed: 'Completed',
};

export const REQUEST_STATUS_CONFIG: Record<RequestStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-700',
  },
  accepted: {
    label: 'Accepted',
    className: 'bg-blue-100 text-blue-700',
  },
  declined: {
    label: 'Declined',
    className: 'bg-red-100 text-red-700',
  },
  completed: {
    label: 'Completed',
    className: 'bg-green-100 text-green-700',
  },
};

// ==================== NOTIFICATION TYPES ====================

/**
 * Task-related notification types
 */
export const TASK_NOTIFICATION_TYPES = {
  ATTENTION: 'task_attention',
  REQUEST: 'task_request',
  COMPLETED: 'task_completed',
  BROADCAST: 'task_broadcast',
} as const;

export type TaskNotificationType =
  (typeof TASK_NOTIFICATION_TYPES)[keyof typeof TASK_NOTIFICATION_TYPES];

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get status info for a task status
 */
export function getTaskStatusInfo(status: string | null | undefined): TaskStatusInfo {
  if (!status) {
    return {
      label: 'Unknown',
      className: 'bg-gray-100 text-gray-700',
      color: '#6b7280',
    };
  }

  const normalized = status.toLowerCase() as TaskStatus;
  return (
    TASK_STATUS_CONFIG[normalized] || {
      label: status.charAt(0).toUpperCase() + status.slice(1),
      className: 'bg-gray-100 text-gray-700',
      color: '#6b7280',
    }
  );
}

/**
 * Get priority info for a task priority
 */
export function getPriorityInfo(priority: string | null | undefined): PriorityInfo {
  if (!priority) {
    return PRIORITY_CONFIG.normal;
  }

  const normalized = priority.toLowerCase() as Priority;
  return PRIORITY_CONFIG[normalized] || PRIORITY_CONFIG.normal;
}

/**
 * Get category label
 */
export function getCategoryLabel(category: string | null | undefined): string {
  if (!category) {
    return 'Unknown';
  }
  return TASK_CATEGORY_LABELS[category as TaskCategory] || category;
}

/**
 * Get category icon (emoji)
 */
export function getCategoryIcon(category: string | null | undefined): string {
  if (!category) {
    return '📌';
  }
  return TASK_CATEGORY_ICONS[category as TaskCategory] || '📌';
}

/**
 * Check if a task requires immediate attention
 */
export function requiresAttention(status: TaskStatus, priority: Priority): boolean {
  return (
    status === TASK_STATUSES.NEEDS_ATTENTION ||
    priority === PRIORITIES.URGENT ||
    (status === TASK_STATUSES.REQUESTED && priority === PRIORITIES.HIGH)
  );
}

// ==================== DEFAULT VALUES ====================

export const TASK_DEFAULTS = {
  priority: PRIORITIES.NORMAL,
  status: TASK_STATUSES.IDLE,
  category: TASK_CATEGORIES.OTHER,
  task_type: TASK_TYPES.ONE_TIME,
} as const;

export const PROJECT_DEFAULTS = {
  status: PROJECT_STATUSES.PLANNING,
} as const;
