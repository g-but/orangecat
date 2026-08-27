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
  CHOKEPOINT_TEST,
  COMPANY,
  DISCLOSURE,
  EXCLUSION_RULE,
  LISTING_COPY,
  MANDATE_CURVES,
  MATERIALS,
  NODE_TYPES,
  PHASES,
  SCOPE,
  areaFor,
} from './substrata';
import {
  ACTING_LIMITS,
  ACTION_ROUTES,
  INVESTMENT_THESIS,
  PARTNERS,
  PARTNER_INTRODUCTIONS_ENABLED,
  READINESS,
  READINESS_STATUS_LABEL,
  readinessProgress,
} from './substrata-acting';
import {
  CHOKEPOINTS,
  COVERAGE,
  NODE_TYPE_LABEL,
  PRODUCER_ROLES,
  chokepointProgress,
  coverageProgress,
} from './substrata-coverage';
import type { SiteChrome, SitePage, SiteSection } from './site-content';

const ROLE_LABEL: Record<string, string> = Object.fromEntries(
  PRODUCER_ROLES.map(role => [role.id, role.label])
);

export function substrataSiteChrome(): SiteChrome {
  return {
    name: COMPANY.name,
    tagline: COMPANY.tagline,
    footerNote:
      `${COMPANY.name} publishes research. It does not trade, broker or quote, holds no ` +
      'position in anything it covers, and nothing here is an offer or investment advice. ' +
      'Rows marked unverified are research leads, not findings.',
  };
}

// =====================================================================
// HOME
// =====================================================================

function homePage(): SitePage {
  const progress = coverageProgress();
  const activePhases = PHASES.filter(phase => phase.status === 'active');
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
            label: 'Materials covered',
            value: String(MATERIALS.length),
            note: 'Each one a chokepoint, not a commodity.',
          },
          {
            label: 'Producers identified',
            value: String(progress.total),
            note: `Across ${companies} distinct companies.`,
          },
          {
            label: 'Non-material chokepoints',
            value: String(CHOKEPOINTS.length),
            note: 'Tools, capacity, queues and know-how that gate the same curves.',
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
        kind: 'definitions',
        heading: 'Running now',
        blurb:
          'Two phases at once. A desk is not one of them — see Disclosure for what this ' +
          'firm does and does not do.',
        items: activePhases.map(phase => ({ term: phase.label, detail: phase.detail })),
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

  // The material's own research — why it gates, and which grade actually ships
  // — used to live on the desk page. With no desk there is no desk page, and
  // that content belongs here anyway: it is research, not a product listing.
  const materialById = new Map(MATERIALS.map(material => [material.title, material]));

  const materialTables: SiteSection[] = COVERAGE.map(entry => {
    const material = materialById.get(entry.material);
    return {
      kind: 'table' as const,
      heading: entry.material,
      anchor: materialAnchor(entry.material),
      blurb: material
        ? `${entry.thesis} Traded grade: ${material.spec} · ${areaFor(material).name}`
        : entry.thesis,
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
    };
  });

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
// CHOKEPOINTS BEYOND MATERIALS
// =====================================================================

function chokepointsPage(): SitePage {
  const progress = chokepointProgress();

  // Cards, not a table. A table of names and country codes scans nicely and
  // says nothing — the claim IS the reason it gates, and a research page that
  // hides its reasoning behind a tidy grid has published a list, not research.
  const byCurve = MANDATE_CURVES.map(curve => ({
    kind: 'cards' as const,
    heading: curve.label,
    blurb: curve.detail,
    columns: 2 as const,
    cards: CHOKEPOINTS.filter(point => point.curve === curve.id).map(point => ({
      title: point.name,
      body: point.why,
      meta: [
        NODE_TYPE_LABEL[point.type],
        point.jurisdictions.length ? point.jurisdictions.join(' ') : 'Not geographic',
        point.source ? 'Sourced' : 'Unverified lead',
      ].join('  ·  '),
    })),
  }));

  return {
    path: 'chokepoints',
    navLabel: 'Chokepoints',
    title: 'Chokepoints',
    intro: 'The constraints that are not materials — and often are the tighter ones.',
    sections: [
      {
        kind: 'prose',
        paragraphs: [
          'A material is only one kind of chokepoint. For the compute and power curves it ' +
            'is frequently not the binding one: a lithography tool with a single supplier, ' +
            'packaging capacity allocated years before it is used, a transformer order ' +
            'book, an interconnection queue, and process knowledge that does not transfer ' +
            'when a competitor buys the same equipment all gate the same three curves — ' +
            'and none of them appears on a periodic table.',
          'They enter coverage on exactly the tests a material does: does it move a curve, ' +
            'and does it genuinely gate it. The unit of coverage was never the substance. ' +
            'It is the constraint.',
          'Each row claims what the node is and why it gates, and nothing about capacity, ' +
            'market share or price — the same rule as the producer map, for the same ' +
            'reason. Rows read “unverified lead” until an analyst attaches a primary source.',
        ],
      },
      {
        kind: 'stats',
        heading: 'The universe so far',
        stats: [
          { label: 'Materials', value: String(MATERIALS.length) },
          { label: 'Non-material chokepoints', value: String(progress.total) },
          {
            label: 'Kinds of node',
            value: String(new Set(CHOKEPOINTS.map(point => point.type)).size),
            note: 'Machines, processes, companies and people.',
          },
        ],
      },
      {
        kind: 'meter',
        heading: 'Verification',
        label: 'Chokepoint rows confirmed against a primary source',
        value: progress.sourced,
        of: progress.total,
        caption:
          'Newer than the producer map and further from finished. Published anyway, ' +
          'because a lead somebody can correct is worth more than a note nobody sees.',
      },
      ...byCurve,
    ],
  };
}

// =====================================================================
// THESIS
// =====================================================================

function thesisPage(): SitePage {
  return {
    path: 'thesis',
    navLabel: 'Thesis',
    title: 'Thesis',
    intro: 'What we think follows from the map — stated so it can be scored, not admired.',
    sections: [
      {
        kind: 'prose',
        paragraphs: [
          'A research house is supposed to have a view and be judged on it. Each claim ' +
            'below carries a falsifier: the thing that, if observed, would show it to be ' +
            'wrong. A thesis without one is a slogan, and a slogan cannot be scored.',
          'This is a general view published to whoever reads it. It is not advice, it is ' +
            'not addressed to anyone in particular, and it takes no account of your ' +
            'circumstances — see Acting on it for what that does and does not permit.',
        ],
      },
      ...INVESTMENT_THESIS.map(claim => ({
        kind: 'definitions' as const,
        heading: claim.claim,
        blurb: claim.detail,
        items: [{ term: 'What would prove this wrong', detail: claim.falsifier }],
      })),
    ],
  };
}

// =====================================================================
// ACTING ON IT
// =====================================================================

function actingPage(): SitePage {
  const progress = readinessProgress();

  return {
    path: 'acting',
    navLabel: 'Acting on it',
    title: 'Acting on it',
    intro: 'What you can do with this research, and what we are not allowed to do for you.',
    sections: [
      {
        kind: 'definitions',
        heading: 'Read this first',
        blurb:
          'People read research and want to act on it — that is why it is published. But ' +
          'the line between publishing a view and advising a person is a legal one, and ' +
          'this firm sits firmly on the publishing side of it.',
        items: ACTING_LIMITS.map((limit, index) => ({
          term: `Limit ${index + 1}`,
          detail: limit,
        })),
      },
      {
        kind: 'prose',
        heading: 'Why there is no referral list',
        paragraphs: [
          'The obvious thing to build here is a list of brokers and dealers we send ' +
            'people to. The reason there is not one yet is that taking a fee for an ' +
            'introduction is precisely what turns a publisher into a regulated ' +
            'intermediary — an introducing broker, a tied agent, a finder — in ' +
            'Switzerland, the EU and the United States alike. Being unpaid is not a ' +
            'detail of that arrangement; it is the whole of what keeps it on this side ' +
            'of the line.',
          'So what follows is a description of how these markets actually work, and the ' +
            'questions worth putting to whoever you choose. Nobody paid to be described, ' +
            'because nobody is named. If that ever changes — a named partner, an ' +
            'agreement, any consideration at all — it will be written on this page ' +
            'before the arrangement starts.',
        ],
      },
      PARTNER_INTRODUCTIONS_ENABLED && PARTNERS.length > 0
        ? {
            kind: 'table' as const,
            heading: 'Firms we can introduce you to',
            blurb: 'Each holds the licence named beside it. We are paid nothing by any of them.',
            columns: ['Firm', 'Category', 'Regulated as', 'Where'],
            monoColumns: [3],
            rows: PARTNERS.map(partner => [
              partner.name,
              partner.category,
              partner.regulatedAs,
              partner.jurisdictions.join(' '),
            ]),
          }
        : {
            kind: 'prose' as const,
            heading: 'Firms we can introduce you to',
            paragraphs: [
              'None, today. A name appears here only once there is an executed agreement ' +
                'with that firm and confirmation that making the introduction does not ' +
                'itself require a licence. Volunteering somebody’s name as an endorsement ' +
                'they never agreed to would be the easier thing to do and the wrong one.',
            ],
          },
      ...ACTION_ROUTES.map(route => ({
        kind: 'definitions' as const,
        heading: route.name,
        blurb: route.gives,
        items: [
          { term: 'Who provides it', detail: route.providedBy },
          { term: 'What it does not give you', detail: route.doesNotGive },
          { term: 'Worth asking', detail: route.ask.join(' · ') },
        ],
      })),
      {
        kind: 'prose',
        heading: 'What we can do if you get in touch',
        paragraphs: [
          'We can answer questions about the research: why a node is in the universe, ' +
            'what a grade designation means, who else makes something, what we have and ' +
            'have not verified. We are glad to be told a row is wrong, and that is the ' +
            'most useful message anyone sends us.',
          'We cannot tell you what to buy, how much, or when. Not because of caution but ' +
            'because doing so would be a licensed activity we are not licensed for, and ' +
            'a firm that quietly crosses that line has told you exactly how much its ' +
            'other statements are worth.',
        ],
      },
      {
        kind: 'meter',
        heading: 'Becoming the investor',
        label: 'Requirements met to manage money rather than only publish',
        value: progress.done,
        of: progress.total,
        caption:
          `${progress.done} done, ${progress.inProgress} in progress. Managing third-party ` +
          'money is licensed activity everywhere that matters, and the gap below is real ' +
          'rather than paperwork. It is published for the same reason the coverage meter ' +
          'is: a plan with statuses is a plan, and everything else is a feeling.',
      },
      {
        kind: 'table',
        heading: 'The ledger',
        columns: ['Requirement', 'Status', 'Detail'],
        statusColumn: 1,
        rows: READINESS.map(item => [
          item.requirement,
          READINESS_STATUS_LABEL[item.status],
          item.detail,
        ]),
      },
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
    intro: 'What this firm does, what it does not do, and what it holds.',
    sections: [
      {
        kind: 'definitions',
        heading: 'Today',
        blurb: DISCLOSURE.today,
        items: SCOPE.today.map((rule, index) => ({ term: `Position ${index + 1}`, detail: rule })),
      },
      {
        kind: 'prose',
        heading: 'On the desk that does not exist',
        paragraphs: [
          'Acting on this map rather than only publishing it would mean a regulated book: ' +
            'licensing, compliance, capital and counterparty onboarding, none of it quick ' +
            'and none of it started. It is an intention. Until it is real, no page here ' +
            'carries a price, a lot size or an invitation to deal, because a firm that ' +
            'advertises a capability it does not have has already told you how much its ' +
            'other claims are worth.',
          'The rules below are written now, in advance, for the reason a disclosure policy ' +
            'is only ever credible before it is needed. Written after the first position, ' +
            'every clause reads as a response to something.',
        ],
      },
      {
        kind: 'definitions',
        heading: 'The rules, when there is something to disclose',
        items: DISCLOSURE.rules.map((rule, index) => ({
          term: `Rule ${index + 1}`,
          detail: rule,
        })),
      },
      { kind: 'prose', heading: 'Why it is free', paragraphs: [DISCLOSURE.openByDefault] },
      { kind: 'prose', heading: 'Out of scope', paragraphs: [SCOPE.outOfScope] },
    ],
  };
}

// =====================================================================

export function substrataSitePages(): SitePage[] {
  return [
    homePage(),
    mandatePage(),
    thesisPage(),
    mapPage(),
    chokepointsPage(),
    actingPage(),
    disclosurePage(),
  ];
}
