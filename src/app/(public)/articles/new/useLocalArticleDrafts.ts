'use client';

import { useEffect, useState } from 'react';
import type { TimelineVisibility } from '@/types/timeline';
import {
  deleteLocalDraft,
  listLocalDrafts,
  newDraftId,
  saveLocalDraft,
  type LocalArticleDraft,
} from '@/services/articles/local-drafts';

interface DraftFields {
  title: string;
  excerpt: string;
  coverImage: string;
  body: string;
  visibility: TimelineVisibility;
}

interface DraftSetters {
  setTitle: (v: string) => void;
  setExcerpt: (v: string) => void;
  setCoverImage: (v: string) => void;
  setBody: (v: string) => void;
  setVisibility: (v: TimelineVisibility) => void;
}

/**
 * Local-draft persistence for the article composer: restore-on-mount,
 * debounced autosave, explicit flush (Cmd+S), and draft switching/deletion.
 * Extracted from ArticleComposer.tsx (pure move — behavior unchanged).
 */
export function useLocalArticleDrafts(
  isEditing: boolean,
  fields: DraftFields,
  setters: DraftSetters
) {
  const { title, excerpt, coverImage, body, visibility } = fields;
  const { setTitle, setExcerpt, setCoverImage, setBody, setVisibility } = setters;

  const [restored, setRestored] = useState(false);
  const [draftId, setDraftId] = useState(() => newDraftId());
  const [otherDrafts, setOtherDrafts] = useState<LocalArticleDraft[]>([]);

  // Restore the most recent draft once on mount (new articles only — never
  // clobber an article being edited with a stale local draft). Older drafts
  // stay listed so starting a new article never destroys an in-progress one.
  useEffect(() => {
    if (isEditing) {
      return;
    }
    const drafts = listLocalDrafts();
    const [latest, ...rest] = drafts;
    if (latest) {
      setTitle(latest.title);
      setExcerpt(latest.excerpt);
      setCoverImage(latest.coverImage);
      setBody(latest.body);
      setVisibility(latest.visibility);
      setDraftId(latest.id);
      setRestored(true);
    }
    setOtherDrafts(rest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  // Autosave (debounced) whenever content changes (new articles only).
  useEffect(() => {
    if (isEditing) {
      return;
    }
    if (!title && !body && !excerpt && !coverImage) {
      return;
    }
    const id = setTimeout(() => {
      saveLocalDraft({
        id: draftId,
        title,
        excerpt,
        coverImage,
        body,
        visibility,
        updatedAt: Date.now(),
      });
    }, 600);
    return () => clearTimeout(id);
  }, [isEditing, draftId, title, excerpt, coverImage, body, visibility]);

  /** Persist the current draft immediately (Cmd/Ctrl+S), bypassing the debounce. */
  function flushDraftNow() {
    if (!isEditing && (title || body || excerpt || coverImage)) {
      saveLocalDraft({
        id: draftId,
        title,
        excerpt,
        coverImage,
        body,
        visibility,
        updatedAt: Date.now(),
      });
    }
  }

  /** Delete the current draft and reset to a blank one; other drafts survive. */
  function discardCurrentDraft() {
    deleteLocalDraft(draftId);
    setTitle('');
    setExcerpt('');
    setCoverImage('');
    setBody('');
    setVisibility('public');
    setDraftId(newDraftId());
    setRestored(false);
    setOtherDrafts(listLocalDrafts());
  }

  /** Switch to another saved draft; the current one is already autosaved. */
  function loadDraft(draft: LocalArticleDraft) {
    setTitle(draft.title);
    setExcerpt(draft.excerpt);
    setCoverImage(draft.coverImage);
    setBody(draft.body);
    setVisibility(draft.visibility);
    setDraftId(draft.id);
    setRestored(true);
    setOtherDrafts(listLocalDrafts().filter(d => d.id !== draft.id));
  }

  function deleteOtherDraft(id: string) {
    deleteLocalDraft(id);
    setOtherDrafts(prev => prev.filter(d => d.id !== id));
  }

  return {
    draftId,
    restored,
    setRestored,
    otherDrafts,
    flushDraftNow,
    discardCurrentDraft,
    loadDraft,
    deleteOtherDraft,
  };
}
