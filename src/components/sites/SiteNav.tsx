'use client';

/**
 * The masthead's section nav.
 *
 * A client component for one reason: with eight sections the nav scrolls
 * sideways on a phone, and the active item is frequently off-screen at rest —
 * so a visitor arriving on a deep page sees a row of links with no indication
 * that any of them is the page they are on. Scrolling it into view on mount
 * fixes that, and there is no CSS-only way to do it.
 *
 * Everything else about the masthead stays server-rendered.
 */

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { siteHref } from '@/config/sites';
import type { SiteNavItem } from '@/config/site-content';

interface Props {
  slug: string;
  /**
   * Deliberately NOT `SitePage[]`. See `SiteNavItem` — everything passed to a
   * client component is serialised into the payload of every page it renders on.
   */
  items: SiteNavItem[];
  currentPath: string;
}

export function SiteNav({ slug, items, currentPath }: Props) {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const active = navRef.current?.querySelector('[aria-current="page"]');
    // `nearest` keeps the page itself still — `center` would scroll the whole
    // document to the top of the masthead on every navigation.
    active?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  }, [currentPath]);

  return (
    <nav
      ref={navRef}
      aria-label="Sections"
      className="scrollbar-hide -mx-1 flex flex-nowrap items-center gap-x-1 overflow-x-auto"
    >
      {items.map(item => {
        const isCurrent = item.path === currentPath;
        return (
          <Link
            key={item.path || 'home'}
            href={siteHref(slug, item.path)}
            aria-current={isCurrent ? 'page' : undefined}
            className={[
              'shrink-0 rounded px-2 py-1 font-mono text-xs uppercase tracking-caps transition-colors',
              isCurrent
                ? 'text-fg-primary underline decoration-accent-warm decoration-2 underline-offset-8'
                : 'text-fg-tertiary hover:text-fg-primary',
            ].join(' ')}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
