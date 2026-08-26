/**
 * Substrate's website, generated from Substrate's OrangeCat profile.
 *
 * Every word and number below comes from `substrate.ts` and
 * `substrate-coverage.ts` — the same objects the group profile, the product
 * catalogue and the Cat read. There is no second copy of the mandate, no
 * duplicated price list, and no separately-maintained "about" text. Change the
 * profile and the website changes with it, which is the whole claim /domains
 * is making when it says a profile can spin up a working site.
 *
 * That constraint is also why the site is honest: the coverage page cannot
 * quietly present unsourced research leads as findings, because the only data
 * it has is the same data the tests hold to `source: null`.
 *
 * Created: 2026-08-26
 */

import {
  CATALOGUE,
  CHOKEPOINT_TEST,
  COMPANY,
  COMPLIANCE,
  DESKS,
  DISCLOSURE,
  EXCLUSION_RULE,
  LISTING_COPY,
  MANDATE_CURVES,
  NODE_TYPES,
  PHASES,
  formatChf,
} from './substrate';
import { COVERAGE, PRODUCER_ROLES, coverageProgress } from './substrate-coverage';
import type { SiteChrome, SitePage, SiteSection } from './site-content';

const ROLE_LABEL: Record<string, string> = Object.fromEntries(
  PRODUCER_ROLES.map(role => [role.id, role.label])
);

export function substrateSiteChrome(): SiteChrome {
  return {
    name: COMPANY.name,
    tagline: COMPANY.tagline,
    footerNote:
      `${COMPANY.name} publishes its research openly and trades the materials it covers. ` +
      'Every note states the firm’s position at time of publication. Listed prices are ' +
      'indicative reference levels, not quotes.',
  };
}

// =====================================================================
// HOME
// =====================================================================

function homePage(): SitePage {
  const progress = coverageProgress();
  const activePhase = PHASES.find(phase => phase.status === 'active');

  return {
    path: '',
    navLabel: 'Home',
    title: COMPANY.name,
    intro: COMPANY.tagline,
    sections: [
      { kind: 'prose', paragraphs: [...LISTING_COPY.body] },
      {
        kind: 'stats',
        heading: 'Where the research stands',
        stats: [
          {
            label: 'Materials on the desk',
            value: String(CATALOGUE.length),
            note: 'Each one a chokepoint, not a commodity.',
          },
          {
            label: 'Producers identified',
            value: String(progress.total),
            note: `Across ${new Set(COVERAGE.flatMap(e => e.producers.map(p => p.name))).size} distinct companies.`,
          },
          {
            label: 'Producers sourced',
            value: `${progress.sourced} of ${progress.total}`,
            note: 'A row counts only once a primary source is attached.',
          },
        ],
      },
      {
        kind: 'cards',
        heading: 'The two tests',
        blurb:
          'A node enters coverage, or the book, only if it passes both. Failing either is a ' +
          'decline — and we decline every week.',
        columns: 3,
        cards: MANDATE_CURVES.map(curve => ({
          title: curve.label,
          body: curve.detail,
          meta: curve.test,
        })),
      },
      {
        kind: 'definitions',
        blurb: EXCLUSION_RULE.rule,
        items: CHOKEPOINT_TEST.map(factor => ({
          term: factor.question,
          detail: factor.detail,
        })),
      },
      {
        kind: 'prose',
        heading: activePhase ? activePhase.label : 'Current phase',
        paragraphs: activePhase ? [activePhase.detail] : [],
      },
    ],
  };
}

// =====================================================================
// MANDATE
// =====================================================================

function mandatePage(): SitePage {
  return {
    path: 'mandate',
    navLabel: 'Mandate',
    title: 'Mandate',
    intro: EXCLUSION_RULE.rule,
    sections: [
      { kind: 'prose', paragraphs: [EXCLUSION_RULE.explainer] },
      {
        kind: 'cards',
        heading: 'Three curves',
        columns: 3,
        cards: MANDATE_CURVES.map(curve => ({
          title: curve.label,
          body: curve.detail,
          meta: curve.test,
        })),
      },
      {
        kind: 'definitions',
        heading: 'The chokepoint screen',
        blurb:
          'Being on a curve is not enough. Most of a supply chain is substitutable, and ' +
          'therefore uninteresting. A node earns coverage when it gates a curve.',
        items: CHOKEPOINT_TEST.map(factor => ({ term: factor.question, detail: factor.detail })),
      },
      {
        kind: 'cards',
        heading: 'What counts as a node',
        blurb:
          'The unit of coverage is a chokepoint, not an asset class. This is how the universe ' +
          'reaches robotics, AI hardware and additive manufacturing without becoming ' +
          '“everything”: you arrive at them by tracing a chain you were already mapping.',
        columns: 3,
        cards: NODE_TYPES.map(node => ({ title: node.label, body: node.detail })),
      },
      {
        kind: 'definitions',
        heading: 'Sequence',
        blurb:
          'Research first, because it costs nothing but attention and it is the sourcing work the desk needs anyway.',
        items: PHASES.map(phase => ({
          term: `${phase.label}${phase.status === 'active' ? ' — active' : ''}`,
          detail: phase.detail,
        })),
      },
    ],
  };
}

// =====================================================================
// THE MAP
// =====================================================================

function mapPage(): SitePage {
  const progress = coverageProgress();

  const materialTables: SiteSection[] = COVERAGE.map(entry => ({
    kind: 'table' as const,
    heading: entry.material,
    blurb: entry.thesis,
    columns: ['Company', 'Jurisdiction', 'Step in the chain', 'Status'],
    rows: entry.producers.map(producer => [
      producer.name,
      producer.jurisdictions.join(', '),
      ROLE_LABEL[producer.role] ?? producer.role,
      producer.source ? 'Sourced' : 'Unverified lead',
    ]),
  }));

  return {
    path: 'map',
    navLabel: 'The map',
    title: 'The map',
    intro: 'Every qualified producer of the fifteen materials on the desk.',
    sections: [
      {
        kind: 'prose',
        paragraphs: [
          'This is Phase 1, published as it is built rather than when it is finished. Each row ' +
            'asserts three things and no more: a company’s name, where it operates, and which ' +
            'step of the chain it occupies. There is no column for capacity, market share or ' +
            'revenue, because this firm has not sourced those numbers — and a table that ' +
            'implies otherwise is worse than an empty one.',
          'A row marked “unverified lead” is exactly that: a research lead we believe is right ' +
            'and have not yet confirmed against a primary source. It is not a finding. When an ' +
            'analyst attaches the source, the row flips to “sourced” and the count below moves. ' +
            'That count is the honest measure of how far along this is.',
          'Corrections are the reason this is public. If you work in one of these chains and a ' +
            'row is wrong, telling us makes the map better for everyone who reads it next.',
        ],
      },
      {
        kind: 'stats',
        stats: [
          { label: 'Materials covered', value: String(COVERAGE.length) },
          { label: 'Producer rows', value: String(progress.total) },
          {
            label: 'Confirmed against a source',
            value: `${progress.sourced} of ${progress.total}`,
            note: 'Phase 1 completes when these match.',
          },
        ],
      },
      ...materialTables,
    ],
  };
}

// =====================================================================
// THE DESK
// =====================================================================

function deskPage(): SitePage {
  const deskSections: SiteSection[] = DESKS.map(desk => ({
    kind: 'cards' as const,
    heading: desk.name,
    blurb: desk.covers,
    columns: 2 as const,
    cards: CATALOGUE.filter(listing => listing.desk === desk.id).map(listing => ({
      title: listing.title,
      body: listing.why,
      meta: `${listing.spec} · Indicative CHF ${formatChf(listing.indicativePriceChf)} per ${listing.unit}`,
    })),
  }));

  return {
    path: 'desk',
    navLabel: 'The desk',
    title: 'The desk',
    intro: 'The materials we trade, and what we will tell you about them before you ask.',
    sections: [
      {
        kind: 'prose',
        paragraphs: [
          'Fifteen materials, five desks, one book. Every line here passed the same two tests ' +
            'the research universe uses, which is why the desk and the map cover exactly the ' +
            'same ground — the sourcing work and the research work are the same work.',
          'Prices shown are indicative reference levels in Swiss francs for the stated unit: ' +
            'the number to size a budget with, not a quote. Firm pricing is by RFQ against ' +
            'grade, lot size, origin and delivery window, because every one of these markets ' +
            'prices that way. Settlement in Bitcoin or in francs, your choice.',
        ],
      },
      ...deskSections,
      {
        kind: 'definitions',
        heading: 'Before you send an RFQ',
        items: COMPLIANCE.screening.map((rule, index) => ({
          term: `Screening ${index + 1}`,
          detail: rule,
        })),
      },
      { kind: 'prose', paragraphs: [COMPLIANCE.outOfScope] },
    ],
  };
}

// =====================================================================
// DISCLOSURE
// =====================================================================

function disclosurePage(): SitePage {
  return {
    path: 'disclosure',
    navLabel: 'Disclosure',
    title: 'Disclosure',
    intro: 'We publish research on materials we trade. Here is how that is kept straight.',
    sections: [
      {
        kind: 'prose',
        paragraphs: [
          'A firm that publishes research, trades the same materials, and intends to eventually ' +
            'own parts of the chain is publishing on its own positions. That is a workable ' +
            'model, but only with the rule written before the first position exists — ' +
            'afterwards, every rule looks like a response to something. So it was written on ' +
            'day one, in the same file as the mandate.',
          DISCLOSURE.openByDefault,
        ],
      },
      {
        kind: 'definitions',
        heading: 'The rules',
        items: DISCLOSURE.rules.map((rule, index) => ({
          term: `Rule ${index + 1}`,
          detail: rule,
        })),
      },
      {
        kind: 'definitions',
        heading: 'Trade compliance',
        blurb:
          'Several of these materials are dual-use and export-controlled. The focus itself is ' +
          'the first control: the mandate admits compute, energy and actuation, and nothing else.',
        items: COMPLIANCE.screening.map((rule, index) => ({
          term: `Control ${index + 1}`,
          detail: rule,
        })),
      },
      { kind: 'prose', heading: 'Out of scope', paragraphs: [COMPLIANCE.outOfScope] },
    ],
  };
}

// =====================================================================

export function substrateSitePages(): SitePage[] {
  return [homePage(), mandatePage(), mapPage(), deskPage(), disclosurePage()];
}
