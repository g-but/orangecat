/**
 * Shared date formatting utilities — SSOT for display-layer date/time formatting.
 * Eliminates duplicate formatDate/formatTime/formatRelativeTime definitions
 * scattered across components. Uses date-fns (already installed).
 */
import { format, formatDistanceToNow } from 'date-fns';

export function formatDate(date: string | Date): string {
  return format(typeof date === 'string' ? new Date(date) : date, 'MMM d, yyyy');
}

export function formatTime(date: string | Date): string {
  return format(typeof date === 'string' ? new Date(date) : date, 'h:mm a');
}

export function formatDateTime(date: string | Date): string {
  return format(typeof date === 'string' ? new Date(date) : date, 'MMM d, yyyy h:mm a');
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(typeof date === 'string' ? new Date(date) : date, {
    addSuffix: true,
  });
}
