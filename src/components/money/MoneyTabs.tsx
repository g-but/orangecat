'use client';

/**
 * The Receive/Send toggle shared by both money screens.
 *
 * Receiving and sending are two halves of one act, so they get ONE entry in the
 * sidebar and switch between themselves here — rather than two nav rows in a
 * sidebar the founder already found crowded. This mirrors how every consumer
 * money app groups them (Revolut and Wise both have a single "Payments" tab
 * containing both directions).
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { cn } from '@/lib/utils';

const TABS = [
  { href: ROUTES.RECEIVE, label: 'Receive', icon: ArrowDownLeft },
  { href: ROUTES.SEND, label: 'Send', icon: ArrowUpRight },
] as const;

export function MoneyTabs({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <div className={cn('grid grid-cols-2 gap-1 rounded-lg bg-surface-raised p-1', className)}>
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex min-h-11 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors',
              active
                ? 'bg-surface-base text-fg-primary shadow-sm'
                : 'text-fg-secondary hover:text-fg-primary'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
