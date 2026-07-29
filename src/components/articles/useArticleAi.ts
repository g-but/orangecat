'use client';

import { useCallback, useRef, useState } from 'react';
import {
  generateArticleExcerpt,
  reviseArticleText,
  suggestArticleTitles,
} from '@/services/articles/ai-client';
import type { ReviseAction, TonePreset } from '@/services/cat/writing-types';
import type { MarkdownActions, EditorSelection } from './useMarkdownTextarea';

/** Which control is mid-flight, so the UI can show a targeted spinner. */
export type AiBusy = ReviseAction | 'title' | 'excerpt';

interface Params {
  md: MarkdownActions;
  title: string;
  body: string;
  setTitle: (v: string) => void;
  setExcerpt: (v: string) => void;
  setBody: (v: string) => void;
}

/**
 * Orchestrates the in-editor AI writing actions: snapshots the caret/selection
 * at menu-open (focus moves to the menu, so we can't read it later), calls the
 * revise endpoint, and applies the result back into the editor — replacing the
 * selection, replacing the whole body, or inserting a continuation. Never
 * throws; failures surface as an inline message and leave the text untouched.
 */
export function useArticleAi({ md, title, body, setTitle, setExcerpt, setBody }: Params) {
  const [busy, setBusy] = useState<AiBusy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [titleSuggestions, setTitleSuggestions] = useState<string[] | null>(null);
  const selRef = useRef<EditorSelection | null>(null);

  /** Call on menu-open — the textarea still holds the live selection here. */
  const captureSelection = useCallback(() => {
    selRef.current = md.getSelection();
  }, [md]);

  const guard = useCallback(async (key: AiBusy, fn: () => Promise<void>) => {
    setError(null);
    setBusy(key);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The AI writer is unavailable. Please try again.');
    } finally {
      setBusy(null);
    }
  }, []);

  /** improve / tighten / expand / grammar / tone — on the selection, else whole body. */
  const transform = useCallback(
    (action: Exclude<ReviseAction, 'continue' | 'outline'>, tone?: TonePreset) => {
      const sel = selRef.current;
      const hasSel = !!sel && sel.text.trim().length > 0;
      const target = hasSel ? sel!.text : body;
      if (!target.trim()) {
        setError('Write or select some text first.');
        return;
      }
      void guard(action, async () => {
        const result = await reviseArticleText({ action, text: target, tone, title });
        if (hasSel && sel) {
          md.replaceRange(sel.start, sel.end, result);
        } else {
          setBody(result);
        }
      });
    },
    [body, title, md, setBody, guard]
  );

  const continueWriting = useCallback(() => {
    if (!body.trim()) {
      setError('Write a little first, then let AI continue.');
      return;
    }
    void guard('continue', async () => {
      const result = await reviseArticleText({
        action: 'continue',
        text: body.slice(-6000),
        title,
      });
      md.insertAtCursor(`${body.endsWith('\n') ? '' : '\n\n'}${result}`);
    });
  }, [body, title, md, guard]);

  const outline = useCallback(() => {
    const sel = selRef.current;
    const topic = title.trim() || (sel?.text.trim() ?? '') || body.trim().slice(0, 200);
    if (!topic) {
      setError('Add a title (or select a topic) to outline.');
      return;
    }
    void guard('outline', async () => {
      const result = await reviseArticleText({ action: 'outline', topic, title });
      if (!body.trim()) {
        setBody(result);
      } else {
        md.insertAtCursor(`\n\n${result}`);
      }
    });
  }, [title, body, md, setBody, guard]);

  const suggestTitles = useCallback(() => {
    if (!body.trim()) {
      setError('Write the article first — then AI can suggest titles.');
      return;
    }
    void guard('title', async () => {
      const list = await suggestArticleTitles(body);
      setTitleSuggestions(list.length ? list : null);
      if (!list.length) {
        setError('Could not come up with titles. Try again.');
      }
    });
  }, [body, guard]);

  const applyTitle = useCallback(
    (t: string) => {
      setTitle(t);
      setTitleSuggestions(null);
    },
    [setTitle]
  );

  const makeExcerpt = useCallback(() => {
    if (!body.trim()) {
      setError('Write the article first — then AI can write an excerpt.');
      return;
    }
    void guard('excerpt', async () => {
      const result = await generateArticleExcerpt(body, title);
      setExcerpt(result);
    });
  }, [body, title, setExcerpt, guard]);

  return {
    busy,
    error,
    titleSuggestions,
    captureSelection,
    transform,
    continueWriting,
    outline,
    suggestTitles,
    applyTitle,
    makeExcerpt,
    dismissTitles: useCallback(() => setTitleSuggestions(null), []),
    clearError: useCallback(() => setError(null), []),
  };
}
