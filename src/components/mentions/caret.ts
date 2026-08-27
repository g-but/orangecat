/**
 * Reading and rewriting the text at the caret, for the two editors this app has.
 *
 * Messages are typed into a `<textarea>` and wall posts into a `contentEditable`
 * div, and those two disagree about almost everything: one has `selectionStart`,
 * the other has the Selection API; one holds a string, the other holds nodes.
 *
 * This file is the ONLY place that difference is allowed to exist. Both editors
 * are reduced to the same two questions — "what is the text before the caret?"
 * and "replace this range with this handle" — so the mention parser, the
 * ranking, the fetching and the menu are all written once and neither of them
 * knows which kind of editor it is attached to.
 *
 * Both writers go through `document.execCommand('insertText')`, which is
 * deprecated and used deliberately: it is the only way to change either editor
 * that fires a real `input` event (so React's `onChange` runs and state stays in
 * sync) and keeps the browser's own undo stack intact, so ctrl-Z after picking a
 * suggestion undoes the pick rather than the whole message. `handlePaste` in
 * `useContentEditableEditor` already relies on it for the same reasons.
 */

import { setSelectionRange } from '@/utils/markdownEditor';

/** What the mention machinery needs from an editor, whatever kind it is. */
export interface CaretSurface {
  /** Text from the start of the field up to the caret, or null if there is no caret in it. */
  readTextBeforeCaret: () => string | null;
  /** Replace `[start, end)` — offsets in the same space `readTextBeforeCaret` counts in — with `insert`. */
  replaceRange: (start: number, end: number, insert: string) => void;
}

/**
 * React sets `value` through a property setter it installed on the element, so
 * assigning `el.value` directly leaves React's copy of the value stale. Writing
 * through the prototype's setter and then dispatching `input` is the documented
 * way around it, used only when `execCommand` is unavailable (jsdom, and any
 * browser that finally removes it).
 */
function setValueNatively(el: HTMLTextAreaElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  if (setter) {
    setter.call(el, value);
  } else {
    el.value = value;
  }
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * Both surfaces take a REF rather than an element, and read `.current` when
 * called rather than when built.
 *
 * Taking the element would capture whatever it was during the render that built
 * the surface — which on first render is null, because refs are assigned at
 * commit. Nothing re-renders between mounting a composer and its first
 * keystroke, so a captured null would survive exactly long enough to swallow the
 * first `@` somebody ever types into a fresh composer.
 */
export type ElementRef<T> = { readonly current: T | null };

export function textareaSurface(ref: ElementRef<HTMLTextAreaElement>): CaretSurface {
  return {
    readTextBeforeCaret() {
      const el = ref.current;
      if (!el) {
        return null;
      }
      // A selection that spans characters is not someone typing a handle.
      if (el.selectionStart === null || el.selectionStart !== el.selectionEnd) {
        return null;
      }
      return el.value.slice(0, el.selectionStart);
    },

    replaceRange(start, end, insert) {
      const el = ref.current;
      if (!el) {
        return;
      }
      el.focus();
      el.setSelectionRange(start, end);

      let inserted = false;
      try {
        inserted = document.execCommand('insertText', false, insert);
      } catch {
        inserted = false;
      }

      if (!inserted) {
        setValueNatively(el, el.value.slice(0, start) + insert + el.value.slice(end));
        const caret = start + insert.length;
        el.setSelectionRange(caret, caret);
      }
    },
  };
}

/**
 * Text before the caret inside a contentEditable, as a plain string.
 *
 * Cloning the range and extending it back over the whole element is the same
 * technique `getSelectionRange` uses to produce an offset — this returns the
 * string it measures, so the offsets the caller then hands to `replaceRange`
 * are counted in exactly the same space. Taking `element.textContent` and
 * slicing it by an offset would have been a second, subtly different, way of
 * flattening the same nodes.
 */
export function contentEditableSurface(ref: ElementRef<HTMLElement>): CaretSurface {
  return {
    readTextBeforeCaret() {
      const el = ref.current;
      if (!el || typeof window === 'undefined') {
        return null;
      }
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) {
        return null;
      }
      const range = selection.getRangeAt(0);
      if (!el.contains(range.startContainer)) {
        return null;
      }
      const beforeCaret = range.cloneRange();
      beforeCaret.selectNodeContents(el);
      beforeCaret.setEnd(range.startContainer, range.startOffset);
      return beforeCaret.toString();
    },

    replaceRange(start, end, insert) {
      const el = ref.current;
      if (!el) {
        return;
      }
      el.focus();
      setSelectionRange(el, start, end);
      try {
        document.execCommand('insertText', false, insert);
      } catch {
        // Nothing safe to fall back to here: rebuilding the node tree by hand
        // would lose formatting the user already applied. Leaving the text as
        // typed is the harmless outcome — `@ca` still resolves to nobody, and
        // they can finish typing the handle themselves.
      }
    },
  };
}
