'use client';

/**
 * CONVERSATION RAIL — Grok/ChatGPT-style left list of Cat conversations.
 *
 * Desktop (md+): an always-visible fixed-width column.
 * Mobile: a slide-over drawer toggled by a floating button (the chat area owns
 * the full width otherwise).
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Plus, MessageSquare, Trash2, PanelLeft, X } from 'lucide-react';
import type { ConversationSummary } from '../hooks/useConversations';

interface ConversationRailProps {
  conversations: ConversationSummary[];
  /** null = fresh new-chat draft (the default landing state). */
  activeId: string | null;
  /** True while the initial conversation list is loading — show placeholders, not "empty". */
  isLoading?: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

function railTitle(c: ConversationSummary): string {
  return c.title?.trim() || 'New chat';
}

function RailBody({
  conversations,
  activeId,
  isLoading,
  onSelect,
  onNew,
  onDelete,
}: ConversationRailProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="p-2">
        <button
          type="button"
          onClick={onNew}
          className={cn(
            'flex w-full items-center gap-2 rounded-lg border border-subtle px-3 py-2 text-sm font-medium text-fg-primary transition-colors hover:bg-surface-raised',
            // Draft state (no active conversation) = "New chat" is where you are.
            activeId === null ? 'bg-surface-raised' : 'bg-surface-base'
          )}
        >
          <Plus className="h-4 w-4" />
          New chat
        </button>
      </div>

      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-2">
        {isLoading ? (
          // Skeleton rows while the list resolves — never flash "no conversations".
          <div className="space-y-1.5 px-1 py-1" aria-hidden>
            {[0, 1, 2].map(i => (
              <div key={i} className="h-8 animate-pulse rounded-lg bg-surface-raised/60" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          // Compact rail-sized empty state: icon + why it's empty + one CTA.
          <div className="px-3 py-6 text-center">
            <MessageSquare className="mx-auto mb-2 h-6 w-6 text-fg-tertiary" />
            <p className="text-xs text-fg-tertiary">
              No conversations yet — chats with your Cat will appear here.
            </p>
            <button
              type="button"
              onClick={onNew}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-subtle bg-surface-base px-3 py-1.5 text-xs font-medium text-fg-primary transition-colors hover:bg-surface-raised"
            >
              <Plus className="h-3.5 w-3.5" />
              Start a chat
            </button>
          </div>
        ) : (
          conversations.map(c => {
            const isActive = c.id === activeId;
            return (
              <div
                key={c.id}
                className={cn(
                  'group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-surface-raised text-fg-primary'
                    : 'text-fg-secondary hover:bg-surface-raised/60'
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <MessageSquare className="h-4 w-4 flex-shrink-0 opacity-70" />
                  <span className="truncate">{railTitle(c)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(c.id)}
                  className="flex-shrink-0 rounded p-2 text-fg-tertiary opacity-100 transition-opacity hover:text-status-negative md:opacity-0 md:group-hover:opacity-100"
                  aria-label={`Delete ${railTitle(c)}`}
                  title="Delete conversation"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })
        )}
      </nav>
    </div>
  );
}

export function ConversationRail(props: ConversationRailProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop column */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-subtle bg-surface-page md:flex md:flex-col">
        <RailBody {...props} />
      </aside>

      {/* Mobile trigger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="absolute left-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-lg border border-subtle bg-surface-base text-fg-secondary transition-colors hover:bg-surface-raised md:hidden"
        aria-label="Show conversations"
      >
        <PanelLeft className="h-4 w-4" />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 max-w-[80vw] flex-col border-r border-subtle bg-surface-page shadow-xl">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm font-semibold text-fg-primary">Chats</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-fg-secondary hover:bg-surface-raised"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <RailBody
                {...props}
                onSelect={id => {
                  props.onSelect(id);
                  setMobileOpen(false);
                }}
                onNew={() => {
                  props.onNew();
                  setMobileOpen(false);
                }}
              />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
