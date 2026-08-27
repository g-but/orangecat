/**
 * Substrata — the investment thesis, how a reader can act on it, and the
 * ledger of what standing up a fund would actually require.
 *
 * THE REGULATORY LINE THIS FILE EXISTS TO HOLD
 *
 * People will read this research and want to do something with it. That is the
 * point of publishing it. But Substrata is not registered, licensed or
 * supervised anywhere, and three things follow that no amount of product
 * ambition may erode:
 *
 *  1. NO ADVICE. Publishing an impersonal, generally-circulated view is
 *     research. Telling a particular person what to buy is advice, and advice
 *     is licensed almost everywhere. Nothing here may be personalised.
 *  2. NO EXECUTION. Substrata does not hold client money or assets, does not
 *     receive or transmit orders, and does not arrange deals.
 *  3. NOBODY PAYS TO BE HERE. The participant directory and the routes below
 *     are research output, not placements. Keeping them unpaid is what makes
 *     them worth reading — a directory somebody bought their way into is an
 *     advertisement wearing a table's clothes.
 *
 * So this file holds a stated view, an honest description of the routes by
 * which anyone acts in these markets, the questions worth asking, and a public
 * record of how far the firm is from being able to act on its own behalf.
 *
 * Created: 2026-08-26
 */

// =====================================================================
// THE HARD LIMITS — stated on the page, not just in a footer
// =====================================================================

export const ACTING_LIMITS: readonly string[] = [
  'Substrata publishes research. It does not manage money, hold client assets, ' +
    'execute orders, or take a position in anything it covers.',
  'Everything here is a general view, published to whoever reads it. It is not ' +
    'addressed to you, and it takes no account of your circumstances.',
  'Substrata is paid nothing by any participant in this directory. If that ever ' +
    'changes it will be written here before the arrangement starts.',
];

// =====================================================================
// INVESTMENT THESIS
//
// A view, held in public, impersonal and generally circulated. This is the
// thing a research house is supposed to have and be judged on — and stating it
// plainly is also what makes a track record possible later, since a thesis
// nobody wrote down cannot be scored.
// =====================================================================

export interface ThesisClaim {
  id: string;
  claim: string;
  detail: string;
  /** What would show this to be wrong. A thesis without one is a slogan. */
  falsifier: string;
}

export const INVESTMENT_THESIS: readonly ThesisClaim[] = [
  {
    id: 'bottleneck-migrates',
    claim: 'The bottleneck is rarely where the attention is.',
    detail:
      'Attention, and therefore price, concentrates on the visible layer — the model, ' +
      'the accelerator, the hyperscaler. The binding constraint usually sits one or two ' +
      'layers below it, in a company nobody writes about. The gap between where a chain ' +
      'is priced and where it actually binds is the whole reason to map it.',
    falsifier:
      'If constraints resolved at the visible layer — if compute output tracked chip ' +
      'design announcements rather than packaging, power and tooling — the map would be ' +
      'describing a chain that no longer gates anything.',
  },
  {
    id: 'chokepoints-are-not-commodities',
    claim: 'A chokepoint does not price like a commodity.',
    detail:
      'When both demand and supply are inelastic, price is set by scarcity rather than ' +
      'by cost of production, and it moves in jumps. Cost-plus intuition — the instinct ' +
      'that says a material cannot be worth many times its input cost — systematically ' +
      'misprices exactly the nodes this firm covers.',
    falsifier:
      'Sustained periods where chokepoint prices track production cost, with substitution ' +
      'or new entry arriving fast enough to cap them.',
  },
  {
    id: 'energy-binds-first',
    claim: 'This decade, energy binds before silicon does.',
    detail:
      'Compute is being announced faster than it can be energised. Transformer order ' +
      'books, interconnection queues and turbine slots clear on a slower clock than fab ' +
      'construction, and none of them can be accelerated with capital alone.',
    falsifier:
      'Interconnection queues and transformer lead times shortening while announced ' +
      'datacentre capacity keeps rising — energy ceasing to be the thing that slips.',
  },
  {
    id: 'substitution-is-slow',
    claim: '“There is an alternative” is usually false on the horizon that matters.',
    detail:
      'Qualification is measured in years: a second-source material, tool or resist has ' +
      'to be proven per process, per fab, per application. A substitute that exists in a ' +
      'laboratory and a substitute that is qualified are different facts, and only the ' +
      'second one relieves a constraint.',
    falsifier:
      'Qualification cycles compressing materially — second sources reaching production ' +
      'in quarters rather than years.',
  },
  {
    id: 'concentration-is-political',
    claim: 'Supply concentration is now a policy variable, in both directions.',
    detail:
      'Export controls made geography a first-order term in these chains. That cuts both ' +
      'ways: restriction raises the value of what is restricted, and subsidised ' +
      're-shoring can destroy the scarcity that made a node interesting in the first place.',
    falsifier:
      'A durable de-escalation in which controls are lifted and re-shoring programmes ' +
      'deliver qualified capacity at scale.',
  },
  {
    id: 'the-map-compounds',
    claim: 'The map compounds. A position does not.',
    detail:
      'Any single view can be wrong and is eventually closed. Knowing every qualified ' +
      'producer of a material, and being told when a row is wrong by someone who works ' +
      'in that chain, is an asset that accumulates. That is why the research is ' +
      'published rather than sold, and why it comes before any book.',
    falsifier:
      'The map failing to attract corrections — no practitioner engagement — which would ' +
      'mean it is not compounding, only ageing.',
  },
];

// =====================================================================
// ROUTES — how anyone acts in these markets
//
// Descriptions of market structure, not recommendations, and deliberately
// written to include what each route does NOT give you. A reader who takes a
// commodity ETF for exposure to seven-nines tin has been misled by omission,
// and omission is the failure mode a page like this actually has.
// =====================================================================

export interface ActionRoute {
  id: string;
  name: string;
  /** Who provides it — a category of firm, never a named one. */
  providedBy: string;
  gives: string;
  /** The mismatch between this route and what the research is actually about. */
  doesNotGive: string;
  /** Questions worth putting to any provider before committing. */
  ask: string[];
}

export const ACTION_ROUTES: readonly ActionRoute[] = [
  {
    id: 'listed-equity',
    name: 'Listed equity in the chain',
    providedBy: 'Any regulated broker or bank offering international market access.',
    gives:
      'Exposure to the listed producers, tool makers and refiners that appear in the map — ' +
      'the most accessible route, and the only one most readers will need.',
    doesNotGive:
      'Many of the most concentrated nodes are private, family-held, or listed only ' +
      'domestically in markets a retail account cannot reach. And a listed company is ' +
      'rarely a pure play on the chokepoint you care about; the interesting segment is ' +
      'often a small share of its revenue.',
    ask: [
      'Which exchanges can this account actually reach, and at what cost?',
      'What share of this company’s revenue comes from the segment the research is about?',
      'Is there a foreign-ownership limit or a withholding treatment I should know about?',
    ],
  },
  {
    id: 'commodity-derivatives',
    name: 'Exchange-traded commodity exposure',
    providedBy: 'Brokers offering futures, or issuers of exchange-traded commodities.',
    gives: 'Liquid, transparent exposure to the benchmark grade of a traded metal.',
    doesNotGive:
      'The benchmark grade is almost never the grade this research is about. Exchange ' +
      'tin is not seven-nines tin qualified for an EUV source, and the premium between ' +
      'them is the part that reflects the chokepoint. Rolling a futures position also ' +
      'carries a cost that has nothing to do with the thesis.',
    ask: [
      'What exactly does this contract deliver — which grade, which warehouse?',
      'What has the roll cost been over a horizon like mine?',
      'Is the premium I actually care about visible in this price at all?',
    ],
  },
  {
    id: 'physical',
    name: 'Physical metal',
    providedBy: 'Specialist metals dealers and vaulting or custody providers.',
    gives:
      'The only route that touches the actual grade — and, for an industrial buyer, ' +
      'the one that also solves a supply problem rather than expressing a view.',
    doesNotGive:
      'Liquidity. Assay, storage, insurance, minimum lot sizes and a bid-offer that ' +
      'reflects a genuinely thin market. Several of these materials are export-controlled, ' +
      'which is a licensing question before it is a price question.',
    ask: [
      'What assay and certificate of analysis comes with the lot, and from whom?',
      'Where is it stored, insured by whom, and what does it cost to hold per year?',
      'Who will buy this back from me, and at what discount to today’s price?',
    ],
  },
  {
    id: 'private',
    name: 'Private markets',
    providedBy: 'Licensed placement agents, private funds, and eligibility-gated platforms.',
    gives:
      'Access to the part of the universe that is not listed anywhere — which, for ' +
      'several chokepoints in the map, is the only part there is.',
    doesNotGive:
      'Liquidity, price discovery, or entry on your timetable. Eligibility rules ' +
      '(qualified, professional or accredited investor, depending on jurisdiction) ' +
      'exclude most people by law, not by preference.',
    ask: [
      'Am I eligible for this under my own jurisdiction’s rules — and who verified that?',
      'Is the party introducing this licensed to do so, and how are they paid?',
      'What is the realistic holding period before any liquidity event?',
    ],
  },
  {
    id: 'funds',
    name: 'Thematic funds',
    providedBy: 'Fund managers and the platforms that distribute them.',
    gives: 'Diversified, professionally managed exposure without needing to pick nodes.',
    doesNotGive:
      'Precision. A fund named for a theme frequently holds the visible layer — the ' +
      'large, liquid, widely-owned names — rather than the constrained one. The holdings ' +
      'list settles this in about five minutes, and it is worth the five minutes.',
    ask: [
      'What are the actual top holdings, and do they own the chokepoint or sit next to it?',
      'What is the total cost of ownership, including anything not in the headline fee?',
    ],
  },
  {
    id: 'procurement',
    name: 'Securing supply instead of buying exposure',
    providedBy: 'Your own procurement function, and the producers in the map directly.',
    gives:
      'For a company that consumes any of this, the highest-return action is usually not ' +
      'an investment at all: qualify a second source, lengthen a contract, or hold ' +
      'strategic stock before the constraint binds. The map is a supplier list as much ' +
      'as it is a research product.',
    doesNotGive:
      'Anything financial. This is an operational decision with operational costs — ' +
      'qualification time, working capital, obsolescence risk.',
    ask: [
      'Which of these producers is already qualified for our process, and which is not?',
      'What would a second source cost in time, not just in price?',
    ],
  },
];

// =====================================================================
// READINESS — the honest distance to becoming the investor
//
// The same discipline as the coverage meter: a checklist that flatters nobody.
// "We are getting everything ready" is a feeling until it is a list with
// statuses, and then it is a plan.
// =====================================================================

export type ReadinessStatus = 'done' | 'in-progress' | 'not-started';

export interface ReadinessItem {
  id: string;
  requirement: string;
  status: ReadinessStatus;
  detail: string;
}

export const READINESS: readonly ReadinessItem[] = [
  {
    id: 'thesis',
    requirement: 'A written, public investment thesis',
    status: 'done',
    detail:
      'Stated above, with a falsifier against each claim, so it can be scored rather ' +
      'than admired.',
  },
  {
    id: 'process',
    requirement: 'A documented research process and coverage universe',
    status: 'in-progress',
    detail:
      'Two tests, a defined universe, and a verification standard that separates leads ' +
      'from findings. Phase 1 is not finished; the meter on the map says by how much.',
  },
  {
    id: 'conflicts',
    requirement: 'Conflicts, personal-dealing and disclosure policy',
    status: 'in-progress',
    detail:
      'The disclosure rules are written and public. Personal-dealing rules for staff, ' +
      'and the compliance function to enforce them, are not.',
  },
  {
    id: 'track-record',
    requirement: 'A timestamped, independently checkable track record',
    status: 'not-started',
    detail:
      'The single hardest one to fake and the slowest to acquire. It starts accruing the ' +
      'day published calls carry dates nobody can quietly edit.',
  },
  {
    id: 'entity',
    requirement: 'Legal entity, domicile and governance',
    status: 'not-started',
    detail: 'Structure follows the regulatory pathway, so it waits on the next line.',
  },
  {
    id: 'licence',
    requirement: 'Regulatory pathway chosen and licence obtained',
    status: 'not-started',
    detail:
      'Managing third-party money is licensed activity. The options — an asset-manager ' +
      'licence, operating under a licensed manager, or a structure that stays below a ' +
      'threshold — have materially different costs and timelines, and none is quick.',
  },
  {
    id: 'onboarding',
    requirement: 'Investor eligibility, KYC and AML onboarding',
    status: 'not-started',
    detail:
      'Eligibility is a legal test, not a checkbox. This is also where the portal stops ' +
      'being an account and starts being a regulated record.',
  },
  {
    id: 'custody',
    requirement: 'Custody, execution and administration relationships',
    status: 'not-started',
    detail: 'Somebody independent has to hold the assets and strike the valuations.',
  },
  {
    id: 'reporting',
    requirement: 'Valuation and investor reporting policy',
    status: 'not-started',
    detail: 'How positions are marked, how often, and by whom — agreed before the first one.',
  },
];

export interface ReadinessProgress {
  total: number;
  done: number;
  inProgress: number;
}

export function readinessProgress(): ReadinessProgress {
  return {
    total: READINESS.length,
    done: READINESS.filter(item => item.status === 'done').length,
    inProgress: READINESS.filter(item => item.status === 'in-progress').length,
  };
}

export const READINESS_STATUS_LABEL: Record<ReadinessStatus, string> = {
  done: 'Done',
  'in-progress': 'In progress',
  'not-started': 'Not started',
};
