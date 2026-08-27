/**
 * The hosted-site renderer — one route for every page of every hosted site.
 *
 * A visitor on substrata.orangecat.ch never sees this path: middleware rewrote
 * their request here while their URL bar kept saying substrata.orangecat.ch.
 * The path form stays reachable on any host so a site can be previewed before
 * its DNS exists, which is also how the tests and screenshots reach it.
 *
 * A catch-all rather than one file per page, because the pages are data
 * (src/config/site-content.ts). Adding a page to a hosted site is adding an
 * entry to that site's builder — never a new route file. Adding a WHOLE SITE is
 * a row in the database and no code at all.
 *
 * This is also the layer that is allowed to ask whether a site exists. The
 * middleware matched a shape; `siteBySlug` is what turns that into an answer,
 * and it reads as an anonymous visitor so RLS decides "published", not this file.
 */

import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ALWAYS_PUBLISHED, HOSTED_SITE_FALLBACKS, siteCanonicalHost } from '@/config/hosted-site';
import {
  pageRendersOwnHeader,
  siteChromeFor,
  siteNavItems,
  sitePageAt,
  sitePagesFor,
} from '@/config/site-content';
import { siteBySlug, type ResolvedSite } from '@/services/sites/registry';
import { SiteFooter, SiteMasthead } from '@/components/sites/SiteChrome';
import { SiteSections } from '@/components/sites/SiteSections';

interface RouteParams {
  params: Promise<{ site: string; path?: string[] }>;
}

/**
 * Pre-render the sites whose content lives in the repository.
 *
 * Only those: a database-backed site cannot be enumerated at build time without
 * making the build depend on a reachable database, and a customer who publishes
 * at 14:00 should not wait for a deploy. Those render on first request and are
 * held by `siteBySlug`'s cache, which is what `dynamicParams` allows.
 */
export function generateStaticParams(): Array<{ site: string; path?: string[] }> {
  return ALWAYS_PUBLISHED.flatMap(slug => {
    const site = HOSTED_SITE_FALLBACKS[slug];
    return site
      ? sitePagesFor(site, null).map(page => ({
          site: slug,
          path: page.path ? [page.path] : [],
        }))
      : [];
  });
}

async function resolve(slug: string, path?: string[]) {
  const resolved: ResolvedSite | null = await siteBySlug(slug);
  if (!resolved) {
    return null;
  }
  const pages = sitePagesFor(resolved.site, resolved.profile);
  const currentPath = (path ?? []).join('/');
  const page = sitePageAt(pages, currentPath);
  const chrome = siteChromeFor(resolved.site, resolved.profile);
  if (!page || !chrome) {
    return null;
  }
  return { site: resolved.site, pages, page, chrome, currentPath };
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { site: slug, path } = await params;
  const resolved = await resolve(slug, path);
  if (!resolved) {
    return {};
  }
  const { site, page } = resolved;
  const title = page.path ? `${page.title} — ${site.title}` : site.title;
  return {
    // `absolute` breaks the root layout's "%s | OrangeCat" template. On
    // substrata.orangecat.ch the browser tab has no business advertising the
    // host — the visitor is on Substrata's site, not on ours.
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
  const resolved = await resolve(slug, path);

  if (!resolved) {
    notFound();
  }

  const { site, pages, page, chrome, currentPath } = resolved;

  return (
    <div className="flex min-h-screen flex-col bg-surface-page">
      <SiteMasthead
        site={site}
        chrome={chrome}
        navItems={siteNavItems(pages)}
        currentPath={currentPath}
      />

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
