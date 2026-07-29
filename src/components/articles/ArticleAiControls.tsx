'use client';

import { Sparkles, Loader2, ChevronDown, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useArticleAi, type AiBusy } from './useArticleAi';
import type { MarkdownActions } from './useMarkdownTextarea';
import type { TonePreset } from '@/services/cat/writing-types';

const TONES: { key: TonePreset; label: string }[] = [
  { key: 'casual', label: 'More casual' },
  { key: 'formal', label: 'More formal' },
  { key: 'punchy', label: 'More punchy' },
  { key: 'warm', label: 'Warmer' },
];

const BUSY_LABEL: Record<AiBusy, string> = {
  improve: 'Improving',
  continue: 'Continuing',
  tighten: 'Tightening',
  expand: 'Expanding',
  grammar: 'Fixing grammar',
  tone: 'Rewriting',
  outline: 'Outlining',
  title: 'Finding titles',
  excerpt: 'Writing excerpt',
};

/**
 * The in-editor "Ask AI" strip: a single dropdown of writing actions that
 * operate on the current selection (or the whole body), plus whole-article
 * helpers (outline, title, excerpt). Owns its own {@link useArticleAi} state so
 * the composer stays a thin host.
 */
export default function ArticleAiControls({
  md,
  title,
  body,
  setTitle,
  setExcerpt,
  setBody,
  disabled,
  onInsertImage,
}: {
  md: MarkdownActions;
  title: string;
  body: string;
  setTitle: (v: string) => void;
  setExcerpt: (v: string) => void;
  setBody: (v: string) => void;
  disabled?: boolean;
  /** When provided, adds an "Insert an image" action that opens the image picker. */
  onInsertImage?: () => void;
}) {
  const ai = useArticleAi({ md, title, body, setTitle, setExcerpt, setBody });
  const anyBusy = ai.busy !== null || !!disabled;

  const item =
    'cursor-pointer text-sm text-fg-primary focus:bg-surface-raised focus:text-fg-primary';

  return (
    <div className="mb-2">
      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu onOpenChange={open => open && ai.captureSelection()}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={anyBusy}
              className="inline-flex items-center gap-1.5 rounded-md border border-default bg-surface-raised/40 px-3 py-1.5 text-sm font-medium text-fg-primary transition-colors hover:bg-surface-raised disabled:opacity-50"
            >
              {ai.busy ? (
                <Loader2 className="h-4 w-4 animate-spin text-accent-warm" />
              ) : (
                <Sparkles className="h-4 w-4 text-accent-warm" />
              )}
              Ask AI
              <ChevronDown className="h-3.5 w-3.5 text-fg-tertiary" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60">
            <DropdownMenuLabel className="text-fg-tertiary">
              Selection, or the whole article
            </DropdownMenuLabel>
            <DropdownMenuItem className={item} onSelect={() => ai.transform('improve')}>
              Improve the writing
            </DropdownMenuItem>
            <DropdownMenuItem className={item} onSelect={() => ai.continueWriting()}>
              Continue writing
            </DropdownMenuItem>
            <DropdownMenuItem className={item} onSelect={() => ai.transform('tighten')}>
              Make it tighter
            </DropdownMenuItem>
            <DropdownMenuItem className={item} onSelect={() => ai.transform('expand')}>
              Expand / add depth
            </DropdownMenuItem>
            <DropdownMenuItem className={item} onSelect={() => ai.transform('grammar')}>
              Fix grammar &amp; spelling
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-fg-tertiary">Change tone</DropdownMenuLabel>
            {TONES.map(t => (
              <DropdownMenuItem
                key={t.key}
                className={item}
                onSelect={() => ai.transform('tone', t.key)}
              >
                {t.label}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-fg-tertiary">Whole article</DropdownMenuLabel>
            <DropdownMenuItem className={item} onSelect={() => ai.outline()}>
              Outline this topic
            </DropdownMenuItem>
            <DropdownMenuItem className={item} onSelect={() => ai.suggestTitles()}>
              Suggest a title
            </DropdownMenuItem>
            <DropdownMenuItem className={item} onSelect={() => ai.makeExcerpt()}>
              Write the excerpt
            </DropdownMenuItem>
            {onInsertImage && (
              <DropdownMenuItem className={item} onSelect={() => onInsertImage()}>
                Insert an image
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {ai.busy && (
          <span className="inline-flex items-center gap-1.5 text-xs text-fg-tertiary">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {BUSY_LABEL[ai.busy]}…
          </span>
        )}
        {!ai.busy && (
          <span className="text-xs text-fg-tertiary">
            Select text to edit part of it, or run it on the whole draft.
          </span>
        )}
      </div>

      {ai.error && <p className="mt-2 text-xs text-status-negative">{ai.error}</p>}

      {ai.titleSuggestions && (
        <div className="mt-2 rounded-md border border-subtle bg-surface-raised/25 p-2">
          <div className="mb-1 flex items-center justify-between px-1">
            <span className="text-xs font-medium text-fg-secondary">Pick a title</span>
            <button
              type="button"
              onClick={ai.dismissTitles}
              className="text-fg-tertiary transition-colors hover:text-fg-primary"
              aria-label="Dismiss title suggestions"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <ul className="space-y-1">
            {ai.titleSuggestions.map((t, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => ai.applyTitle(t)}
                  className={cn(
                    'w-full truncate rounded px-2 py-1.5 text-left text-sm text-fg-primary transition-colors hover:bg-surface-raised'
                  )}
                >
                  {t}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
