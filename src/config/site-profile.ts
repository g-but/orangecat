/**
 * The default website: a group profile, rendered as pages.
 *
 * This file is the answer to "how many clicks to turn a project into a site".
 * The answer is one — the switch in FleetCrown that writes `feature_key='site'`
 * — and this is why: everything the site shows is something the group already
 * filled in to have a profile at all. No wizard, no page builder, no second
 * place to type the description. If the profile is good, the website is good.
 *
 * A bespoke builder (see `BESPOKE_BUILDERS`) exists for content that is not
 * profile-shaped, like Substrata's research corpus. That is the exception. This
 * is the path every ordinary customer takes, and it costs zero lines of code
 * per customer, which is the whole design.
 *
 * Pure: a function of the profile snapshot it is handed. No database, no fetch,
 * no clock — so the tests state exactly what a given profile renders as.
 */

import type { SiteChrome, SitePage, SiteSection } from './site-content';

/** Everything the default site needs from a group. All of it already exists. */
export interface SiteProfile {
  slug: string;
  name: string;
  description: string | null;
  /** Group label: company, cooperative, dao, nonprofit… Used as the eyebrow. */
  label: string | null;
  tags: readonly string[];
  bitcoinAddress: string | null;
  lightningAddress: string | null;
  /** Public address the site advertises. Shown in the footer. */
  canonicalHost: string;
}

/**
 * Split a description into paragraphs.
 *
 * A profile description is a textarea, so the only structure it reliably has is
 * blank lines. Anything cleverer would be guessing at markup the author never
 * wrote.
 */
function paragraphs(text: string | null): string[] {
  if (!text) {
    return [];
  }
  return text
    .split(/\n\s*\n/)
    .map(part => part.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

/** Sentence-case a label like `network_state` for display. */
function labelText(label: string | null): string | undefined {
  if (!label) {
    return undefined;
  }
  const words = label.replace(/_/g, ' ').trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : undefined;
}

export function profileSiteChrome(profile: SiteProfile): SiteChrome {
  const lead = paragraphs(profile.description)[0] ?? '';
  return {
    name: profile.name,
    // The chrome's tagline is the first sentence, not the whole description —
    // a masthead is not the place for three paragraphs.
    tagline: lead.split(/(?<=\.)\s/)[0] ?? '',
    footerNote: `${profile.name} publishes this site from its OrangeCat profile.`,
  };
}

/**
 * The pages of a default site.
 *
 * One page, deliberately. A profile does not contain enough distinct material
 * to fill a nav, and an eight-item menu of empty pages is worse than an honest
 * single page. When a profile grows sections worth their own URL — a catalogue,
 * an events list — that is the commit that adds a second page here, for every
 * customer at once.
 */
export function profileSitePages(profile: SiteProfile): SitePage[] {
  const body = paragraphs(profile.description);
  const [lead, ...rest] = body;

  const sections: SiteSection[] = [
    {
      kind: 'hero',
      eyebrow: labelText(profile.label),
      statement: profile.name,
      // The hero carries the opening; the prose below carries the rest. Passing
      // the whole description to both would print it twice.
      lead: lead ? [lead] : [],
    },
  ];

  if (rest.length > 0) {
    sections.push({ kind: 'prose', heading: 'About', paragraphs: rest });
  }

  if (profile.tags.length > 0) {
    sections.push({
      kind: 'stats',
      heading: 'Focus',
      stats: profile.tags.slice(0, 6).map(tag => ({ label: tag, value: '·' })),
    });
  }

  // Only when there is something to pay to. A "Support" heading above an empty
  // block advertises a capability the group has not set up.
  const addresses: Array<{ term: string; detail: string }> = [];
  if (profile.lightningAddress) {
    addresses.push({ term: 'Lightning', detail: profile.lightningAddress });
  }
  if (profile.bitcoinAddress) {
    addresses.push({ term: 'Bitcoin', detail: profile.bitcoinAddress });
  }
  if (addresses.length > 0) {
    sections.push({
      kind: 'definitions',
      heading: 'Support',
      blurb: `Send to ${profile.name} directly.`,
      items: addresses,
    });
  }

  return [
    {
      path: '',
      // No navLabel: a one-page site has nothing to navigate between, and a nav
      // holding a single "Home" link is furniture.
      title: profile.name,
      sections,
    },
  ];
}
