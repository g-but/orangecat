import { DATABASE_TABLES } from '@/config/database-tables';
import { parseReminderDate } from './date-utils';
import type { ActionHandler } from './types';

export const productivityHandlers: Record<string, ActionHandler> = {
  create_task: async (supabase, userId, _actorId, params) => {
    // DB columns: current_status (not status), task_type enum: one_time|recurring_scheduled|recurring_as_needed,
    // category enum: cleaning|maintenance|admin|inventory|it|kitchen|workshop|logistics|other,
    // priority enum: low|normal|high|urgent (not medium — map 'medium' defensively)
    const rawPriority = (params.priority as string) || 'normal';
    const priority = rawPriority === 'medium' ? 'normal' : rawPriority;
    // Accept both `description` and `notes` — system prompt documents `notes`
    const description = (params.description as string | null) || (params.notes as string | null) || null;

    const { data, error } = await supabase
      .from(DATABASE_TABLES.TASKS)
      .insert({
        created_by: userId,
        title: params.title,
        description,
        priority,
        task_type: 'one_time',
        category: 'other',
        current_status: 'idle',
        due_date: (params.due_date as string | null) || null,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    const taskTitle = params.title as string;
    const dueNote = params.due_date ? ` — due ${params.due_date}` : '';
    return { success: true, data: { ...data, displayMessage: `✅ Task created: "${taskTitle}"${dueNote}` } };
  },

  set_reminder: async (supabase, userId, _actorId, params) => {
    // System prompt documents: title, due_date (ISO or natural language), notes
    // Handler also accepts legacy aliases: message (→title), when (→due_date)
    const title = (params.title as string | undefined) || (params.message as string | undefined) || '';
    const when = (params.due_date as string | undefined) || (params.when as string | undefined) || '';
    const notes = (params.notes as string | undefined) || null;

    if (!title) {
      return { success: false, error: 'title is required for set_reminder' };
    }

    // Parse natural-language or ISO "when" into a stored ISO timestamp.
    // Supports: "in N minutes/hours/days", "tomorrow", "next week", specific ISO strings.
    const dueDate = parseReminderDate(when);

    const description = notes
      ? `Reminder set by My Cat\nNotes: ${notes}`
      : `Reminder set by My Cat`;

    const { data, error } = await supabase
      .from(DATABASE_TABLES.TASKS)
      .insert({
        created_by: userId,
        title,
        description,
        priority: 'normal',
        task_type: 'one_time',
        category: 'other',
        current_status: 'idle',
        is_reminder: true,
        due_date: dueDate,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const dueDateDisplay = dueDate
      ? new Date(dueDate).toLocaleString('en-CH', { dateStyle: 'medium', timeStyle: 'short' })
      : when || 'no date set';

    return {
      success: true,
      data: {
        ...data,
        displayMessage: `Reminder set for ${dueDateDisplay}: "${title}"`,
      },
    };
  },

  complete_task: async (supabase, userId, _actorId, params) => {
    const taskId = params.task_id as string;
    const notes = (params.notes as string | null) || null;

    // First fetch the task to confirm it belongs to this user and isn't already completed
    const { data: task, error: taskError } = await supabase
      .from(DATABASE_TABLES.TASKS)
      .select('id, title, task_type, is_completed, created_by')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return { success: false, error: 'Task not found' };
    }

    if (task.created_by !== userId) {
      return { success: false, error: 'You can only complete your own tasks' };
    }

    if (task.is_completed && task.task_type === 'one_time') {
      return { success: false, error: `Task "${task.title}" is already completed` };
    }

    // Insert into task_completions — the DB trigger handles status reset and one-time completion
    const { error: completionError } = await supabase
      .from(DATABASE_TABLES.TASK_COMPLETIONS)
      .insert({
        task_id: taskId,
        completed_by: userId,
        completed_at: new Date().toISOString(),
        notes,
        duration_minutes: null,
      });

    if (completionError) {
      return { success: false, error: completionError.message };
    }

    return {
      success: true,
      data: {
        task_id: taskId,
        title: task.title,
        displayMessage: `✅ Marked "${task.title}" as completed`,
      },
    };
  },

  update_task: async (supabase, userId, _actorId, params) => {
    // Update mutable fields of a task/reminder. Ownership is verified via created_by.
    // Accepts natural-language due_date (same parser as set_reminder).
    const taskId = params.task_id as string;

    // Fetch to verify ownership and get current title for display
    const { data: task, error: fetchError } = await supabase
      .from(DATABASE_TABLES.TASKS)
      .select('id, title, created_by')
      .eq('id', taskId)
      .single();

    if (fetchError || !task) {
      return { success: false, error: 'Task not found' };
    }

    if (task.created_by !== userId) {
      return { success: false, error: 'You can only update your own tasks' };
    }

    // Build the update payload — only include fields the caller explicitly provided
    const updates: Record<string, unknown> = {};

    if (params.title !== undefined) {
      updates.title = params.title as string;
    }
    if (params.notes !== undefined) {
      updates.description = params.notes as string;
    }
    if (params.priority !== undefined) {
      const rawPriority = params.priority as string;
      updates.priority = rawPriority === 'medium' ? 'normal' : rawPriority;
    }
    if (params.due_date !== undefined) {
      const parsed = parseReminderDate(params.due_date as string);
      updates.due_date = parsed;
    }

    if (Object.keys(updates).length === 0) {
      return { success: false, error: 'No fields to update — provide at least one of: title, notes, due_date, priority' };
    }

    const { data, error } = await supabase
      .from(DATABASE_TABLES.TASKS)
      .update(updates)
      .eq('id', taskId)
      .eq('created_by', userId)
      .select('id, title, due_date, priority')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const updatedTitle = (data as Record<string, unknown>)?.title as string ?? task.title as string;
    const dueDateDisplay = updates.due_date
      ? new Date(updates.due_date as string).toLocaleString('en-CH', { dateStyle: 'medium', timeStyle: 'short' })
      : null;
    const displayMessage = dueDateDisplay
      ? `📅 Updated "${updatedTitle}" — now due ${dueDateDisplay}`
      : `✏️ Updated "${updatedTitle}"`;

    return { success: true, data: { ...data, displayMessage } };
  },
};
