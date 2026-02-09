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
  one_time: 'Einmalig',
  recurring_scheduled: 'Wiederkehrend (geplant)',
  recurring_as_needed: 'Wiederkehrend (bei Bedarf)',
};

export const TASK_TYPE_DESCRIPTIONS: Record<TaskType, string> = {
  one_time: 'Eine einmalige Aufgabe, die nach Erledigung abgeschlossen ist',
  recurring_scheduled: 'Wiederkehrende Aufgabe nach festem Zeitplan (z.B. wöchentliche Reinigung)',
  recurring_as_needed: 'Wiederkehrende Aufgabe ohne festen Zeitplan (z.B. Lager auffüllen)',
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
  idle: 'Bereit',
  needs_attention: 'Braucht Aufmerksamkeit',
  requested: 'Angefragt',
  in_progress: 'In Bearbeitung',
};

export interface TaskStatusInfo {
  label: string;
  className: string;
  color: string;
  description?: string;
}

export const TASK_STATUS_CONFIG: Record<TaskStatus, TaskStatusInfo> = {
  idle: {
    label: 'Bereit',
    className: 'bg-gray-100 text-gray-700',
    color: '#6b7280',
    description: 'Aufgabe ist bereit und wartet',
  },
  needs_attention: {
    label: 'Braucht Aufmerksamkeit',
    className: 'bg-amber-100 text-amber-700',
    color: '#d97706',
    description: 'Jemand hat diese Aufgabe als dringend markiert',
  },
  requested: {
    label: 'Angefragt',
    className: 'bg-blue-100 text-blue-700',
    color: '#2563eb',
    description: 'Jemand wurde gebeten, diese Aufgabe zu erledigen',
  },
  in_progress: {
    label: 'In Bearbeitung',
    className: 'bg-purple-100 text-purple-700',
    color: '#7c3aed',
    description: 'Jemand arbeitet gerade daran',
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
  cleaning: 'Reinigung',
  maintenance: 'Instandhaltung',
  admin: 'Verwaltung',
  inventory: 'Inventar',
  it: 'IT',
  kitchen: 'Küche',
  workshop: 'Werkstatt',
  logistics: 'Logistik',
  other: 'Sonstiges',
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
  low: 'Niedrig',
  normal: 'Normal',
  high: 'Hoch',
  urgent: 'Dringend',
};

export interface PriorityInfo {
  label: string;
  className: string;
  color: string;
  order: number;
}

export const PRIORITY_CONFIG: Record<Priority, PriorityInfo> = {
  low: {
    label: 'Niedrig',
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
    label: 'Hoch',
    className: 'bg-orange-100 text-orange-700',
    color: '#ea580c',
    order: 3,
  },
  urgent: {
    label: 'Dringend',
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
  planning: 'In Planung',
  active: 'Aktiv',
  on_hold: 'Pausiert',
  completed: 'Abgeschlossen',
  cancelled: 'Abgebrochen',
};

export const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; className: string }> = {
  planning: {
    label: 'In Planung',
    className: 'bg-gray-100 text-gray-700',
  },
  active: {
    label: 'Aktiv',
    className: 'bg-green-100 text-green-700',
  },
  on_hold: {
    label: 'Pausiert',
    className: 'bg-yellow-100 text-yellow-700',
  },
  completed: {
    label: 'Abgeschlossen',
    className: 'bg-blue-100 text-blue-700',
  },
  cancelled: {
    label: 'Abgebrochen',
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
  pending: 'Ausstehend',
  accepted: 'Akzeptiert',
  declined: 'Abgelehnt',
  completed: 'Erledigt',
};

export const REQUEST_STATUS_CONFIG: Record<RequestStatus, { label: string; className: string }> = {
  pending: {
    label: 'Ausstehend',
    className: 'bg-yellow-100 text-yellow-700',
  },
  accepted: {
    label: 'Akzeptiert',
    className: 'bg-blue-100 text-blue-700',
  },
  declined: {
    label: 'Abgelehnt',
    className: 'bg-red-100 text-red-700',
  },
  completed: {
    label: 'Erledigt',
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
      label: 'Unbekannt',
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
    return 'Unbekannt';
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
