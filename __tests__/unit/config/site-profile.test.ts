/**
 * The default website is the product claim, so these tests hold the claim
 * rather than the implementation.
 *
 * The claim is: a group that filled in a profile already has a website, and
 * turning it on costs one switch and no code. Two things have to be true for
 * that to survive contact with real profiles — it must render something decent
 * from the little a profile guarantees (a name), and it must never invent
 * anything the group did not say. A default site that prints an empty "Support"
 * heading is advertising a capability nobody set up.
 */

import { profileSiteChrome, profileSitePages, type SiteProfile } from '@/config/site-profile';
import { pageRendersOwnHeader, sitePageAt } from '@/config/site-content';

function profile(overrides: Partial<SiteProfile> = {}): SiteProfile {
  return {
    slug: 'acme',
    name: 'Acme Cooperative',
    description: null,
    label: null,
    tags: [],
    bitcoinAddress: null,
    lightningAddress: null,
    canonicalHost: 'acme.orangecat.ch',
    ...overrides,
  };
}

describe('the default site renders from a profile alone', () => {
  it('produces a home page from nothing but a name', () => {
    const pages = profileSitePages(profile());

    expect(pages).toHaveLength(1);
    expect(pages[0].path).toBe('');
    expect(pages[0].title).toBe('Acme Cooperative');
    expect(pageRendersOwnHeader(pages[0])).toBe(true);
    expect(sitePageAt(pages, '')).toBe(pages[0]);
  });

  it('splits the description into a hero lead and an About section', () => {
    const pages = profileSitePages(
      profile({ description: 'We repair things.\n\nFounded 2019.\n\nIn Zürich.' })
    );
    const [hero, about] = pages[0].sections;

    expect(hero).toMatchObject({ kind: 'hero', lead: ['We repair things.'] });
    expect(about).toMatchObject({
      kind: 'prose',
      heading: 'About',
      paragraphs: ['Founded 2019.', 'In Zürich.'],
    });
  });

  it('never prints the same paragraph in both the hero and the prose', () => {
    const pages = profileSitePages(profile({ description: 'One line only.' }));
    const kinds = pages[0].sections.map(section => section.kind);

    expect(kinds).toEqual(['hero']);
  });

  it('omits Support entirely when there is nothing to pay to', () => {
    const sections = profileSitePages(profile()).flatMap(page => page.sections);

    expect(sections.some(section => 'heading' in section && section.heading === 'Support')).toBe(
      false
    );
  });

  it('shows Support only for the addresses the group actually set', () => {
    const sections = profileSitePages(profile({ lightningAddress: 'acme@getalby.com' })).flatMap(
      page => page.sections
    );
    const support = sections.find(
      (section): section is Extract<typeof section, { kind: 'definitions' }> =>
        section.kind === 'definitions'
    );

    expect(support?.items).toEqual([{ term: 'Lightning', detail: 'acme@getalby.com' }]);
  });

  it('gives a one-page site no nav, because a single "Home" link is furniture', () => {
    expect(profileSitePages(profile()).every(page => page.navLabel === undefined)).toBe(true);
  });

  it('takes a masthead tagline from the first sentence, not the whole description', () => {
    const chrome = profileSiteChrome(
      profile({ description: 'We repair things. We have since 2019. Ask us anything.' })
    );

    expect(chrome.name).toBe('Acme Cooperative');
    expect(chrome.tagline).toBe('We repair things.');
  });

  it('survives a profile with no description at all', () => {
    const chrome = profileSiteChrome(profile());

    expect(chrome.name).toBe('Acme Cooperative');
    expect(chrome.tagline).toBe('');
  });
});
