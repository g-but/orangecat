'use client';

/**
 * MEMORY NOTES — visible, undoable memory writes.
 *
 * The passive extractor stores facts silently after an exchange; users only
 * discovered them later in Settings — which is how wrong facts (the 2026-08
 * "photography/French" incident) lived unnoticed for weeks. This hook makes
 * every new memory VISIBLE the moment it's written: it snapshots the memory
 * ids on mount, re-polls shortly after each send (extraction is detached and
 * takes a few seconds), and surfaces anything new as a note the user can undo
 * with one tap.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { API_ROUTES } from '@/config/api-routes';
import { logger } from '@/utils/logger';

export interface MemoryNote {
  id: string;
  content: string;
}

interface MemoryRow {
  id: string;
  content: string;
}

/** Extraction = 1 detached LLM call + embedding; poll after it had time to land. */
const POLL_DELAYS_MS = [3500, 9000];

export function useMemoryNotes() {
  const [notes, setNotes] = useState<MemoryNote[]>([]);
  const knownIds = useRef<Set<string> | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const fetchMemories = useCallback(async (): Promise<MemoryRow[]> => {
    const res = await fetch(API_ROUTES.CAT.MEMORIES);
    if (!res.ok) {
      throw new Error('memories fetch failed');
    }
    const json = await res.json();
    return (json?.data?.memories ?? []) as MemoryRow[];
  }, []);

  // Baseline: everything that exists before this session's sends is "known".
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const rows = await fetchMemories();
        if (!cancelled) {
          knownIds.current = new Set(rows.map(r => r.id));
        }
      } catch {
        // Baseline unavailable → stay silent rather than mislabel old
        // memories as new. knownIds stays null and polling no-ops.
      }
    })();
    return () => {
      cancelled = true;
      timers.current.forEach(clearTimeout);
    };
  }, [fetchMemories]);

  const poll = useCallback(async () => {
    if (!knownIds.current) {
      return;
    }
    try {
      const rows = await fetchMemories();
      const fresh = rows.filter(r => !knownIds.current!.has(r.id));
      if (fresh.length > 0) {
        fresh.forEach(r => knownIds.current!.add(r.id));
        setNotes(prev => [...prev, ...fresh.map(r => ({ id: r.id, content: r.content }))]);
      }
    } catch (err) {
      logger.warn('memory-notes poll failed', { err }, 'CatMemory');
    }
  }, [fetchMemories]);

  /** Call after each send completes; schedules the delayed polls. */
  const checkAfterSend = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = POLL_DELAYS_MS.map(delay => setTimeout(() => void poll(), delay));
  }, [poll]);

  /** Undo = delete the memory server-side, then drop the note. */
  const undoNote = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_ROUTES.CAT.MEMORIES}?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('delete failed');
      }
      setNotes(prev => prev.filter(n => n.id !== id));
      return true;
    } catch (err) {
      logger.error('memory-note undo failed', err, 'CatMemory');
      return false;
    }
  }, []);

  const dismissNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  return { memoryNotes: notes, checkAfterSend, undoNote, dismissNote };
}
