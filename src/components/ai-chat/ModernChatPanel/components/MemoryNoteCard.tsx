'use client';

/**
 * MEMORY NOTE CARD — "Cat noted: … [Undo]"
 *
 * Shown the moment the passive extractor stores a new memory, so memory
 * writes are never silent. Undo deletes the row immediately; dismiss just
 * hides the note (the memory stays, still visible in Settings → AI).
 */

import { useState } from 'react';
import { Brain, Undo2, X, Loader2 } from 'lucide-react';
import type { MemoryNote } from '../hooks/useMemoryNotes';

interface MemoryNoteCardProps {
  notes: MemoryNote[];
  onUndo: (id: string) => Promise<boolean>;
  onDismiss: (id: string) => void;
}

export function MemoryNoteCard({ notes, onUndo, onDismiss }: MemoryNoteCardProps) {
  const [undoingId, setUndoingId] = useState<string | null>(null);

  if (notes.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border border-subtle bg-surface-raised px-3 py-2">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-fg-secondary">
        <Brain className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
        Cat noted
      </div>
      <ul className="space-y-1.5">
        {notes.map(note => (
          <li key={note.id} className="flex min-w-0 items-start gap-2">
            <span className="min-w-0 flex-1 break-words text-sm text-fg-primary">
              “{note.content}”
            </span>
            <div className="flex flex-shrink-0 items-center gap-1">
              <button
                type="button"
                disabled={undoingId === note.id}
                onClick={() => {
                  setUndoingId(note.id);
                  void onUndo(note.id).finally(() => setUndoingId(null));
                }}
                className="inline-flex min-h-8 items-center gap-1 rounded-sm px-2 py-1 text-xs text-fg-secondary hover:bg-surface-base hover:text-fg-primary"
                title="Delete this memory"
              >
                {undoingId === note.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                ) : (
                  <Undo2 className="h-3 w-3" aria-hidden />
                )}
                Undo
              </button>
              <button
                type="button"
                onClick={() => onDismiss(note.id)}
                className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-sm text-fg-tertiary hover:bg-surface-base hover:text-fg-primary"
                aria-label="Keep memory and dismiss"
                title="Keep it"
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-1 text-[11px] text-fg-tertiary">
        Manage everything Cat remembers in Settings → AI.
      </p>
    </div>
  );
}
