'use client';

import { Trash2 } from 'lucide-react';
import type { LocalArticleDraft } from '@/services/articles/local-drafts';
import { formatRelativeTime } from '@/utils/dates';

/**
 * Restored-draft banner + list of other saved drafts.
 * Extracted from ArticleComposer.tsx (pure move — markup unchanged).
 */
export default function DraftsPanel({
  restored,
  otherDrafts,
  onDiscard,
  onLoad,
  onDelete,
}: {
  restored: boolean;
  otherDrafts: LocalArticleDraft[];
  onDiscard: () => void;
  onLoad: (draft: LocalArticleDraft) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <>
      {restored && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-md border border-subtle bg-surface-raised/30 px-3 py-2 text-xs text-fg-secondary">
          <span>Restored your saved draft.</span>
          <button
            type="button"
            onClick={onDiscard}
            className="shrink-0 font-medium text-fg-secondary underline-offset-2 transition-colors hover:text-status-negative hover:underline"
          >
            Discard draft
          </button>
        </div>
      )}

      {otherDrafts.length > 0 && (
        <div className="mb-4 rounded-md border border-subtle bg-surface-raised/30 px-3 py-2">
          <p className="mb-1.5 text-xs font-medium text-fg-secondary">
            {otherDrafts.length === 1 ? 'Another draft' : `${otherDrafts.length} more drafts`}
          </p>
          <ul className="space-y-1">
            {otherDrafts.map(draft => (
              <li key={draft.id} className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => onLoad(draft)}
                  className="min-w-0 flex-1 truncate text-left text-fg-primary underline-offset-2 hover:underline"
                  title="Open this draft"
                >
                  {draft.title.trim() || 'Untitled draft'}
                </button>
                <span className="shrink-0 text-fg-tertiary">
                  {formatRelativeTime(new Date(draft.updatedAt))}
                </span>
                <button
                  type="button"
                  onClick={() => onDelete(draft.id)}
                  className="shrink-0 text-fg-tertiary transition-colors hover:text-status-negative"
                  aria-label="Delete draft"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
