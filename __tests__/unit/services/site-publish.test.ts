/**
 * Publishing is one call, so the refusals have to be right in that one call.
 *
 * Every rule here prevents a site that would exist in the database and never
 * answer on the internet — the worst failure mode for this feature, because the
 * button said it worked. A slug that cannot be a DNS label, a slug that already
 * belongs to infrastructure, and a private group whose site RLS would hide from
 * every visitor.
 */

import { publishRefusal, siteAddress, type SiteGroup } from '@/services/sites/publish';

function group(overrides: Partial<SiteGroup> = {}): SiteGroup {
  return { id: 'uuid', name: 'Acme Cooperative', slug: 'acme', is_public: true, ...overrides };
}

describe('what may be published', () => {
  it('publishes an ordinary public group', () => {
    expect(publishRefusal(group())).toBeNull();
  });

  it('refuses a slug that cannot be a DNS label', () => {
    for (const slug of ['-acme', 'acme-', 'ac me', 'acme_co', '']) {
      expect(publishRefusal(group({ slug }))).toMatch(/cannot be a hostname/);
    }
  });

  /**
   * The one that would be a real incident. `supabase.orangecat.ch` is the
   * database; `security.orangecat.ch` under our own certificate is a phish.
   */
  it('refuses a slug that already belongs to infrastructure or invites a phish', () => {
    expect(publishRefusal(group({ slug: 'supabase' }))).toMatch(/reserved/);
    expect(publishRefusal(group({ slug: 'security' }))).toMatch(/reserved/);
    expect(publishRefusal(group({ slug: 'fleetcrown' }))).toMatch(/reserved/);
  });

  it('explains WHY a name is reserved, since the fix depends on it', () => {
    expect(publishRefusal(group({ slug: 'supabase' }))).toContain('database');
  });

  /**
   * The RLS policy only exposes a site whose group is public. Publishing a
   * private group would write a row that every visitor is denied.
   */
  it('refuses a private group rather than publishing a site nobody can load', () => {
    expect(publishRefusal(group({ is_public: false }))).toMatch(/private group/i);
  });
});

describe('where a site lives', () => {
  it('gives the free subdomain, and a preview path that works without DNS', () => {
    expect(siteAddress(group(), {})).toEqual({
      url: 'https://acme.orangecat.ch',
      previewPath: '/sites/acme',
    });
  });

  it('prefers a custom domain once one is configured', () => {
    expect(siteAddress(group(), { customDomain: 'acme.example' }).url).toBe('https://acme.example');
  });

  it('ignores a malformed custom domain rather than advertising it', () => {
    expect(siteAddress(group(), { customDomain: 'not a hostname' }).url).toBe(
      'https://acme.orangecat.ch'
    );
  });
});
