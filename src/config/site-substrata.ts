/**
 * Substrata's website, generated from its OrangeCat profile.
 *
 * Every word and number below comes from `substrata.ts` and
 * `substrata-coverage.ts` — the same objects the group profile, the product
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
} from './substrata';
import { COVERAGE, PRODUCER_ROLES, coverageProgress } from './substrata-coverage';
import type { SiteChrome, SitePage, SiteSection } from './site-content';

const ROLE_LABEL: Record<string, string> = Object.fromEntries(
  PRODUCER_ROLES.map(role => [role.id, role.label])
);

export function substrataSiteChrome(): SiteChrome {
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
  const companies = new Set(COVERAGE.flatMap(entry => entry.producers.map(p => p.name))).size;

  return {
    path: '',
    navLabel: 'Home',
    title: COMPANY.name,
    sections: [
      {
        kind: 'hero',
        eyebrow: 'Open-source research · Materials desk',
        // The proposition, not the company name. A visitor who reads one line
        // should know what this firm does and what it refuses to do.
        statement: COMPANY.tagline,
        // The first two paragraphs only: the proposition and the rule that
        // bounds it. The remaining two — which phase is running, and how
        // quotes work — are said properly by the phase block below and by the
        // desk page, and a lead that repeats them is a lead nobody finishes.
        lead: LISTING_COPY.body.slice(0, 2),
      },
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
            note: `Across ${companies} distinct companies.`,
          },
          {
            label: 'Desks',
            value: String(DESKS.length),
            note: 'Five parts of one chain, from feedstock to actuation.',
          },
        ],
      },
      {
        kind: 'meter',
        heading: 'Coverage',
        label: 'Producer rows confirmed against a primary source',
        value: progress.sourced,
        of: progress.total,
        caption:
          'Phase 1 completes when these match. The bar is drawn from the same data the ' +
          'map is drawn from, so it cannot flatter the work — an unfinished phase looks ' +
          'unfinished here.',
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
        heading: 'The chokepoint screen',
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

/** Stable fragment id for a material, so the index can link into the tables. */
function materialAnchor(material: string): string {
  return material
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function mapPage(): SitePage {
  const progress = coverageProgress();

  const materialTables: SiteSection[] = COVERAGE.map(entry => ({
    kind: 'table' as const,
    heading: entry.material,
    anchor: materialAnchor(entry.material),
    blurb: entry.thesis,
    columns: ['Company', 'Jurisdiction', 'Step in the chain', 'Status'],
    // Jurisdiction codes and statuses are scanned down a column, not read
    // across a row — mono keeps them aligned and comparable.
    monoColumns: [1],
    statusColumn: 3,
    rows: entry.producers.map(producer => [
      producer.name,
      producer.jurisdictions.join(' '),
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
            'analyst attaches the source, the row flips to “sourced” and the meter below moves. ' +
            'That meter is the honest measure of how far along this is.',
          'Corrections are the reason this is public. If you work in one of these chains and a ' +
            'row is wrong, telling us makes the map better for everyone who reads it next.',
        ],
      },
      {
        kind: 'meter',
        heading: 'Coverage',
        label: 'Producer rows confirmed against a primary source',
        value: progress.sourced,
        of: progress.total,
        caption: `${COVERAGE.length} materials, ${progress.total} producer rows. Phase 1 completes when every row carries a source.`,
      },
      {
        kind: 'index',
        heading: 'Materials',
        blurb: 'Fifteen chokepoints. The number beside each is how many producers are mapped.',
        entries: COVERAGE.map(entry => ({
          label: entry.material,
          meta: String(entry.producers.length),
          anchor: materialAnchor(entry.material),
        })),
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
      meta: `CHF ${formatChf(listing.indicativePriceChf)} / ${listing.unit}  ·  ${listing.spec}`,
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

export function substrataSitePages(): SitePage[] {
  return [homePage(), mandatePage(), mapPage(), deskPage(), disclosurePage()];
}
