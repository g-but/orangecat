/**
 * "Substrate Materials" — OrangeCat-side SSOT
 *
 * A trading company with exactly one focus: the physical inputs that a
 * technological singularity actually consumes. Intelligence is not made of
 * software. It is made of purified tin, neon, polysilicon, ruthenium,
 * electrical steel and rare-earth metal — and every one of those has a
 * chokepoint, a lead time and a counterparty.
 *
 * This file is the single source of truth for the company's identity, its
 * mandate (the inclusion test that makes "solely focused" a rule rather than a
 * slogan), its desks, its listed catalogue, and its compliance stance. The seed
 * that registers it on-platform (scripts/seed-singularity-materials.ts) reads
 * this file and nothing else, so the copy is written ONCE here and reused by
 * the seed today and by any /groups rendering or Cat context later.
 *
 * On-platform shape: a `group` with label 'company' (public, so the profile is
 * readable by anyone), its own `actors` row of actor_type 'group', and a
 * catalogue of `user_products` owned by that group actor. Ownership follows the
 * same convention as Revive My Old Ride — the founder's `mao` actor creates it;
 * swap to a dedicated actor later by changing FOUNDER_ACTOR_SLUG.
 *
 * Created: 2026-08-26
 */

// =====================================================================
// OWNERSHIP
// =====================================================================

/** Actor slug of the user who founds the company (created_by + founder seat). */
export const FOUNDER_ACTOR_SLUG = 'mao';

// =====================================================================
// IDENTITY
// =====================================================================

export const COMPANY = {
  name: 'Substrate Materials',
  /** Also the actor slug and the public path: /groups/substrate-materials */
  slug: 'substrate-materials',
  tagline: 'The materials intelligence is made of.',
} as const;

// =====================================================================
// THE MANDATE — why this company is "solely focused"
// =====================================================================

/**
 * The inclusion test. A material is traded only if it sits on the critical path
 * of one of three curves. Everything else — however profitable — is declined.
 * This is the whole of the company's strategy; the desks below are just the
 * test applied to five parts of the supply chain.
 */
export const MANDATE_CURVES = [
  {
    id: 'compute-per-joule',
    label: 'Compute per joule',
    test: 'Does this material make a thought cheaper to have?',
    detail:
      'Feedstock, lithography consumables and thermal materials — the inputs ' +
      'that decide how much computation a watt can buy.',
  },
  {
    id: 'joules-delivered',
    label: 'Joules delivered',
    test: 'Does this material get power to where the compute is?',
    detail:
      'Transformer steel, conductors, superconducting tape and the cryogens ' +
      'that keep them cold. A datacentre that cannot be energised is a shed.',
  },
  {
    id: 'actuation',
    label: 'Actuation',
    test: 'Does this material give intelligence hands?',
    detail:
      'Permanent-magnet feed and the metals behind precision drives — the ' +
      'step where a model stops advising and starts doing physical work.',
  },
] as const;

/**
 * The exclusion rule, stated plainly because it is the harder half of focus.
 * A trading desk that will quote anything is a trading desk with no thesis.
 */
export const EXCLUSION_RULE = {
  rule: 'If a material moves none of the three curves, we do not quote it.',
  explainer:
    'We decline business every week. Not because the margin is bad, but ' +
    'because a book that drifts into general commodities loses the only edge ' +
    'a specialist has: knowing, for fifteen materials, every qualified ' +
    'producer, every purity grade that actually ships, and every lead time ' +
    'that is real rather than quoted.',
} as const;

// =====================================================================
// DESKS
// =====================================================================

export type DeskId = 'lithography' | 'feedstock' | 'thermal' | 'power' | 'actuation';

export interface Desk {
  id: DeskId;
  /** Also the `category` written onto every listing on this desk. */
  name: string;
  curve: (typeof MANDATE_CURVES)[number]['id'];
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
// =====================================================================

export interface MaterialListing {
  /** Product title as it appears on the profile. */
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
] as const;

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
// PUBLIC LISTING COPY
// =====================================================================

export const LISTING_COPY = {
  headline: COMPANY.name,
  subhead: COMPANY.tagline,
  body: [
    'Substrate Materials is a trading company with one book: the physical ' +
      'inputs a technological singularity consumes. Not "tech commodities" ' +
      'broadly — the fifteen or so materials that sit on the critical path ' +
      'between a design and a working machine.',
    'A material is listed only if it moves one of three curves: compute per ' +
      'joule, joules delivered, or actuation. Everything else we decline, ' +
      'including business we could profitably do. Focus is the product — for ' +
      'fifteen materials we know every qualified producer, every purity grade ' +
      'that actually ships, and every lead time that is real rather than quoted.',
    'Quotes are by RFQ against grade, lot size, origin and delivery window. ' +
      'Listed prices are indicative reference levels for budgeting. ' +
      'Settlement in Bitcoin or in francs, counterparty’s choice.',
  ],
  cta: 'Send us an RFQ',
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
    'trading',
    'materials',
    'semiconductors',
    'rare-earths',
    'energy',
    'robotics',
    'singularity',
  ],
  // The 'company' label defaults to members_only; a trading counterparty has to
  // be able to read the book before it can send an RFQ, so this one is public.
  is_public: true,
  visibility: 'public',
  governance_preset: 'hierarchical',
} as const;

/**
 * Features enabled on creation. `marketplace` is what lets the group list the
 * catalogue. `treasury` is deliberately NOT enabled: GROUP_FEATURES.treasury
 * requires a `bitcoin_address` on the group, and there is no wallet for this
 * company yet. Enable it in the same commit that adds the address.
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
      `Indicative reference: CHF ${listing.indicativePriceChf} per ${listing.unit} — ` +
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
