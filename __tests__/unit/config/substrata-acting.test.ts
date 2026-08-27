/**
 * The regulatory line, held by tests rather than by good intentions.
 *
 * This is the part of the site with real legal exposure. Substrata is not
 * registered anywhere, so three things have to stay true, and all three are the
 * kind that erode quietly: a helpful sentence gets personalised, a partner list
 * appears because somebody offered a fee, or the page starts telling people
 * what to do because that is what readers keep asking for.
 *
 * Nothing here checks taste. Each test corresponds to a specific way a
 * publisher becomes a regulated intermediary without noticing.
 */

import {
  ACTING_LIMITS,
  ACTION_ROUTES,
  INVESTMENT_THESIS,
  READINESS,
  READINESS_STATUS_LABEL,
  readinessProgress,
} from '@/config/substrata-acting';
import { siteBySlug } from '@/config/sites';
import { sitePageAt, sitePagesFor } from '@/config/site-content';

const site = siteBySlug('substrata')!;
const actingPage = sitePageAt(site, 'acting');
const everything = JSON.stringify(sitePagesFor(site));

describe('Substrata — the limits are stated, not assumed', () => {
  it('says on the page what the firm does and does not do', () => {
    const text = JSON.stringify(actingPage);
    expect(text).toContain('does not manage money');
    expect(text).toContain('paid nothing by any participant');
  });

  it('keeps the unpaid rule, which is what makes the directory worth reading', () => {
    // A directory somebody bought their way into is an advertisement wearing a
    // table's clothes. This sentence is the difference.
    expect(ACTING_LIMITS.join(' ')).toContain('paid nothing by any participant');
    expect(ACTING_LIMITS.join(' ')).toContain('before the arrangement starts');
  });
});

describe('Substrata — routes describe markets, they do not recommend', () => {
  it('gives every route a provider category, a limitation, and questions to ask', () => {
    for (const route of ACTION_ROUTES) {
      expect(route.providedBy.length).toBeGreaterThan(0);
      // The omission is the real risk on a page like this: a reader taking a
      // commodity ETF as exposure to a seven-nines grade has been misled by
      // what nobody said.
      expect(route.doesNotGive.length).toBeGreaterThan(0);
      expect(route.ask.length).toBeGreaterThan(0);
    }
  });

  it('names no individual firm as a route provider', () => {
    for (const route of ACTION_ROUTES) {
      expect(route.providedBy).not.toMatch(/\b(Ltd|AG|GmbH|Inc|LLC|PLC|S\.A\.)\b/);
    }
  });

  it('uses no directive or personalised language anywhere on the site', () => {
    // Impersonal and general is what keeps publishing on the publishing side
    // of the line. These phrasings are how that slips.
    for (const phrase of [
      'we recommend',
      'you should buy',
      'we advise',
      'best investment',
      'guaranteed',
      'risk-free',
    ]) {
      expect(`${phrase}: ${everything.toLowerCase().includes(phrase)}`).toBe(`${phrase}: false`);
    }
  });
});

describe('Substrata — the thesis is scoreable', () => {
  it('gives every claim a falsifier, or it is a slogan', () => {
    expect(INVESTMENT_THESIS.length).toBeGreaterThanOrEqual(4);
    for (const claim of INVESTMENT_THESIS) {
      expect(claim.claim.length).toBeGreaterThan(0);
      expect(claim.detail.length).toBeGreaterThan(0);
      expect(claim.falsifier.length).toBeGreaterThan(0);
    }
  });

  it('publishes every claim and its falsifier on the site', () => {
    const thesis = JSON.stringify(sitePageAt(site, 'thesis'));
    for (const claim of INVESTMENT_THESIS) {
      expect(thesis).toContain(claim.claim);
      expect(thesis).toContain(claim.falsifier);
    }
  });
});

describe('Substrata — the readiness ledger cannot flatter itself', () => {
  it('uses only known statuses, each with a label the site can print', () => {
    for (const item of READINESS) {
      expect(Object.keys(READINESS_STATUS_LABEL)).toContain(item.status);
      expect(item.detail.length).toBeGreaterThan(0);
    }
  });

  it('counts what is actually done, not what is planned', () => {
    const progress = readinessProgress();
    expect(progress.total).toBe(READINESS.length);
    expect(progress.done).toBe(READINESS.filter(item => item.status === 'done').length);
    expect(progress.done).toBeLessThan(progress.total);
  });

  it('still lists the licence as outstanding — the whole reason for this page', () => {
    const licence = READINESS.find(item => item.id === 'licence');
    expect(licence).toBeDefined();
    expect(licence!.status).not.toBe('done');
  });

  it('shows the ledger and the meter on the site with matching numbers', () => {
    const text = JSON.stringify(actingPage);
    const { done, total } = readinessProgress();
    const meter = actingPage!.sections.find(section => section.kind === 'meter');
    expect(meter).toMatchObject({ value: done, of: total });
    for (const item of READINESS) {
      expect(text).toContain(item.requirement);
    }
  });
});
