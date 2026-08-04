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

import { usePathname } from 'next/navigation';
import { ArrowDownLeft, ArrowUpRight, HandCoins } from 'lucide-react';
import { SegmentedControl, type SegmentedItem } from '@/components/ui/SegmentedControl';
import { ROUTES } from '@/config/routes';

const TABS: readonly SegmentedItem<string>[] = [
  { value: ROUTES.RECEIVE, href: ROUTES.RECEIVE, label: 'Receive', icon: ArrowDownLeft },
  { value: ROUTES.SEND, href: ROUTES.SEND, label: 'Send', icon: ArrowUpRight },
  { value: ROUTES.REQUESTS, href: ROUTES.REQUESTS, label: 'Request', icon: HandCoins },
];

export function MoneyTabs({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <SegmentedControl
      className={className}
      label="Money"
      items={TABS}
      value={pathname ?? ''}
    />
  );
}
