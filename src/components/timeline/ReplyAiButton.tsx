'use client';

import { useState } from 'react';
import { Sparkles, Loader2, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { fetchReplyDraft } from '@/services/articles/ai-client';
import type { ReplyIntent } from '@/services/cat/writing-types';
import { TIMELINE_SURFACE } from '@/config/timeline';
import { cn } from '@/lib/utils';

const INTENTS: { key: ReplyIntent; label: string }[] = [
  { key: 'thoughtful', label: 'Thoughtful reply' },
  { key: 'add', label: 'Add a point' },
  { key: 'question', label: 'Ask a question' },
  { key: 'agree', label: 'Agree & build on it' },
  { key: 'pushback', label: 'Respectful pushback' },
];

/**
 * "AI reply" for a post — drafts a comment grounded in the post being answered
 * plus the user's own context/voice, then drops it into the reply box for the
 * user to edit and send. Intent picker steers how it engages. Fails soft.
 */
export default function ReplyAiButton({
  parentText,
  parentAuthor,
  onDraft,
  disabled,
}: {
  parentText: string;
  parentAuthor?: string;
  onDraft: (text: string) => void;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasParent = parentText.trim().length > 0;
  const blocked = busy || disabled || !hasParent;

  async function draft(intent: ReplyIntent) {
    if (blocked) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await fetchReplyDraft({ parentText, parentAuthor, intent });
      onDraft(result.text);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not draft a reply. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={blocked}
            className={cn(TIMELINE_SURFACE.chip, 'gap-1.5')}
            title="Draft a reply with AI, grounded in this post"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {busy ? 'Writing…' : 'AI reply'}
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          {INTENTS.map(i => (
            <DropdownMenuItem
              key={i.key}
              className="cursor-pointer text-sm text-fg-primary focus:bg-surface-raised"
              onSelect={() => draft(i.key)}
            >
              {i.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {error && <span className="text-xs text-status-negative">{error}</span>}
    </div>
  );
}
