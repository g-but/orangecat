'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cat, X, Maximize2 } from 'lucide-react';
import { ModernChatPanel } from '@/components/ai-chat/ModernChatPanel/index';
import { describePageForCat } from '@/config/cat-page-context';
import { ROUTES } from '@/config/routes';
import { cn } from '@/lib/utils';

/**
 * Global Cat launcher — a floating button on every app page that opens Cat as a
 * slide-over, WITHOUT leaving the page. Because it lives on top of the current
 * page, it passes that page (and its entity, if any) to Cat, so "summarise this
 * project" / "who's asking about this?" work in context. The full history +
 * settings still live at the Cat hub, one click away via the expand button.
 *
 * Mounted once in AppShell; the parent decides when to render it (authed app
 * surfaces only, never the Cat hub itself).
 */
export default function GlobalCatLauncher() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Keep the drawer's conversation across open/close within a session, so
  // reopening resumes the thread instead of starting cold.
  const [conversationId, setConversationId] = useState<string | null>(null);

  const page = describePageForCat(pathname);

  // Close on Escape.
  useEffect(() => {
    if (!open) {
      return;
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      {/* Floating launcher — clears the mobile bottom nav (pb-20) on small screens. */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ask Cat"
          className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent-warm text-on-accent shadow-lg transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-warm focus-visible:ring-offset-2 md:bottom-6 md:right-6"
          title="Ask Cat about this page"
        >
          <Cat className="h-6 w-6" />
        </button>
      )}

      {open && (
        <>
          {/* Backdrop (mobile emphasis; desktop keeps the page visible behind). */}
          <div
            className="fixed inset-0 z-40 bg-black/40 sm:bg-black/20"
            onClick={() => setOpen(false)}
            aria-hidden
          />

          <aside
            role="dialog"
            aria-label="Cat"
            className={cn(
              'fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-surface-page shadow-2xl',
              'sm:w-[420px] sm:border-l sm:border-default'
            )}
          >
            <header className="flex items-center justify-between border-b border-default px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-accent-warm/10 text-accent-warm">
                  <Cat className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-fg-primary">Cat</p>
                  {page?.label && (
                    <p className="truncate text-xs text-fg-tertiary">Looking at {page.label}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Link
                  href={ROUTES.DASHBOARD.CAT}
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-fg-secondary transition-colors hover:bg-surface-raised hover:text-fg-primary"
                  title="Open the full Cat"
                  aria-label="Open the full Cat page"
                >
                  <Maximize2 className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-fg-secondary transition-colors hover:bg-surface-raised hover:text-fg-primary"
                  aria-label="Close Cat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            <div className="oc-chat-layout min-h-0 flex-1">
              <ModernChatPanel
                variant="focus"
                conversationId={conversationId}
                onConversationCreated={setConversationId}
                pageContext={page}
                className="min-h-0 flex-1"
              />
            </div>
          </aside>
        </>
      )}
    </>
  );
}
