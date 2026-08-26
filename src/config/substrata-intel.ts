/**
 * "Substrata Intel" — OrangeCat-side SSOT
 *
 * An open-source research firm covering the chokepoints between here and a
 * technological singularity, with a trading desk on the materials it knows
 * best. Intelligence is not made of software. It is made of purified tin,
 * neon, polysilicon, ruthenium, transformer steel and rare-earth metal — and
 * behind each of those is a producer, a lead time and a counterparty that
 * almost nobody has written down in public.
 *
 * THE ASSET IS THE MAP, NOT THE BOOK. Trading a commodity and researching a
 * robotics company are the same work: knowing who makes what, at what grade,
 * on what lead time, and who is dependent on them. So the map is the product;
 * the desk is one way to monetise it, and eventually the chain the firm
 * intends to integrate is the chain it already mapped.
 *
 * This file is the single source of truth for the firm's identity, its mandate
 * (the tests that make "focused" a rule rather than a slogan), its phases, its
 * desks, its listed catalogue, and its compliance and disclosure stance. The
 * Phase 1 coverage universe lives next door in `substrata-intel-coverage.ts`. The
 * seed that registers the firm on-platform (scripts/seed-substrata-intel.ts) reads
 * these two files and nothing else.
 *
 * On-platform shape: a `group` with label 'company' (public, so the research
 * and the book are both readable), its own `actors` row of actor_type 'group',
 * and a catalogue of `user_products` owned by that group actor. Ownership
 * follows the Revive My Old Ride convention — the founder's `mao` actor
 * creates it; swap to a dedicated actor by changing FOUNDER_ACTOR_SLUG.
 *
 * Created: 2026-08-26
 */

// =====================================================================
// OWNERSHIP
// =====================================================================

/** Actor slug of the user who founds the firm (created_by + founder seat). */
export const FOUNDER_ACTOR_SLUG = 'mao';

// =====================================================================
// IDENTITY
// =====================================================================

export const COMPANY = {
  name: 'Substrata Intel',
  /** Also the actor slug and the public path: /groups/substrataintel */
  slug: 'substrataintel',
  tagline: 'The chokepoints between here and the singularity, written down in public.',
} as const;

// =====================================================================
// THE MANDATE — first test: which curve does it move?
// =====================================================================

/**
 * Coverage and trading both start here. A node enters the universe only if it
 * sits on the critical path of one of three curves. Everything else — however
 * interesting, however profitable — is out of scope.
 */
export const MANDATE_CURVES = [
  {
    id: 'compute-per-joule',
    label: 'Compute per joule',
    test: 'Does this make a thought cheaper to have?',
    detail:
      'Feedstock, lithography consumables, thermal materials, and the firms ' +
      'that make them — what decides how much computation a watt can buy.',
  },
  {
    id: 'joules-delivered',
    label: 'Joules delivered',
    test: 'Does this get power to where the compute is?',
    detail:
      'Transformer steel, conductors, superconducting tape, the cryogens that ' +
      'keep them cold, and the interconnect queue. A datacentre that cannot ' +
      'be energised is a shed.',
  },
  {
    id: 'actuation',
    label: 'Actuation',
    test: 'Does this give intelligence hands?',
    detail:
      'Permanent-magnet feed, precision drives, additive manufacturing — the ' +
      'step where a model stops advising and starts doing physical work.',
  },
] as const;

export type CurveId = (typeof MANDATE_CURVES)[number]['id'];

// =====================================================================
// THE MANDATE — second test: is it actually a chokepoint?
// =====================================================================

/**
 * Being on a curve is not enough; most of a supply chain is substitutable and
 * therefore uninteresting. A node earns coverage when it GATES a curve. These
 * four factors are the screen, and they are why the universe stays countable
 * as the firm expands from materials into robotics, compute and manufacturing.
 */
export const CHOKEPOINT_TEST = [
  {
    id: 'concentration',
    question: 'How few suppliers actually qualify?',
    detail: 'Qualified is not the same as capable — a producer nobody has certified is not supply.',
  },
  {
    id: 'substitutability',
    question: 'What happens if it disappears — a workaround, or a stop?',
    detail: 'A material with a drop-in replacement is a price story, not a chokepoint.',
  },
  {
    id: 'lead-time',
    question: 'How long from order to delivery, and from decision to new capacity?',
    detail: 'Large power transformers gate more datacentres today than chip supply does.',
  },
  {
    id: 'demand-inelasticity',
    question: 'Can the buyer walk away at any price?',
    detail: 'If the machine does not exist without it, the demand curve is a wall.',
  },
] as const;

/**
 * The exclusion rule, stated plainly because it is the harder half of focus.
 * A firm that will cover anything has no edge, and a desk that will quote
 * anything has no thesis.
 */
export const EXCLUSION_RULE = {
  rule: 'On a curve, and a chokepoint. Fail either test and we neither cover it nor quote it.',
  explainer:
    'We decline business and coverage every week. Not because either is ' +
    'unprofitable, but because a universe that drifts into general commodities ' +
    'and general tech loses the only edge a specialist has: knowing, for a ' +
    'countable number of nodes, every qualified producer, every grade that ' +
    'actually ships, and every lead time that is real rather than quoted.',
} as const;

// =====================================================================
// NODE TYPES — how the universe grows without becoming "everything"
// =====================================================================

/**
 * The unit of coverage is a chokepoint NODE, not an asset class. A node can be
 * a material, a company, a person, a machine or a process — the tests above
 * apply identically to all of them. This is what lets the firm move from rare
 * earths into robotics, AI hardware and additive manufacturing without a
 * change of strategy: you do not decide to cover robotics, you ARRIVE at it by
 * tracing dysprosium downstream. The graph grows by traversal, not by ambition.
 */
export const NODE_TYPES = [
  {
    id: 'material',
    label: 'Material',
    detail: 'A substance with a grade, a purity and a producer.',
  },
  {
    id: 'company',
    label: 'Company',
    detail: 'Public or private. Most of the interesting ones are private.',
  },
  { id: 'person', label: 'Person', detail: 'Where the process knowledge actually lives.' },
  {
    id: 'machine',
    label: 'Machine',
    detail: 'Tools with single-digit annual output and multi-year queues.',
  },
  {
    id: 'process',
    label: 'Process',
    detail: 'Know-how that does not transfer with a purchase order.',
  },
] as const;

export type NodeType = (typeof NODE_TYPES)[number]['id'];

// =====================================================================
// PHASES — research first, trade second, integrate third
// =====================================================================

/**
 * Research leads because it costs nothing but attention, because it IS the
 * sourcing work the desk needs anyway, and because publishing is the
 * distribution engine: put the map out, the people who work in it correct it,
 * and you become the place people check. The research is given away; what is
 * monetised is the position it buys — deal flow, counterparty access, and a
 * view of where the chain is thin.
 */
export const PHASES = [
  {
    id: 'producers-of-the-fifteen',
    label: 'Phase 1 — the producers of the fifteen',
    status: 'active',
    detail:
      'Map every qualified producer of the fifteen materials already on the ' +
      'desk. Mostly private, mostly uncovered: the sell side writes about ' +
      'chip designers, not about who fires crucible-grade quartz. Every ' +
      'profile is simultaneously research and a counterparty for the desk.',
  },
  {
    id: 'one-hop-out',
    label: 'Phase 2 — one hop out',
    status: 'planned',
    detail:
      'From each producer, one hop upstream (their inputs) and one downstream ' +
      '(their buyers). This is where robotics, AI hardware and additive ' +
      'manufacturing enter the universe on their own — as counterparties in a ' +
      'chain already being mapped, not as a new vertical.',
  },
  {
    id: 'desk-beyond-commodities',
    label: 'Phase 3 — the desk beyond commodities',
    status: 'planned',
    detail:
      'Apply the same map to equities, private positions and offtake. The ' +
      'research does not change; only the instrument does.',
  },
  {
    id: 'integration',
    label: 'Phase 4 — integration',
    status: 'planned',
    detail:
      'Take positions in the chain, upstream and downstream. By construction ' +
      'the acquisition pipeline is the coverage universe — you buy into what ' +
      'you already understand better than the seller does.',
  },
] as const;

// =====================================================================
// DESKS
// =====================================================================

export type DeskId = 'lithography' | 'feedstock' | 'thermal' | 'power' | 'actuation';

export interface Desk {
  id: DeskId;
  /** Also the `category` written onto every listing on this desk. */
  name: string;
  curve: CurveId;
  covers: string;
}

export const DESKS: readonly Desk[] = [
  {
    id: 'lithography',
    name: 'Lithography & Optics',
    curve: 'compute-per-joule',
    covers:
      'Consumables the leading-edge fab burns to expose a wafer: EUV droplet ' +
      'tin, excimer and source gases, capping-layer platinum-group metals, ' +
      'fused silica and calcium fluoride optical blanks.',
  },
  {
    id: 'feedstock',
    name: 'Semiconductor Feedstock',
    curve: 'compute-per-joule',
    covers:
      'What a wafer is made of before anything is printed on it: ' +
      'electronic-grade polysilicon, prime wafers, crucible-grade quartz, and ' +
      'the compound-semiconductor metals — gallium, germanium, indium.',
  },
  {
    id: 'thermal',
    name: 'Thermal & Packaging',
    curve: 'compute-per-joule',
    covers:
      'The materials that carry heat away from a die, which is what actually ' +
      'caps rack density: CVD diamond and SiC spreaders, wide-bandgap ' +
      'substrates, two-phase dielectric coolants.',
  },
  {
    id: 'power',
    name: 'Power, Grid & Superconductors',
    curve: 'joules-delivered',
    covers:
      'Grain-oriented electrical steel for transformers, Grade A copper, ' +
      'REBCO superconducting tape, and the helium that keeps superconductors ' +
      'superconducting.',
  },
  {
    id: 'actuation',
    name: 'Actuation & Robotics',
    curve: 'actuation',
    covers:
      'Permanent-magnet feed — didymium and the heavy rare earths that hold ' +
      'coercivity hot — plus the cobalt and precision-drive alloys behind ' +
      'every robot joint.',
  },
] as const;

// =====================================================================
// LISTED CATALOGUE
//
// Prices are INDICATIVE reference levels in CHF for the stated unit — the
// number a counterparty should use to size a budget, not a quote. Real pricing
// is by RFQ against grade, lot size, origin and delivery window, because every
// one of these markets prices that way. The unit is carried in the copy, since
// `user_products` has no unit column.
//
// This list is also the Phase 1 work queue: `substrata-intel-coverage.ts` owes a
// producer map to every title here, and a test enforces the correspondence.
// =====================================================================

export interface MaterialListing {
  /** Product title as it appears on the profile, and the coverage key. */
  title: string;
  desk: DeskId;
  /** Unit the indicative price refers to, e.g. 'kg', 'wafer', 'metre'. */
  unit: string;
  /** Indicative reference price in CHF per `unit`. Must be > 0 (DB CHECK). */
  indicativePriceChf: number;
  /** Why this material is on the critical path — the reason it is listed. */
  why: string;
  /** Grade / form actually traded. */
  spec: string;
  tags: string[];
}

export const CATALOGUE: readonly MaterialListing[] = [
  // ---------- Lithography & Optics ----------
  {
    title: 'High-purity tin, EUV droplet grade',
    desk: 'lithography',
    unit: 'kg',
    indicativePriceChf: 240,
    why: 'Every EUV photon in production today starts as a tin droplet hit by a CO₂ laser. Purity, not tonnage, is the constraint.',
    spec: '7N (99.99999%) tin, shot or ingot, certificate of analysis per lot.',
    tags: ['euv', 'lithography', 'tin', 'high-purity'],
  },
  {
    title: 'Neon, excimer laser grade',
    desk: 'lithography',
    unit: 'm³',
    indicativePriceChf: 120,
    why: 'DUV excimer sources run on neon mixtures. The 2022 squeeze showed how thin and how geographically concentrated that supply is.',
    spec: '≥99.999% neon, cylinder or ISO container, blended mixes to order.',
    tags: ['neon', 'noble-gas', 'duv', 'lithography'],
  },
  {
    title: 'Ruthenium, sputtering and ALD grade',
    desk: 'lithography',
    unit: 'kg',
    indicativePriceChf: 15000,
    why: 'Caps EUV multilayer mirrors and lines advanced interconnect. Annual world supply is a few dozen tonnes, almost all a by-product of other mining.',
    spec: '4N ruthenium, targets or precursor feed, PGM-refiner traceable.',
    tags: ['ruthenium', 'pgm', 'euv', 'interconnect'],
  },

  // ---------- Semiconductor Feedstock ----------
  {
    title: 'Electronic-grade polysilicon',
    desk: 'feedstock',
    unit: 'kg',
    indicativePriceChf: 45,
    why: 'The first material in the chain. Solar-grade will not do: one part per billion of boron changes the device.',
    spec: '11N (99.999999999%) polysilicon chunk or rod, Siemens process.',
    tags: ['polysilicon', 'feedstock', 'wafer', 'high-purity'],
  },
  {
    title: '300 mm prime silicon wafers',
    desk: 'feedstock',
    unit: 'wafer',
    indicativePriceChf: 110,
    why: 'The unit of account for all leading-edge capacity. Every fab expansion is ultimately a wafer-start number.',
    spec: 'Prime polished 300 mm, p-type or n-type, epi to specification.',
    tags: ['wafer', '300mm', 'silicon', 'feedstock'],
  },
  {
    title: 'Crucible-grade high-purity quartz sand',
    desk: 'feedstock',
    unit: 'kg',
    indicativePriceChf: 18,
    why: 'Czochralski crucibles need a quartz purity that comes, in practice, from a very small number of deposits. A genuine single point of failure for the whole industry.',
    spec: 'Inner-layer crucible grade, ≤ 20 ppm total impurities.',
    tags: ['quartz', 'crucible', 'czochralski', 'feedstock'],
  },
  {
    title: 'Gallium, refined',
    desk: 'feedstock',
    unit: 'kg',
    indicativePriceChf: 620,
    why: 'GaN power stages and RF front-ends. A by-product of alumina refining, so supply cannot respond quickly to demand — and it is export-controlled.',
    spec: '4N–7N gallium metal. Export-licence and end-use documentation required.',
    tags: ['gallium', 'gan', 'compound-semiconductor', 'export-controlled'],
  },

  // ---------- Thermal & Packaging ----------
  {
    title: 'CVD synthetic diamond heat spreader',
    desk: 'thermal',
    unit: 'piece',
    indicativePriceChf: 450,
    why: 'The highest thermal conductivity available at any price. Where the die is hot enough that copper has stopped being an answer.',
    spec: 'Polycrystalline CVD diamond, 10 × 10 mm, metallised to specification.',
    tags: ['diamond', 'thermal', 'packaging', 'cvd'],
  },
  {
    title: 'Silicon carbide substrate, 200 mm semi-insulating',
    desk: 'thermal',
    unit: 'wafer',
    indicativePriceChf: 1400,
    why: 'Wide-bandgap power conversion is how a datacentre stops wasting a tenth of its intake as heat in the power train.',
    spec: '200 mm semi-insulating 4H-SiC, micropipe density to specification.',
    tags: ['sic', 'wide-bandgap', 'power', 'substrate'],
  },
  {
    title: 'Two-phase dielectric immersion coolant',
    desk: 'thermal',
    unit: 'litre',
    indicativePriceChf: 95,
    why: 'Air cooling ends somewhere around 50 kW a rack. Immersion is what the next order of magnitude of density runs on.',
    spec: 'Engineered fluid, boiling point matched to the target die temperature.',
    tags: ['immersion', 'cooling', 'datacenter', 'dielectric'],
  },

  // ---------- Power, Grid & Superconductors ----------
  {
    title: 'Grain-oriented electrical steel (GOES)',
    desk: 'power',
    unit: 'kg',
    indicativePriceChf: 3.2,
    why: 'Every megawatt reaching a GPU passes through transformer cores. Lead times on large power transformers, not chip supply, are the binding constraint on many buildouts.',
    spec: 'M3-class grain-oriented silicon steel, coil, coated.',
    tags: ['goes', 'transformer', 'grid', 'electrical-steel'],
  },
  {
    title: 'REBCO superconducting tape, 12 mm',
    desk: 'power',
    unit: 'metre',
    indicativePriceChf: 85,
    why: 'High-field magnets for fusion and for compact motors. The kilometre-per-machine numbers make tape output an industry-level bottleneck.',
    spec: '12 mm REBCO tape, critical current specified at 77 K, self-field.',
    tags: ['rebco', 'superconductor', 'fusion', 'magnets'],
  },
  {
    title: 'Liquid helium (He-4)',
    desk: 'power',
    unit: 'litre',
    indicativePriceChf: 48,
    why: 'Nothing else reaches 4 K at scale. Superconducting magnets and every dilution refrigerator in quantum computing depend on a supply tied to a handful of gas fields.',
    spec: '5N liquid helium, dewar or ISO container, boil-off terms per contract.',
    tags: ['helium', 'cryogenics', 'superconductor', 'quantum'],
  },

  // ---------- Actuation & Robotics ----------
  {
    title: 'Didymium (Nd-Pr) metal, magnet feed',
    desk: 'actuation',
    unit: 'kg',
    indicativePriceChf: 95,
    why: 'The bulk of every NdFeB magnet, and therefore of every robot joint, traction motor and hard-drive actuator.',
    spec: 'Nd-Pr metal ingot, 75/25 nominal, ≥99% RE.',
    tags: ['rare-earth', 'ndfeb', 'magnets', 'robotics'],
  },
  {
    title: 'Dysprosium metal',
    desk: 'actuation',
    unit: 'kg',
    indicativePriceChf: 400,
    why: 'The heavy rare earth that keeps a magnet coercive when the motor gets hot. Small quantities, no substitute, single-country refining.',
    spec: '≥99% dysprosium metal. Export-licence and end-use documentation required.',
    tags: ['dysprosium', 'rare-earth', 'magnets', 'export-controlled'],
  },
];

// =====================================================================
// COMPLIANCE — the reason a focused book stays a legal one
// =====================================================================

/**
 * Several of these materials are dual-use and export-controlled (gallium,
 * germanium, the heavy rare earths, some high-purity metals). A specialist
 * desk cannot be casual about this, and the focus itself is the first control:
 * the mandate admits compute, energy and actuation, and nothing else.
 */
export const COMPLIANCE = {
  screening: [
    'Counterparty and end-user screening against applicable sanctions and ' +
      'denied-party lists before any quote is issued.',
    'End-use and end-user documentation on every export-controlled line; no ' +
      'shipment moves on an unverified end use.',
    'Licence-first: where an export licence is required, it is obtained ' +
      'before the material is committed, not after.',
  ],
  outOfScope:
    'Nothing on the weapons or nuclear-fuel-cycle path is traded, quoted or ' +
    'brokered — that is outside the mandate as well as outside the law we ' +
    'operate under. The three curves are compute, energy and actuation.',
} as const;

// =====================================================================
// DISCLOSURE — installed now because it cannot be retrofitted
// =====================================================================

/**
 * A firm that publishes research, trades the same materials, and intends to
 * eventually own parts of the chain is publishing on its own positions. That
 * is a workable model, but only with a disclosure rule written before the
 * first position exists — afterwards, every rule looks like a response to
 * something. So it is written here, in the same file as the mandate.
 */
export const DISCLOSURE = {
  rules: [
    'Every published note states the firm’s position in what it covers — long, ' +
      'short, flat, brokering, or in negotiation — at time of publication.',
    'Research is never withheld, delayed or softened because the desk holds a ' +
      'position. If those two conflict, the position is the thing that moves.',
    'Nothing is published to move a price the desk is about to trade against. ' +
      'Notes go out on a schedule, not on a fill.',
    'Sources are named. An unsourced claim is marked unverified rather than ' +
      'stated, however confident the analyst is.',
  ],
  openByDefault:
    'The research is free and public. What is monetised is the position the ' +
    'research buys — counterparty access, deal flow, and knowing where the ' +
    'chain is thin — not the research itself.',
} as const;

// =====================================================================
// PUBLIC LISTING COPY
// =====================================================================

export const LISTING_COPY = {
  headline: COMPANY.name,
  subhead: COMPANY.tagline,
  body: [
    'Substrata Intel is an open-source research firm covering the physical ' +
      'chokepoints between here and a technological singularity — and a ' +
      'trading desk on the materials it knows best. The research is free. ' +
      'The map is the product.',
    'A node enters coverage only if it passes two tests: it moves one of ' +
      'three curves — compute per joule, joules delivered, or actuation — and ' +
      'it genuinely gates that curve, on concentration, substitutability, ' +
      'lead time and demand inelasticity. A node can be a material, a ' +
      'company, a person, a machine or a process; the tests do not care. That ' +
      'is how the universe reaches robotics and additive manufacturing ' +
      'without ever becoming "everything": you arrive at them by tracing a ' +
      'chain you were already mapping.',
    'First phase: every qualified producer of the fifteen materials on the ' +
      'desk. The sell side writes about chip designers. Almost nobody writes ' +
      'about who fires crucible-grade quartz, and that is the gap.',
    'Quotes are by RFQ against grade, lot size, origin and delivery window. ' +
      'Listed prices are indicative reference levels for budgeting. ' +
      'Settlement in Bitcoin or in francs, counterparty’s choice.',
  ],
  cta: 'Read the map, or send us an RFQ',
} as const;

// =====================================================================
// GROUP PROFILE PAYLOAD (maps 1:1 to the live `groups` table)
// =====================================================================

export interface CompanyGroupPayload {
  name: string;
  slug: string;
  description: string;
  label: string;
  tags: string[];
  is_public: boolean;
  visibility: 'public' | 'members_only' | 'private';
  governance_preset: string;
}

export const GROUP_PAYLOAD: CompanyGroupPayload = {
  name: COMPANY.name,
  slug: COMPANY.slug,
  description: [LISTING_COPY.subhead, '', ...LISTING_COPY.body].join('\n'),
  label: 'company',
  tags: [
    'research',
    'open-source-research',
    'supply-chain',
    'trading',
    'semiconductors',
    'rare-earths',
    'energy',
    'robotics',
    'singularity',
  ],
  // The 'company' label defaults to members_only. This firm publishes its
  // research and expects counterparties to read the book before sending an
  // RFQ, so both halves have to be readable without an account.
  is_public: true,
  visibility: 'public',
  governance_preset: 'hierarchical',
} as const;

/**
 * Features enabled on creation. `marketplace` is what lets the group list the
 * catalogue. `treasury` is deliberately NOT enabled: GROUP_FEATURES.treasury
 * requires a `bitcoin_address` on the group, and there is no wallet for this
 * firm yet. Enable it in the same commit that adds the address.
 */
export const GROUP_FEATURE_KEYS: readonly string[] = ['marketplace'];

// =====================================================================
// PRODUCT PAYLOADS (map 1:1 to the live `user_products` table)
// =====================================================================

export interface MaterialProductPayload {
  title: string;
  description: string;
  price: number;
  currency: 'CHF';
  product_type: 'physical';
  fulfillment_type: 'manual';
  category: string;
  status: 'active';
  tags: string[];
  /** -1 = not inventory-tracked; these are brokered lots, not stock on a shelf. */
  inventory_count: number;
  show_on_profile: boolean;
}

/**
 * Group thousands with the Swiss apostrophe, so a ruthenium quote reads
 * CHF 15’000 rather than CHF 15000 — at these magnitudes an unseparated
 * number is a misreading waiting to happen. Done by hand rather than with
 * Intl, because this string is asserted in tests and baked into rows the seed
 * writes to the database: it must not vary with the ICU data of whatever
 * machine happens to run the seed.
 */
export function formatChf(amount: number): string {
  const [whole, fraction] = String(amount).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '’');
  return fraction ? `${grouped}.${fraction}` : grouped;
}

const DESK_BY_ID: Record<DeskId, Desk> = DESKS.reduce(
  (acc, desk) => ({ ...acc, [desk.id]: desk }),
  {} as Record<DeskId, Desk>
);

/** @returns the desk a listing belongs to. */
export function deskFor(listing: MaterialListing): Desk {
  return DESK_BY_ID[listing.desk];
}

/** Renders one listing into the row shape `user_products` expects. */
export function toProductPayload(listing: MaterialListing): MaterialProductPayload {
  const desk = deskFor(listing);
  return {
    title: listing.title,
    description: [
      listing.why,
      '',
      `Traded as: ${listing.spec}`,
      `Desk: ${desk.name}`,
      `Indicative reference: CHF ${formatChf(listing.indicativePriceChf)} per ${listing.unit} — ` +
        'a budgeting level, not a quote. Firm pricing by RFQ against grade, lot ' +
        'size, origin and delivery window.',
    ].join('\n'),
    price: listing.indicativePriceChf,
    currency: 'CHF',
    product_type: 'physical',
    fulfillment_type: 'manual',
    category: desk.name,
    status: 'active',
    tags: listing.tags,
    inventory_count: -1,
    show_on_profile: true,
  };
}

export const PRODUCT_PAYLOADS: readonly MaterialProductPayload[] = CATALOGUE.map(toProductPayload);
