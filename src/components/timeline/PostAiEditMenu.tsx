'use client';

import { useState } from 'react';
import { Wand2, Loader2, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { reviseArticleText } from '@/services/articles/ai-client';
import type { ReviseAction, TonePreset } from '@/services/cat/writing-types';
import { TIMELINE_SURFACE } from '@/config/timeline';
import { cn } from '@/lib/utils';

const TONES: { key: TonePreset; label: string }[] = [
  { key: 'casual', label: 'More casual' },
  { key: 'formal', label: 'More formal' },
  { key: 'punchy', label: 'More punchy' },
  { key: 'warm', label: 'Warmer' },
];

/**
 * "Improve" menu for something the user has ALREADY typed into a post/reply
 * composer — the short-form counterpart to the article editor's Ask-AI strip
 * (previously buried in the article editor only). Rewrites the whole post text
 * in place, kept post-short + voice-matched by the revise engine (kind:'post').
 * Fails soft: a transient inline note, never a blocking error.
 */
export default function PostAiEditMenu({
  text,
  onRevised,
  disabled,
}: {
  text: string;
  onRevised: (text: string) => void;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const blocked = busy || disabled || !text.trim();

  async function run(action: Exclude<ReviseAction, 'continue' | 'outline'>, tone?: TonePreset) {
    if (blocked) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await reviseArticleText({ action, text, tone, kind: 'post' });
      onRevised(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not edit that. Try again.');
    } finally {
      setBusy(false);
    }
  }

  const item = 'cursor-pointer text-sm text-fg-primary focus:bg-surface-raised';

  return (
    <div className="inline-flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={blocked}
            className={cn(TIMELINE_SURFACE.chip, 'gap-1.5')}
            title="Improve what you've written with AI"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {busy ? 'Editing…' : 'Improve'}
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuItem className={item} onSelect={() => run('improve')}>
            Improve the writing
          </DropdownMenuItem>
          <DropdownMenuItem className={item} onSelect={() => run('tighten')}>
            Make it tighter
          </DropdownMenuItem>
          <DropdownMenuItem className={item} onSelect={() => run('expand')}>
            Add a bit more
          </DropdownMenuItem>
          <DropdownMenuItem className={item} onSelect={() => run('grammar')}>
            Fix grammar &amp; spelling
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-fg-tertiary">Change tone</DropdownMenuLabel>
          {TONES.map(t => (
            <DropdownMenuItem key={t.key} className={item} onSelect={() => run('tone', t.key)}>
              {t.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {error && <span className="text-xs text-status-negative">{error}</span>}
    </div>
  );
}
