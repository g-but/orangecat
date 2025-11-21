/**
 * Simple Markdown Parser for Timeline Posts
 * 
 * Supports basic formatting:
 * - **bold** → <strong>bold</strong>
 * - *italic* → <em>italic</em>
 * 
 * Lightweight, no dependencies. Safe for user-generated content.
 */

import React from 'react';

/**
 * Renders basic markdown (bold/italic) to HTML
 * Escapes HTML to prevent XSS attacks
 */
export function renderMarkdown(text: string): string {
  if (!text) return '';

  // Escape HTML first to prevent XSS
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  // Process bold (**text**)
  let result = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Process italic (*text*)
  // Only match single asterisks that aren't part of bold
  result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

  return result;
}

/**
 * Renders markdown to React elements
 * Returns an array of React nodes (text nodes and formatted elements)
 */
export function renderMarkdownToReact(text: string): React.ReactNode[] {
  if (!text) return [];

  const parts: React.ReactNode[] = [];
  let currentIndex = 0;

  // Regex to match **bold** and *italic*
  const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > currentIndex) {
      const beforeText = text.substring(currentIndex, match.index);
      if (beforeText) {
        parts.push(beforeText);
      }
    }

    // Add the formatted text
    if (match[1].startsWith('**')) {
      // Bold
      parts.push(<strong key={`bold-${match.index}`}>{match[2]}</strong>);
    } else {
      // Italic
      parts.push(<em key={`italic-${match.index}`}>{match[3]}</em>);
    }

    currentIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (currentIndex < text.length) {
    const remaining = text.substring(currentIndex);
    if (remaining) {
      parts.push(remaining);
    }
  }

  // If no matches, return the original text
  if (parts.length === 0) {
    return [text];
  }

  return parts;
}

