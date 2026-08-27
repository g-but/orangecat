'use client';

/**
 * Wiring the `@` menu into a contentEditable composer.
 *
 * There are two of those — the desktop wall composer and the mobile one — and
 * they need identical plumbing: the same event chaining, the same combobox
 * ARIA, the same ids tying the editor to the listbox. Written out at each call
 * site that was twelve lines of boilerplate duplicated once, and the kind of
 * duplication where the second copy quietly loses an `aria-` attribute nobody
 * notices for a year.
 *
 * So the wiring is here, once, and each composer spreads two prop bags. The
 * hook stays deliberately thin: it owns no state of its own and makes no
 * decisions, it only connects `useMentionAutocomplete` to a DOM element.
 */

import { useCallback } from 'react';
import { contentEditableSurface, type ElementRef } from '@/components/mentions/caret';
import { useMentionAutocomplete } from '@/hooks/useMentionAutocomplete';
import type { MentionSuggestionsProps } from '@/components/mentions/MentionSuggestions';

interface UseContentEditableMentionsOptions {
  editorRef: ElementRef<HTMLElement>;
  /** The editor's own input handler; still runs, after the menu updates. */
  onInput: () => void;
  /** The editor's own key handler; skipped when the menu consumes the key. */
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  /** Suppress the menu while the composer is submitting. */
  disabled?: boolean;
  /** Distinguishes the listbox ids when both composers are on one page. */
  idPrefix: string;
}

export function useContentEditableMentions({
  editorRef,
  onInput,
  onKeyDown,
  disabled = false,
  idPrefix,
}: UseContentEditableMentionsOptions) {
  const mentions = useMentionAutocomplete({
    surface: contentEditableSurface(editorRef),
    disabled,
  });

  // The menu sees the key first: while it is open, Enter and Tab choose a
  // person rather than reaching the editor's submit and formatting shortcuts.
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (mentions.handleKeyDown(event)) {
        return;
      }
      onKeyDown(event);
    },
    [mentions, onKeyDown]
  );

  const handleInput = useCallback(() => {
    onInput();
    mentions.refresh();
  }, [onInput, mentions]);

  const editorProps = {
    onInput: handleInput,
    onKeyDown: handleKeyDown,
    onClick: mentions.refresh,
    onBlur: mentions.close,
    // `combobox` rather than `textbox`: this editor can pop a suggestion list,
    // and `aria-expanded` is only meaningful on a role that owns one. ARIA has
    // no multiline combobox, so `aria-multiline` is deliberately absent —
    // `contentEditable` already tells assistive tech the field takes newlines.
    role: 'combobox' as const,
    'aria-autocomplete': 'list' as const,
    'aria-expanded': mentions.open,
    'aria-controls': `${idPrefix}-listbox`,
    'aria-activedescendant': mentions.open
      ? `${idPrefix}-option-${mentions.activeIndex}`
      : undefined,
  };

  const menuProps: MentionSuggestionsProps = {
    items: mentions.items,
    activeIndex: mentions.activeIndex,
    onPick: mentions.pick,
    onHover: mentions.setActiveIndex,
    placement: 'below',
    idPrefix,
  };

  return { editorProps, menuProps };
}
