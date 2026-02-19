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
  if (!text) {
    return '';
  }

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
type TokenType = 'text' | 'bold' | 'italic' | 'mention' | 'url' | 'mdlink';

interface Token {
  type: TokenType;
  value: string;
  username?: string; // For mentions
  url?: string; // For URLs
  linkText?: string; // For markdown links [text](url)
}

/**
 * Tokenize text into parseable segments
 */
function tokenize(text: string): Token[] {
  if (!text) {
    return [];
  }

  const tokens: Token[] = [];

  // Combined pattern for all formats: [text](url), **bold**, *italic*, @mentions, URLs
  // Note: mdlink must come before plain URLs to match first
  const combinedRegex =
    /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*|@[a-zA-Z0-9_]{1,30}|https?:\/\/[^\s<>[\]{}|\\^`"']+)/g;

  let lastIndex = 0;
  let match;

  while ((match = combinedRegex.exec(text)) !== null) {
    // Add plain text before match
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }

    const matchedText = match[0];

    // Determine token type
    if (matchedText.startsWith('[') && matchedText.includes('](')) {
      // Markdown link: [text](url)
      const linkMatch = matchedText.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        tokens.push({
          type: 'mdlink',
          value: matchedText,
          linkText: linkMatch[1],
          url: linkMatch[2],
        });
      }
    } else if (matchedText.startsWith('**') && matchedText.endsWith('**')) {
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
 * Renders chat markdown to React elements.
 * Supports: ## headers, - bullets, 1. numbered lists, blank lines, plus inline formatting.
 * Designed for AI chat responses that use lightweight markdown structure.
 */
export function renderChatMarkdown(text: string): React.ReactNode {
  if (!text) {
    return null;
  }

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line → spacer
    if (!line.trim()) {
      elements.push(<div key={`blank-${i}`} className="h-2" />);
      i++;
      continue;
    }

    // ## Header or ### Header
    if (line.startsWith('### ')) {
      elements.push(
        <div key={`h3-${i}`} className="font-semibold text-sm mt-2 mb-0.5">
          {renderInlineTokens(line.slice(4))}
        </div>
      );
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <div key={`h2-${i}`} className="font-semibold mt-2 mb-0.5">
          {renderInlineTokens(line.slice(3))}
        </div>
      );
      i++;
      continue;
    }

    // Bullet list (- item)
    if (/^[-*] /.test(line.trimStart())) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i].trimStart())) {
        const content = lines[i].trimStart().replace(/^[-*] /, '');
        items.push(<li key={`li-${i}`}>{renderInlineTokens(content)}</li>);
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc pl-4 space-y-0.5 my-1">
          {items}
        </ul>
      );
      continue;
    }

    // Numbered list (1. item)
    if (/^\d+\.\s/.test(line.trimStart())) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trimStart())) {
        const content = lines[i].trimStart().replace(/^\d+\.\s/, '');
        items.push(<li key={`oli-${i}`}>{renderInlineTokens(content)}</li>);
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="list-decimal pl-4 space-y-0.5 my-1">
          {items}
        </ol>
      );
      continue;
    }

    // Regular paragraph line
    elements.push(<div key={`p-${i}`}>{renderInlineTokens(line)}</div>);
    i++;
  }

  return <>{elements}</>;
}

/** Render inline tokens (bold, italic, links) for a single line */
function renderInlineTokens(text: string): React.ReactNode[] {
  const tokens = tokenize(text);
  if (tokens.length === 0) {
    return [text];
  }
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
            onClick={e => e.stopPropagation()}
          >
            {token.value}
          </Link>
        );
      case 'mdlink':
        return (
          <a
            key={key}
            href={token.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-600 hover:text-sky-700 hover:underline font-medium"
            onClick={e => e.stopPropagation()}
          >
            {token.linkText}
          </a>
        );
      case 'url': {
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
            onClick={e => e.stopPropagation()}
          >
            {displayUrl}
          </a>
        );
      }
      case 'text':
      default:
        return token.value;
    }
  });
}

/**
 * Renders markdown to React elements
 * Supports: **bold**, *italic*, @mentions, URLs
 * Returns an array of React nodes
 */
export function renderMarkdownToReact(text: string): React.ReactNode[] {
  if (!text) {
    return [];
  }

  const tokens = tokenize(text);
  if (tokens.length === 0) {
    return [text];
  }

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
            onClick={e => e.stopPropagation()}
          >
            {token.value}
          </Link>
        );

      case 'mdlink':
        // Markdown link: [text](url)
        return (
          <a
            key={key}
            href={token.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-600 hover:text-sky-700 hover:underline font-medium"
            onClick={e => e.stopPropagation()}
          >
            {token.linkText}
          </a>
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
            onClick={e => e.stopPropagation()}
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
