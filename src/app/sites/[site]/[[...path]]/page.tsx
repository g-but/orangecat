/**
 * The hosted-site renderer — one route for every page of every hosted site.
 *
 * A visitor on substrate.orangecat.ch never sees this path: middleware rewrote
 * their request here while their URL bar kept saying substrate.orangecat.ch.
 * The path form stays reachable on any host so a site can be previewed before
 * its DNS exists, which is also how the tests and screenshots reach it.
 *
 * A catch-all rather than one file per page, because the pages are data
 * (src/config/site-content.ts). Adding a page to a hosted site is adding an
 * entry to that site's builder — never a new route file.
 */

import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { HOSTED_SITES, siteBySlug, siteCanonicalHost } from '@/config/sites';
import {
  pageRendersOwnHeader,
  siteChromeFor,
  sitePageAt,
  sitePagesFor,
} from '@/config/site-content';
import { SiteFooter, SiteMasthead } from '@/components/sites/SiteChrome';
import { SiteSections } from '@/components/sites/SiteSections';

interface RouteParams {
  params: Promise<{ site: string; path?: string[] }>;
}

/** Pre-render every page of every hosted site — they are static by nature. */
export function generateStaticParams(): Array<{ site: string; path?: string[] }> {
  return HOSTED_SITES.flatMap(site =>
    sitePagesFor(site).map(page => ({
      site: site.slug,
      path: page.path ? [page.path] : [],
    }))
  );
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { site: slug, path } = await params;
  const site = siteBySlug(slug);
  if (!site) {
    return {};
  }
  const page = sitePageAt(site, (path ?? []).join('/'));
  if (!page) {
    return {};
  }
  const title = page.path ? `${page.title} — ${site.title}` : site.title;
  return {
    // `absolute` breaks the root layout's "%s | OrangeCat" template. On
    // substrate.orangecat.ch the browser tab has no business advertising the
    // host — the visitor is on Substrate's site, not on ours.
    title: { absolute: title },
    description: page.intro,
    openGraph: {
      title,
      description: page.intro,
      siteName: site.title,
      url: `https://${siteCanonicalHost(site)}${page.path ? `/${page.path}` : ''}`,
    },
  };
}

export default async function HostedSitePage({ params }: RouteParams) {
  const { site: slug, path } = await params;
  const site = siteBySlug(slug);
  if (!site) {
    notFound();
  }

  const chrome = siteChromeFor(site);
  const pages = sitePagesFor(site);
  const currentPath = (path ?? []).join('/');
  const page = sitePageAt(site, currentPath);

  if (!chrome || !page) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface-page">
      <SiteMasthead site={site} chrome={chrome} pages={pages} currentPath={currentPath} />

      <main className="flex-1">
        <div className="mx-auto max-w-shell px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          {/* A page either opens with its own hero or gets the standard title
              block — never both. The rule lives in site-content.ts so it holds
              for every hosted site, not just this one. */}
          {!pageRendersOwnHeader(page) && (
            <header className="mb-14 border-b border-subtle pb-10">
              <h1 className="font-heading text-3xl font-semibold tracking-display text-fg-primary sm:text-5xl">
                {page.title}
              </h1>
              {page.intro && (
                <p className="mt-4 max-w-prose text-lg leading-relaxed text-fg-secondary">
                  {page.intro}
                </p>
              )}
            </header>
          )}

          <SiteSections sections={page.sections} />
        </div>
      </main>

      <SiteFooter site={site} chrome={chrome} />
    </div>
  );
}
