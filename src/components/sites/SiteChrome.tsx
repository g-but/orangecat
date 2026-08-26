/**
 * Masthead and footer for a hosted site.
 *
 * The visitor is on the site owner's domain, so the chrome is theirs: their
 * name in the masthead, their nav, their footer. The only OrangeCat mark is
 * one quiet line at the bottom saying where this runs and linking to the
 * profile behind it — which is the honest disclosure a hosted site owes, and
 * also the only distribution OrangeCat gets out of hosting it.
 */

import React from 'react';
import Link from 'next/link';
import { ROUTES } from '@/config/routes';
import { siteCanonicalHost, siteHref, type HostedSite } from '@/config/sites';
import type { SiteChrome as SiteChromeSpec, SitePage } from '@/config/site-content';

interface Props {
  site: HostedSite;
  chrome: SiteChromeSpec;
  pages: SitePage[];
  currentPath: string;
}

export function SiteMasthead({ site, chrome, pages, currentPath }: Props) {
  const navPages = pages.filter(page => page.navLabel);

  return (
    <header className="border-b border-subtle bg-surface-base">
      <div className="mx-auto max-w-shell px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 py-5 sm:flex-row sm:items-baseline sm:justify-between">
          <Link href={siteHref(site)} className="group">
            <span className="font-heading tracking-display text-xl font-semibold text-fg-primary">
              {chrome.name}
            </span>
            <span className="ml-3 hidden text-sm text-fg-tertiary sm:inline">{chrome.tagline}</span>
          </Link>

          <nav aria-label="Site" className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {navPages.map(page => {
              const href = siteHref(site, page.path);
              const isCurrent = page.path === currentPath;
              return (
                <Link
                  key={page.path || 'home'}
                  href={href}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={
                    isCurrent
                      ? 'text-sm font-semibold text-fg-primary underline decoration-accent-warm decoration-2 underline-offset-8'
                      : 'text-sm text-fg-secondary transition-colors hover:text-fg-primary'
                  }
                >
                  {page.navLabel}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ site, chrome }: { site: HostedSite; chrome: SiteChromeSpec }) {
  return (
    <footer className="mt-16 border-t border-subtle bg-surface-base">
      <div className="mx-auto max-w-shell px-4 py-10 sm:px-6 lg:px-8">
        <p className="max-w-3xl text-sm leading-relaxed text-fg-secondary">{chrome.footerNote}</p>
        <div className="mt-6 flex flex-col gap-2 border-t border-subtle pt-6 text-xs text-fg-muted sm:flex-row sm:items-center sm:justify-between">
          <span className="font-mono">{siteCanonicalHost(site)}</span>
          <span>
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
