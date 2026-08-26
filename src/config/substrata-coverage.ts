/**
 * Substrate — Phase 1 coverage universe: the producers of the fifteen.
 *
 * The firm's first research product. For every material on the desk
 * (`substrata.ts` → CATALOGUE), the set of companies that mine, refine,
 * convert or recycle it. Mostly private, mostly uncovered: there is a great
 * deal of published research on chip designers and almost none on who fires
 * crucible-grade quartz or upgrades tin to seven nines.
 *
 * WHAT THIS FILE CLAIMS, AND WHAT IT DELIBERATELY DOES NOT
 *
 * Each entry asserts three things only: a company's name, where it operates,
 * and which step of the chain it occupies. Those are stable, widely documented
 * facts. It asserts NOTHING about capacity, market share, revenue, cost
 * position, or quality — the claims that go stale within a quarter, that move
 * markets when wrong, and that this firm has not yet sourced. There is no
 * field for them on purpose: the structure is the discipline, and the research
 * phase is what adds those numbers, each with a citation.
 *
 * Consequently every entry starts at `source: null`, which reads as UNVERIFIED
 * — a research lead, not a finding. An analyst clears a row by attaching the
 * primary source that confirms the company's role in that material. Coverage
 * progress is measured by how many rows have a source, not by how many rows
 * exist, and `coverageProgress()` below is what reports it.
 *
 * This is the mandate's own rule turned on the firm: an unsourced claim is
 * marked unverified rather than stated, however confident the analyst is.
 *
 * Created: 2026-08-26
 */

import { CATALOGUE } from './substrata';

// =====================================================================
// SHAPE
// =====================================================================

/**
 * Where a company sits in the chain. A single firm can appear on more than one
 * material, and at different steps on each — that overlap is precisely the
 * structure the map exists to expose.
 */
export const PRODUCER_ROLES = [
  {
    id: 'mine',
    label: 'Mine / extract',
    detail: 'Primary extraction, or recovery as a by-product.',
  },
  { id: 'refine', label: 'Refine', detail: 'Purification to the grade the application needs.' },
  {
    id: 'convert',
    label: 'Convert',
    detail: 'Into the form that ships: ingot, wafer, tape, coil, target.',
  },
  { id: 'recycle', label: 'Recycle', detail: 'Secondary supply — often the only elastic source.' },
] as const;

export type ProducerRole = (typeof PRODUCER_ROLES)[number]['id'];

export interface Producer {
  /** Company name as it trades. */
  name: string;
  /** ISO 3166-1 alpha-2 of the operating jurisdiction(s) for this material. */
  jurisdictions: string[];
  role: ProducerRole;
  /**
   * Primary source confirming this company's role in this material.
   * `null` = unverified research lead. Never present an unsourced row as a
   * finding — see the header.
   */
  source: string | null;
}

export interface MaterialCoverage {
  /** Must exactly match a CATALOGUE title in `substrata.ts`. */
  material: string;
  /** What makes this material a chokepoint, in one line — the research thesis. */
  thesis: string;
  producers: Producer[];
}

/** Shorthand: every row starts unverified, because every row starts unsourced. */
function lead(name: string, jurisdictions: string[], role: ProducerRole): Producer {
  return { name, jurisdictions, role, source: null };
}

// =====================================================================
// THE UNIVERSE
// =====================================================================

export const COVERAGE: readonly MaterialCoverage[] = [
  // ---------- Lithography & Optics ----------
  {
    material: 'High-purity tin, EUV droplet grade',
    thesis:
      'Tin metal is not scarce; tin at seven nines, qualified for an EUV source, is. The chokepoint is the upgrading step, not the mine.',
    producers: [
      lead('Yunnan Tin', ['CN'], 'refine'),
      lead('Minsur', ['PE'], 'refine'),
      lead('PT Timah', ['ID'], 'refine'),
      lead('Malaysia Smelting Corporation', ['MY'], 'refine'),
      lead('Indium Corporation', ['US'], 'convert'),
      lead('5N Plus', ['CA', 'DE'], 'convert'),
      lead('Aurubis', ['DE'], 'recycle'),
    ],
  },
  {
    material: 'Neon, excimer laser grade',
    thesis:
      'Neon is separated from air, but economically only alongside large-scale air separation attached to steelmaking — which is why an industrial gas map and a war map turned out to be the same map in 2022.',
    producers: [
      lead('Linde', ['GB', 'US', 'DE'], 'refine'),
      lead('Air Liquide', ['FR'], 'refine'),
      lead('Messer', ['DE'], 'refine'),
      lead('Iceblick', ['UA'], 'refine'),
      lead('Cryoin Engineering', ['UA'], 'refine'),
      lead('Baosteel Gases', ['CN'], 'refine'),
    ],
  },
  {
    material: 'Ruthenium, sputtering and ALD grade',
    thesis:
      'Ruthenium is a by-product of PGM mining, so supply is set by platinum and palladium economics rather than by demand for ruthenium. Refining and target fabrication are separately concentrated.',
    producers: [
      lead('Sibanye-Stillwater', ['ZA'], 'mine'),
      lead('Impala Platinum', ['ZA'], 'mine'),
      lead('Nornickel', ['RU'], 'mine'),
      lead('Heraeus', ['DE'], 'refine'),
      lead('Johnson Matthey', ['GB'], 'refine'),
      lead('Umicore', ['BE'], 'refine'),
      lead('Furuya Metal', ['JP'], 'convert'),
      lead('Tanaka Kikinzoku', ['JP'], 'convert'),
    ],
  },

  // ---------- Semiconductor Feedstock ----------
  {
    material: 'Electronic-grade polysilicon',
    thesis:
      'Solar-grade polysilicon has many producers; electronic-grade has very few, and the gap between the two is measured in orders of magnitude of impurity, not in price.',
    producers: [
      lead('Wacker Chemie', ['DE', 'US'], 'refine'),
      lead('Hemlock Semiconductor', ['US'], 'refine'),
      lead('Tokuyama', ['JP', 'MY'], 'refine'),
      lead('OCI', ['KR', 'MY'], 'refine'),
      lead('Mitsubishi Materials', ['JP'], 'refine'),
      lead('REC Silicon', ['US', 'NO'], 'refine'),
    ],
  },
  {
    material: '300 mm prime silicon wafers',
    thesis:
      'Five firms supply essentially all prime 300 mm wafer capacity. Qualification at a leading-edge fab takes years, so the barrier is certification history rather than capital.',
    producers: [
      lead('Shin-Etsu Handotai', ['JP'], 'convert'),
      lead('SUMCO', ['JP'], 'convert'),
      lead('GlobalWafers', ['TW'], 'convert'),
      lead('Siltronic', ['DE'], 'convert'),
      lead('SK Siltron', ['KR'], 'convert'),
    ],
  },
  {
    material: 'Crucible-grade high-purity quartz sand',
    thesis:
      'The clearest single point of failure in the entire chain: inner-layer crucible quartz comes, in practice, from a very small number of deposits, and every Czochralski puller on earth needs it.',
    producers: [
      lead('The Quartz Corp', ['NO', 'US'], 'mine'),
      lead('Sibelco', ['BE', 'US'], 'mine'),
      lead('Russian Quartz', ['RU'], 'mine'),
      lead('Jiangsu Pacific Quartz', ['CN'], 'refine'),
      lead('Momentive Technologies', ['US'], 'convert'),
      lead('Shin-Etsu Quartz', ['JP'], 'convert'),
      lead('Ferrotec', ['JP', 'CN'], 'convert'),
    ],
  },
  {
    material: 'Gallium, refined',
    thesis:
      'A by-product of alumina refining, so primary supply cannot respond to price. Concentrated in one jurisdiction and under export control since 2023 — the textbook case for why the map matters.',
    producers: [
      lead('Chinalco', ['CN'], 'refine'),
      lead('East Hope Group', ['CN'], 'refine'),
      lead('Zhuhai Fangyuan', ['CN'], 'refine'),
      lead('Rio Tinto', ['CA'], 'refine'),
      lead('Nyrstar', ['AU'], 'refine'),
      lead('5N Plus', ['CA'], 'convert'),
    ],
  },

  // ---------- Thermal & Packaging ----------
  {
    material: 'CVD synthetic diamond heat spreader',
    thesis:
      'Reactor time, not raw material, is the constraint. Growing optical-grade polycrystalline diamond is slow, and the qualified capacity is held by a handful of firms.',
    producers: [
      lead('Element Six', ['GB', 'IE'], 'convert'),
      lead('Coherent', ['US'], 'convert'),
      lead('Diamond Materials', ['DE'], 'convert'),
      lead('Applied Diamond', ['US'], 'convert'),
      lead('Sumitomo Electric', ['JP'], 'convert'),
    ],
  },
  {
    material: 'Silicon carbide substrate, 200 mm semi-insulating',
    thesis:
      'The 150 mm to 200 mm transition resets everyone’s yield curve at once. Semi-insulating grade is a much smaller field than conductive SiC, and defect density is the gate.',
    producers: [
      lead('Wolfspeed', ['US'], 'convert'),
      lead('Coherent', ['US'], 'convert'),
      lead('SK Siltron CSS', ['KR', 'US'], 'convert'),
      lead('Resonac', ['JP'], 'convert'),
      lead('SICC', ['CN'], 'convert'),
      lead('TankeBlue', ['CN'], 'convert'),
    ],
  },
  {
    material: 'Two-phase dielectric immersion coolant',
    thesis:
      'A chokepoint created by regulation rather than geology: PFAS restriction is withdrawing the incumbent fluorinated chemistry precisely as immersion cooling starts to scale.',
    producers: [
      lead('3M', ['US'], 'refine'),
      lead('Chemours', ['US'], 'refine'),
      lead('Syensqo', ['BE'], 'refine'),
      lead('AGC', ['JP'], 'refine'),
      lead('Engineered Fluids', ['US'], 'convert'),
    ],
  },

  // ---------- Power, Grid & Superconductors ----------
  {
    material: 'Grain-oriented electrical steel (GOES)',
    thesis:
      'The binding constraint on datacentre energisation. Large power transformers queue for years, and the core steel behind them is made on a small number of qualified lines.',
    producers: [
      lead('Nippon Steel', ['JP'], 'convert'),
      lead('JFE Steel', ['JP'], 'convert'),
      lead('POSCO', ['KR'], 'convert'),
      lead('ThyssenKrupp Electrical Steel', ['DE'], 'convert'),
      lead('Cleveland-Cliffs', ['US'], 'convert'),
      lead('Baosteel', ['CN'], 'convert'),
      lead('Stalprodukt', ['PL'], 'convert'),
    ],
  },
  {
    material: 'REBCO superconducting tape, 12 mm',
    thesis:
      'A single high-field fusion magnet consumes tape by the kilometre. Annual world output is small enough that one programme’s order book moves the whole market.',
    producers: [
      lead('Fujikura', ['JP'], 'convert'),
      lead('Faraday Factory Japan', ['JP'], 'convert'),
      lead('SuperPower', ['US'], 'convert'),
      lead('MetOx', ['US'], 'convert'),
      lead('THEVA', ['DE'], 'convert'),
      lead('Shanghai Superconductor', ['CN'], 'convert'),
      lead('AMSC', ['US'], 'convert'),
    ],
  },
  {
    material: 'Liquid helium (He-4)',
    thesis:
      'Helium is produced only as a by-product of a few natural gas fields with unusual composition, so supply is set by unrelated gas economics and by a handful of political jurisdictions.',
    producers: [
      lead('QatarEnergy', ['QA'], 'mine'),
      lead('ExxonMobil', ['US'], 'mine'),
      lead('Gazprom', ['RU'], 'mine'),
      lead('Air Products', ['US'], 'refine'),
      lead('Linde', ['US', 'GB'], 'refine'),
      lead('Air Liquide', ['FR'], 'refine'),
    ],
  },

  // ---------- Actuation & Robotics ----------
  {
    material: 'Didymium (Nd-Pr) metal, magnet feed',
    thesis:
      'Mining is diversifying; separation and metal-making have not. The chokepoint moved downstream of the mine, which is where most published coverage still is not looking.',
    producers: [
      lead('China Northern Rare Earth', ['CN'], 'refine'),
      lead('Shenghe Resources', ['CN'], 'refine'),
      lead('Lynas Rare Earths', ['AU', 'MY'], 'refine'),
      lead('MP Materials', ['US'], 'mine'),
      lead('Neo Performance Materials', ['CA', 'EE'], 'convert'),
      lead('Solvay', ['FR'], 'refine'),
    ],
  },
  {
    material: 'Dysprosium metal',
    thesis:
      'Heavy rare earths are a far narrower chain than light ones, feedstock included. Small volumes, no substitute for hot-running magnets, and separation concentrated in effectively one jurisdiction.',
    producers: [
      lead('China Rare Earth Group', ['CN'], 'refine'),
      lead('Shenghe Resources', ['CN'], 'refine'),
      lead('Lynas Rare Earths', ['AU', 'MY'], 'refine'),
      lead('Neo Performance Materials', ['CA', 'EE'], 'convert'),
      lead('Less Common Metals', ['GB'], 'convert'),
    ],
  },
];

// =====================================================================
// PROGRESS
// =====================================================================

export interface CoverageProgress {
  /** Research leads in the universe. */
  total: number;
  /** Rows with a primary source attached — the only ones that count as covered. */
  sourced: number;
  /** Materials on the desk with no coverage entry at all. */
  uncoveredMaterials: string[];
}

/**
 * What Phase 1 completion actually means. Rows without a source are leads, so
 * a universe of 90 unsourced entries is 0% covered, not 100% mapped.
 */
export function coverageProgress(): CoverageProgress {
  const rows = COVERAGE.flatMap(entry => entry.producers);
  const covered = new Set(COVERAGE.map(entry => entry.material));
  return {
    total: rows.length,
    sourced: rows.filter(producer => producer.source !== null).length,
    uncoveredMaterials: CATALOGUE.map(listing => listing.title).filter(
      title => !covered.has(title)
    ),
  };
}

/** @returns every material a company appears on — the overlaps are the point. */
export function materialsFor(companyName: string): string[] {
  return COVERAGE.filter(entry =>
    entry.producers.some(producer => producer.name === companyName)
  ).map(entry => entry.material);
}
