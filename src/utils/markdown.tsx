/**
 * Simple Markdown Parser for Timeline Posts
 *
 * Supports basic formatting:
 * - **bold** → <strong>bold</strong>
 * - *italic* → <em>italic</em>
 * - @username → link to /profiles/username
 * - URLs → clickable links
 *
 * Lightweight, no dependencies. Safe for user-generated content.
 */

import React from 'react';
import Link from 'next/link';

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
 * Token types for parsing
 */
type TokenType = 'text' | 'bold' | 'italic' | 'mention' | 'url';

interface Token {
  type: TokenType;
  value: string;
  username?: string; // For mentions
  url?: string; // For URLs
}

/**
 * Tokenize text into parseable segments
 */
function tokenize(text: string): Token[] {
  if (!text) return [];

  const tokens: Token[] = [];

  // Combined pattern for all formats: **bold**, *italic*, @mentions, URLs
  const combinedRegex =
    /(\*\*[^*]+\*\*|\*[^*]+\*|@[a-zA-Z0-9_]{1,30}|https?:\/\/[^\s<>[\]{}|\\^`"']+)/g;

  let lastIndex = 0;
  let match;

  while ((match = combinedRegex.exec(text)) !== null) {
    // Add plain text before match
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }

    const matchedText = match[0];

    // Determine token type
    if (matchedText.startsWith('**') && matchedText.endsWith('**')) {
      tokens.push({
        type: 'bold',
        value: matchedText.slice(2, -2),
      });
    } else if (matchedText.startsWith('*') && matchedText.endsWith('*')) {
      tokens.push({
        type: 'italic',
        value: matchedText.slice(1, -1),
      });
    } else if (matchedText.startsWith('@')) {
      tokens.push({
        type: 'mention',
        value: matchedText,
        username: matchedText.slice(1),
      });
    } else if (matchedText.startsWith('http')) {
      tokens.push({
        type: 'url',
        value: matchedText,
        url: matchedText,
      });
    }

    lastIndex = match.index + matchedText.length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    tokens.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return tokens;
}

/**
 * Renders markdown to React elements
 * Supports: **bold**, *italic*, @mentions, URLs
 * Returns an array of React nodes
 */
export function renderMarkdownToReact(text: string): React.ReactNode[] {
  if (!text) return [];

  const tokens = tokenize(text);
  if (tokens.length === 0) return [text];

  return tokens.map((token, index) => {
    const key = `${token.type}-${index}`;

    switch (token.type) {
      case 'bold':
        return <strong key={key}>{token.value}</strong>;

      case 'italic':
        return <em key={key}>{token.value}</em>;

      case 'mention':
        return (
          <Link
            key={key}
            href={`/profiles/${token.username}`}
            className="text-sky-600 hover:text-sky-700 hover:underline font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            {token.value}
          </Link>
        );

      case 'url':
        // Clean up URL for display (remove protocol, truncate)
        const displayUrl =
          token.url!.replace(/^https?:\/\//, '').slice(0, 40) +
          (token.url!.length > 50 ? '...' : '');
        return (
          <a
            key={key}
            href={token.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-600 hover:text-sky-700 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {displayUrl}
          </a>
        );

      case 'text':
      default:
        return token.value;
    }
  });
}

