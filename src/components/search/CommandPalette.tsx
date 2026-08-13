'use client';

/**
 * Command palette — Linear/Stripe-style ⌘K overlay.
 *
 * Replaces the inline dropdown that EnhancedSearchBar used to render
 * for desktop. Mobile keeps a full-width form below md.
 *
 * Open triggers:
 *   - Click any palette trigger (header search button or mobile search icon)
 *   - Keyboard: ⌘K (Mac) / Ctrl+K (Win/Linux), from anywhere in the app
 *   - "/" while focus isn't already in an input (Slack-style)
 *
 * Inside the palette:
 *   - cmdk handles arrow-key nav + Enter + Esc natively
 *   - Type to filter — the empty state shows quick actions + suggestions
 *   - Once query is non-empty, async suggestions stream in via
 *     useSearchSuggestions; quick actions filter client-side
 *
 * Created: 2026-06-03
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ArrowRight, Search } from 'lucide-react';
import {
  buildPages,
  buildQuickActions,
  hrefForHit,
  HIT_ICONS,
  type PaletteItem,
} from './command-palette-items';
import { ROUTES } from '@/config/routes';
import { API_ROUTES } from '@/config/api-routes';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { results: hits, loading: hitsLoading } = useGlobalSearch(
    query,
    open && query.trim().length > 1
  );

  // Reset query on close so the next ⌘K opens fresh.
  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  const navigateTo = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router]
  );

  const submitFullSearch = useCallback(
    (term: string) => {
      const trimmed = term.trim();
      if (!trimmed) {
        return;
      }
      // Log the committed search as an aggregate demand signal, with the instant
      // cross-entity result count — 0 means nothing matched (the sharpest unmet-demand
      // signal). No PII; sendBeacon survives the navigation that follows.
      try {
        const payload = JSON.stringify({ query: trimmed, resultCount: hits.length });
        const beacon = navigator.sendBeacon?.bind(navigator);
        if (beacon) {
          beacon(API_ROUTES.SEARCH.LOG, new Blob([payload], { type: 'application/json' }));
        } else {
          void fetch(API_ROUTES.SEARCH.LOG, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true,
          }).catch(() => {});
        }
      } catch {
        /* logging must never disrupt search */
      }
      close();
      router.push(`${ROUTES.DISCOVER}?q=${encodeURIComponent(trimmed)}`);
    },
    [close, router, hits]
  );

  const quickActions: PaletteItem[] = useMemo(() => buildQuickActions(navigateTo), [navigateTo]);

  const pages: PaletteItem[] = useMemo(() => buildPages(navigateTo), [navigateTo]);

  if (!open) {
    return null;
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command palette"
      className={cn(
        'fixed left-1/2 top-[15vh] z-[100] w-[min(640px,calc(100vw-2rem))]',
        '-translate-x-1/2 overflow-hidden rounded-md',
        'border border-subtle bg-surface-page shadow-2xl'
      )}
      overlayClassName="fixed inset-0 z-[99] bg-black/60 backdrop-blur-sm"
    >
      {/* Radix Dialog (underneath cmdk's Command.Dialog) requires a Title
          for screen readers — the `label` prop alone isn't enough and
          logs a runtime error in dev. Visually hide it; cmdk renders the
          Search input below as the user-facing focus. */}
      <VisuallyHidden.Root>
        <DialogPrimitive.Title>Command palette</DialogPrimitive.Title>
      </VisuallyHidden.Root>
      <div className="flex items-center border-b border-subtle px-3.5">
        <Search className="h-4 w-4 flex-shrink-0 text-fg-tertiary" aria-hidden />
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder="Search or jump to…"
          className="w-full bg-transparent px-3 py-3.5 text-sm text-fg-primary placeholder:text-fg-tertiary focus:outline-none"
          onKeyDown={e => {
            // Cmd/Ctrl+Enter does a full search rather than picking the
            // focused item. Plain Enter on no-match also falls through.
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submitFullSearch(query);
            }
          }}
        />
        <kbd className="hidden flex-shrink-0 rounded border border-subtle bg-surface-raised/40 px-1.5 py-0.5 text-2xs text-fg-secondary sm:inline">
          ESC
        </kbd>
      </div>

      <Command.List className="max-h-[60vh] overflow-y-auto p-2">
        <Command.Empty className="px-3 py-8 text-center text-sm text-fg-secondary">
          No matches. Press{' '}
          <kbd className="rounded border border-subtle bg-surface-raised/40 px-1.5 py-0.5 text-2xs">
            ⌘ Enter
          </kbd>{' '}
          to search Discover.
        </Command.Empty>

        {query.trim().length > 0 && (
          <Command.Group
            heading="Search"
            className="text-2xs uppercase tracking-wider text-fg-tertiary"
          >
            <PaletteRow
              icon={Search}
              label={`Search Discover for "${query.trim()}"`}
              hint="Press Enter"
              onSelect={() => submitFullSearch(query)}
              value={`search-discover-${query}`}
            />
          </Command.Group>
        )}

        <Command.Group
          heading="Jump to"
          className="mt-1 text-2xs uppercase tracking-wider text-fg-tertiary"
        >
          {pages.map(item => (
            <PaletteRow
              key={item.id}
              value={`${item.id} ${item.label} ${item.keywords ?? ''}`}
              icon={item.icon}
              label={item.label}
              hint={item.hint}
              onSelect={item.run}
            />
          ))}
        </Command.Group>

        <Command.Group
          heading="Create"
          className="mt-1 text-2xs uppercase tracking-wider text-fg-tertiary"
        >
          {quickActions.map(item => (
            <PaletteRow
              key={item.id}
              value={`${item.id} ${item.label} ${item.keywords ?? ''}`}
              icon={item.icon}
              label={item.label}
              hint={item.hint}
              onSelect={item.run}
            />
          ))}
        </Command.Group>

        {query.trim().length > 1 && hits.length > 0 && (
          <Command.Group
            heading="Results"
            className="mt-1 text-2xs uppercase tracking-wider text-fg-tertiary"
          >
            {hits.map(hit => (
              <PaletteRow
                // `value` is prefixed with the live query so cmdk's built-in
                // filter always keeps server-ranked (typo-tolerant) hits, which
                // may not literally contain the typed text.
                key={`${hit.entity_type}-${hit.id}`}
                value={`${query} ${hit.entity_type} ${hit.title} ${hit.id}`}
                icon={HIT_ICONS[hit.entity_type] ?? Search}
                label={hit.title}
                hint={hit.subtitle ?? hit.entity_type}
                onSelect={() => navigateTo(hrefForHit(hit))}
              />
            ))}
          </Command.Group>
        )}

        {hitsLoading && <div className="px-3 py-2 text-xs text-fg-tertiary">Searching…</div>}
      </Command.List>
    </Command.Dialog>
  );
}

interface PaletteRowProps {
  value: string;
  icon: LucideIcon;
  label: string;
  hint?: string;
  onSelect: () => void;
}

function PaletteRow({ value, icon: Icon, label, hint, onSelect }: PaletteRowProps) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 text-sm',
        'aria-selected:bg-surface-raised/60 aria-selected:text-fg-primary',
        'text-fg-secondary transition-colors'
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="text-fg-primary">{label}</span>
      {hint && <span className="text-xs text-fg-tertiary">{hint}</span>}
      <ArrowRight className="ml-auto h-3.5 w-3.5 flex-shrink-0 opacity-0 group-aria-selected:opacity-100" />
    </Command.Item>
  );
}
