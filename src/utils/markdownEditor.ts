/**
 * Markdown Editor Utilities
 *
 * Utilities for converting between markdown and HTML for contentEditable editors
 * Used to show formatted text inline (like X/Twitter)
 */

/**
 * Converts markdown to HTML for display in contentEditable
 * Supports **bold** and *italic*
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) {
    return '';
  }

  // Escape HTML first to prevent XSS
  let html = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  // Process bold (**text**) - must come before italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Process italic (*text*) - only match single asterisks not part of bold
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

  // Preserve line breaks
  html = html.replace(/\n/g, '<br>');

  return html;
}

/**
 * Converts HTML from contentEditable back to markdown
 * Handles <strong>, <em>, <b>, <i> tags
 */
export function htmlToMarkdown(html: string): string {
  if (!html) {
    return '';
  }

  // Remove all HTML tags except strong, em, b, i, br
  let markdown = html
    // Convert <strong> and <b> to **bold**
    .replace(/<(strong|b)>/gi, '**')
    .replace(/<\/(strong|b)>/gi, '**')
    // Convert <em> and <i> to *italic*
    .replace(/<(em|i)>/gi, '*')
    .replace(/<\/(em|i)>/gi, '*')
    // Convert <br> and <br/> to newlines
    .replace(/<br\s*\/?>/gi, '\n')
    // Remove all other HTML tags
    .replace(/<[^>]+>/g, '')
    // Decode HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ');

  // Clean up extra whitespace
  markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();

  return markdown;
}

/**
 * Gets the current selection range in a contentEditable element
 */
export function getSelectionRange(element: HTMLElement): { start: number; end: number } | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(element);
  preCaretRange.setEnd(range.endContainer, range.endOffset);

  const start = preCaretRange.toString().length;
  const end = start + range.toString().length;

  return { start, end };
}

/**
 * Sets the selection range in a contentEditable element
 */
export function setSelectionRange(element: HTMLElement, start: number, end: number): void {
  const selection = window.getSelection();
  if (!selection) {
    return;
  }

  const range = document.createRange();
  let charCount = 0;
  const nodeStack = [element];
  let node: Node | undefined;
  let foundStart = false;

  while (!foundStart && (node = nodeStack.pop())) {
    if (node.nodeType === Node.TEXT_NODE) {
      const nextCharCount = charCount + (node.textContent?.length || 0);
      if (!foundStart && start >= charCount && start <= nextCharCount) {
        range.setStart(node, start - charCount);
        foundStart = true;
      }
      if (foundStart && end >= charCount && end <= nextCharCount) {
        range.setEnd(node, end - charCount);
        break;
      }
      charCount = nextCharCount;
    } else {
      let i = node.childNodes.length;
      while (i--) {
        nodeStack.push(node.childNodes[i]);
      }
    }
  }

  selection.removeAllRanges();
  selection.addRange(range);
}
