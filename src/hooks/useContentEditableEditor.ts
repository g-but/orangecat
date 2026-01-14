/**
 * useContentEditableEditor - Shared Rich Text Editor Hook
 *
 * Extracts common contentEditable editor logic from TimelineComposer and PostComposerMobile.
 * Provides markdown-based formatting with HTML preview.
 *
 * Created: 2026-01-13
 * Last Modified: 2026-01-13
 * Last Modified Summary: Initial extraction from TimelineComposer/PostComposerMobile
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import {
  markdownToHtml,
  htmlToMarkdown,
  getSelectionRange,
  setSelectionRange,
} from '@/utils/markdownEditor';

interface UseContentEditableEditorOptions {
  /** Current markdown content (controlled) */
  content: string;
  /** Callback when content changes */
  onContentChange: (markdown: string) => void;
  /** Callback when user presses Ctrl/Cmd+Enter */
  onSubmit?: () => void;
  /** Callback when user presses Escape */
  onCancel?: () => void;
  /** Maximum height before scrolling (default: 480px) */
  maxHeight?: number;
  /** Whether the editor is disabled/posting */
  disabled?: boolean;
  /** Optional HTML sanitizer function */
  sanitizer?: (html: string) => string;
}

interface UseContentEditableEditorReturn {
  /** Ref to attach to the contentEditable element */
  editorRef: React.RefObject<HTMLDivElement>;
  /** Handle input events on the editor */
  handleInput: () => void;
  /** Handle paste events (strips formatting) */
  handlePaste: (e: React.ClipboardEvent<HTMLDivElement>) => void;
  /** Handle keyboard shortcuts */
  handleKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  /** Apply bold or italic formatting */
  handleFormat: (format: 'bold' | 'italic') => void;
  /** Whether user is actively typing (avoid cursor jumps during this) */
  isComposing: boolean;
}

/**
 * Custom hook for contentEditable rich text editing with markdown storage.
 *
 * Features:
 * - Visual formatting (bold/italic) via document.execCommand
 * - Markdown storage/retrieval
 * - Keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+Enter, Escape)
 * - Auto-resize with max height
 * - Paste as plain text
 * - Cursor position preservation
 *
 * @example
 * ```tsx
 * const { editorRef, handleInput, handlePaste, handleKeyDown, handleFormat } =
 *   useContentEditableEditor({
 *     content: postComposer.content,
 *     onContentChange: postComposer.setContent,
 *     onSubmit: postComposer.handlePost,
 *   });
 *
 * return (
 *   <div
 *     ref={editorRef}
 *     contentEditable
 *     onInput={handleInput}
 *     onPaste={handlePaste}
 *     onKeyDown={handleKeyDown}
 *   />
 * );
 * ```
 */
export function useContentEditableEditor({
  content,
  onContentChange,
  onSubmit,
  onCancel,
  maxHeight = 480,
  disabled = false,
  sanitizer,
}: UseContentEditableEditorOptions): UseContentEditableEditorReturn {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isComposing, setIsComposing] = useState(false);

  // Helper to optionally sanitize HTML
  const sanitize = useCallback(
    (html: string) => (sanitizer ? sanitizer(html) : html),
    [sanitizer]
  );

  // Sync markdown content to HTML in editor (only when not actively composing)
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || isComposing || document.activeElement === editor) {
      return;
    }

    const currentHtml = editor.innerHTML.replace(/\s+/g, ' ').trim();
    const expectedHtml = markdownToHtml(content).replace(/\s+/g, ' ').trim();

    // Only update if significantly different (avoid cursor jumping)
    if (currentHtml !== expectedHtml && expectedHtml !== '<br>') {
      const selection = getSelectionRange(editor);
      const wasFocused = document.activeElement === editor;

      editor.innerHTML = sanitize(expectedHtml || '<br>');

      // Restore cursor position and focus
      if (selection && wasFocused) {
        requestAnimationFrame(() => {
          if (editor) {
            try {
              setSelectionRange(editor, selection.start, selection.end);
              editor.focus();
            } catch {
              // Fallback: just focus
              editor.focus();
            }
          }
        });
      }
    }
  }, [content, isComposing, sanitize]);

  // Handle input in contentEditable
  const handleInput = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) {return;}

    setIsComposing(true);

    // Debounce the markdown conversion slightly to avoid cursor jumping
    setTimeout(() => {
      if (editor) {
        const html = sanitize(editor.innerHTML);
        const markdown = htmlToMarkdown(html);

        // Only update if different to avoid unnecessary re-renders
        if (markdown !== content) {
          onContentChange(markdown);
        }

        // Auto-resize with max height cap
        editor.style.height = 'auto';
        editor.style.height = `${Math.min(editor.scrollHeight, maxHeight)}px`;
        editor.style.overflowY = editor.scrollHeight > maxHeight ? 'auto' : 'hidden';
      }
      setIsComposing(false);
    }, 10);
  }, [content, maxHeight, onContentChange, sanitize]);

  // Handle paste to strip formatting
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      const editor = editorRef.current;
      if (!editor) {return;}

      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');

      // Insert plain text at cursor
      document.execCommand('insertText', false, text);

      // Sync markdown from the updated HTML
      const html = sanitize(editor.innerHTML);
      const markdown = htmlToMarkdown(html);
      onContentChange(markdown);
    },
    [onContentChange, sanitize]
  );

  // Handle formatting (bold/italic)
  const handleFormat = useCallback(
    (format: 'bold' | 'italic') => {
      const editor = editorRef.current;
      if (!editor) {return;}

      // Focus editor if not already focused
      editor.focus();

      // Use document.execCommand for formatting
      const command = format === 'bold' ? 'bold' : 'italic';
      document.execCommand(command, false);

      // Sync back to markdown after browser updates
      setTimeout(() => {
        if (editor) {
          const html = sanitize(editor.innerHTML);
          const markdown = htmlToMarkdown(html);
          onContentChange(markdown);
        }
      }, 0);
    },
    [onContentChange, sanitize]
  );

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      // Ctrl/Cmd + Enter to submit
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (!disabled && onSubmit) {
          onSubmit();
        }
      }

      // Escape to cancel
      if (e.key === 'Escape' && onCancel) {
        onCancel();
      }

      // Ctrl/Cmd + B for bold
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        handleFormat('bold');
      }

      // Ctrl/Cmd + I for italic
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        handleFormat('italic');
      }
    },
    [disabled, onSubmit, onCancel, handleFormat]
  );

  return {
    editorRef,
    handleInput,
    handlePaste,
    handleKeyDown,
    handleFormat,
    isComposing,
  };
}

export default useContentEditableEditor;
