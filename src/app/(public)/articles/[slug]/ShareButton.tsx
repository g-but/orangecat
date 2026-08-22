'use client';

import { useState } from 'react';
import { Check, Share2 } from 'lucide-react';

/**
 * Share affordances for an article — a prefilled post-on-X intent link plus the
 * native share sheet (falling back to copy-to-clipboard). The X link is a plain
 * intent URL: no SDK, no tracking script, the reader posts from their own
 * account. Article pages already ship `twitter:card` metadata, so the pasted
 * link unfurls into a large preview card.
 */

/** X's logo isn't in this lucide version — a minimal inline glyph, currentColor. */
function XGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M18.9 2.1h3.4l-7.4 8.5 8.7 11.3h-6.8l-5.3-6.9-6.1 6.9H1.9l7.9-9L1.4 2.1h7l4.8 6.3 5.7-6.3Zm-1.2 17.8h1.9L7.3 4H5.3l12.4 15.9Z" />
    </svg>
  );
}

export default function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* user dismissed — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — no-op */
    }
  }

  const intentHref = `https://x.com/intent/post?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const buttonClass =
    'inline-flex items-center gap-1.5 rounded-md border border-default px-3 py-1.5 text-sm font-medium text-fg-secondary transition-colors hover:bg-surface-raised hover:text-fg-primary';

  return (
    <span className="inline-flex items-center gap-2">
      <a
        href={intentHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Post "${title}" on X`}
        className={buttonClass}
      >
        <XGlyph className="h-3.5 w-3.5" />
        Post
      </a>
      <button type="button" onClick={share} className={buttonClass}>
        {copied ? (
          <Check className="h-4 w-4 text-status-positive" />
        ) : (
          <Share2 className="h-4 w-4" />
        )}
        {copied ? 'Link copied' : 'Share'}
      </button>
    </span>
  );
}
