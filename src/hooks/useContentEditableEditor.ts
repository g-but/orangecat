import { useRef, useState, useCallback, useEffect } from 'react';
import {
  markdownToHtml,
  htmlToMarkdown,
  getSelectionRange,
  setSelectionRange,
} from '@/utils/markdownEditor';

interface UseContentEditableEditorOptions {
  content: string;
  onContentChange: (markdown: string) => void;
  onSubmit?: () => void;
  onCancel?: () => void;
  maxHeight?: number;
  disabled?: boolean;
  sanitizer?: (html: string) => string;
}

interface UseContentEditableEditorReturn {
  editorRef: React.RefObject<HTMLDivElement | null>;
  handleInput: () => void;
  handlePaste: (e: React.ClipboardEvent<HTMLDivElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  handleFormat: (format: 'bold' | 'italic') => void;
  isComposing: boolean;
}

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

  const sanitize = useCallback((html: string) => (sanitizer ? sanitizer(html) : html), [sanitizer]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || isComposing || document.activeElement === editor) {
      return;
    }

    const currentHtml = editor.innerHTML.replace(/\s+/g, ' ').trim();
    const expectedHtml = markdownToHtml(content).replace(/\s+/g, ' ').trim();

    if (currentHtml !== expectedHtml && expectedHtml !== '<br>') {
      const selection = getSelectionRange(editor);
      const wasFocused = document.activeElement === editor;

      editor.innerHTML = sanitize(expectedHtml || '<br>');

      if (selection && wasFocused) {
        requestAnimationFrame(() => {
          if (editor) {
            try {
              setSelectionRange(editor, selection.start, selection.end);
              editor.focus();
            } catch {
              editor.focus();
            }
          }
        });
      }
    }
  }, [content, isComposing, sanitize]);

  const handleInput = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    setIsComposing(true);

    setTimeout(() => {
      if (editor) {
        const html = sanitize(editor.innerHTML);
        const markdown = htmlToMarkdown(html);

        if (markdown !== content) {
          onContentChange(markdown);
        }

        editor.style.height = 'auto';
        editor.style.height = `${Math.min(editor.scrollHeight, maxHeight)}px`;
        editor.style.overflowY = editor.scrollHeight > maxHeight ? 'auto' : 'hidden';
      }
      setIsComposing(false);
    }, 10);
  }, [content, maxHeight, onContentChange, sanitize]);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      const editor = editorRef.current;
      if (!editor) {
        return;
      }

      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      document.execCommand('insertText', false, text);

      const html = sanitize(editor.innerHTML);
      const markdown = htmlToMarkdown(html);
      onContentChange(markdown);
    },
    [onContentChange, sanitize]
  );

  const handleFormat = useCallback(
    (format: 'bold' | 'italic') => {
      const editor = editorRef.current;
      if (!editor) {
        return;
      }

      editor.focus();
      document.execCommand(format === 'bold' ? 'bold' : 'italic', false);

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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (!disabled && onSubmit) {
          onSubmit();
        }
      }

      if (e.key === 'Escape' && onCancel) {
        onCancel();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        handleFormat('bold');
      }

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
