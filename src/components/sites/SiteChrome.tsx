/**
 * Masthead and footer for a hosted site.
 *
 * The visitor is on the site owner's domain, so the chrome is theirs: their
 * name, their nav, their footer. The only OrangeCat mark is one quiet line at
 * the bottom saying where this runs and linking to the profile behind it —
 * the honest disclosure a hosted site owes, and the only distribution
 * OrangeCat takes for hosting it.
 *
 * Design notes: the masthead is a rule, not a bar. It sticks so the section
 * nav stays reachable on a long research page, but it carries no shadow, no
 * fill beyond the page's own surface, and no logo — a hairline and a wordmark
 * are enough, and anything heavier competes with the document.
 */

import React from 'react';
import Link from 'next/link';
import { ROUTES } from '@/config/routes';
import { siteHref } from '@/config/sites';
import { siteCanonicalHost, type HostedSite } from '@/config/hosted-site';
import type { SiteChrome as SiteChromeSpec, SiteNavItem } from '@/config/site-content';
import { SiteNav } from './SiteNav';

interface Props {
  site: HostedSite;
  chrome: SiteChromeSpec;
  navItems: SiteNavItem[];
  currentPath: string;
}

export function SiteMasthead({ site, chrome, navItems, currentPath }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-subtle bg-surface-page/85 backdrop-blur">
      <div className="mx-auto max-w-shell px-4 sm:px-6 lg:px-8">
        {/* One row at every width. Wrapping the nav onto a second line made a
            sticky masthead eat a third of a phone screen, so on narrow
            viewports the nav scrolls sideways instead. */}
        <div className="flex items-center justify-between gap-6 py-4">
          <Link href={siteHref(site.slug)} className="shrink-0">
            <span className="font-heading text-lg font-semibold tracking-display text-fg-primary">
              {chrome.name}
            </span>
          </Link>

          <SiteNav slug={site.slug} items={navItems} currentPath={currentPath} />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ site, chrome }: { site: HostedSite; chrome: SiteChromeSpec }) {
  return (
    <footer className="mt-24 border-t border-subtle">
      <div className="mx-auto max-w-shell px-4 py-12 sm:px-6 lg:px-8">
        <p className="max-w-prose text-sm leading-relaxed text-fg-secondary">{chrome.footerNote}</p>
        <div className="mt-8 flex flex-col gap-2 border-t border-subtle pt-6 font-mono text-xs uppercase tracking-caps text-fg-muted sm:flex-row sm:items-center sm:justify-between">
          <span>{siteCanonicalHost(site)}</span>
          <span className="normal-case tracking-normal">
            Hosted on{' '}
            <Link href={ROUTES.HOME} className="underline underline-offset-2 hover:text-fg-primary">
              OrangeCat
            </Link>
            {' · '}
            <Link
              href={`/groups/${site.profile.slug}`}
              className="underline underline-offset-2 hover:text-fg-primary"
            >
              profile
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
