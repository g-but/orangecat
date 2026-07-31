import { useEffect, useState } from 'react';
import type { TimelineVisibility } from '@/types/timeline';

const DRAFT_KEY = 'oc:draft:article';
const AUTOSAVE_DEBOUNCE_MS = 600;

export interface ArticleLocalDraft {
  title: string;
  excerpt: string;
  coverImage: string;
  body: string;
  visibility: TimelineVisibility;
}

/**
 * Local (browser) draft persistence for the article composer: restores an
 * in-progress draft once on mount and autosaves (debounced) on every change.
 * Disabled while editing an existing article — a stale local draft must never
 * clobber server content.
 */
export function useArticleLocalDraft({
  enabled,
  draft,
  onRestore,
}: {
  enabled: boolean;
  draft: ArticleLocalDraft;
  onRestore: (draft: Partial<ArticleLocalDraft>) => void;
}) {
  const [restored, setRestored] = useState(false);

  // Restore once on mount.
  useEffect(() => {
    if (!enabled) {
      return;
    }
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) {
        return;
      }
      const saved = JSON.parse(raw) as Partial<ArticleLocalDraft>;
      if (saved.title || saved.body) {
        onRestore(saved);
        setRestored(true);
      }
    } catch {
      /* ignore corrupt draft */
    }
    // Mount-only by design — onRestore is a plain state applier.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Autosave (debounced) whenever content changes.
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const { title, excerpt, coverImage, body } = draft;
    if (!title && !body && !excerpt && !coverImage) {
      return;
    }
    const id = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch {
        /* storage full / disabled — non-fatal */
      }
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(id);
    // Value-level deps: a fresh `draft` object every render must not reset
    // the debounce unless a field actually changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, draft.title, draft.excerpt, draft.coverImage, draft.body, draft.visibility]);

  return {
    restored,
    dismissRestored: () => setRestored(false),
    clearDraft: () => {
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* non-fatal */
      }
    },
  };
}
