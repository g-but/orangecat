// src/lib/message-queue-events.ts
// Lightweight event helpers for the message queue lifecycle.
// Keep this React-agnostic so libs and hooks can both use it.

export type MessageSyncProgressDetail = { processed: number; total: number };

const UPDATED = 'message-queue:updated';
const SYNC_START = 'message-queue:sync-start';
const SYNC_PROGRESS = 'message-queue:sync-progress';
const SYNC_COMPLETE = 'message-queue:sync-complete';

export function messageQueueUpdated(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new CustomEvent(UPDATED));
}

export function messageSyncStart(total: number): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new CustomEvent(SYNC_START, { detail: { total, processed: 0 } }));
}

export function messageSyncProgress(processed: number, total: number): void {
  if (typeof window === 'undefined') {
    return;
  }
  const detail: MessageSyncProgressDetail = { processed, total };
  window.dispatchEvent(new CustomEvent(SYNC_PROGRESS, { detail }));
}

export function messageSyncComplete(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new CustomEvent(SYNC_COMPLETE));
}

export const messageQueueEvents = {
  UPDATED,
  SYNC_START,
  SYNC_PROGRESS,
  SYNC_COMPLETE,
};



