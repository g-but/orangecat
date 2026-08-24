/**
 * Entity guides — human meaning for every EntityType.
 *
 * Code metadata (paths, tables, icons) lives in `entity-registry.ts`.
 * This file is the SSOT for *when to use which type* and how types relate.
 * Docs (`docs/architecture/ENTITY_TYPES.md`) and Cat prompts must not invent
 * a parallel taxonomy — import from here.
 *
 * Product EntityType key is `organization` (DB table `groups`). `circle` is a
 * separate lightweight community type. Group *labels* (nonprofit, company, …)
 * are not entity types.
 *
 * Created: 2026-08-20
 * Last Modified: 2026-08-20
 * Last Modified Summary: Renamed guide key group → organization; legacy aliases map group → organization.
 */

import type { EntityType } from './entity-registry';

export interface EntityGuide {
  /** One sentence: what this type is for. */
  summary: string;
  /** Concrete situations where this type is the right choice. */
  whenToUse: readonly string[];
  /** Common mistakes — use another type instead. */
  notFor: readonly string[];
  /** Related types often created alongside this one. */
  relatedTypes: readonly EntityType[];
  /** Short example descriptions suitable for create / Cat prefill. */
  examples: readonly string[];
}

/**
 * Guide text keyed by EntityType. Every registry type must have an entry.
 */
export const ENTITY_GUIDES: Record<EntityType, EntityGuide> = {
  wallet: {
    summary: 'A Bitcoin wallet connection — how value moves, not a listing.',
    whenToUse: [
      'Connecting a Lightning or on-chain wallet to receive or send',
      'Attaching settlement rails to a profile or organization',
    ],
    notFor: ['Selling goods (use product)', 'Fundraising campaigns (use project or cause)'],
    relatedTypes: [],
    examples: ['Connect my Lightning wallet for receiving tips'],
  },

  project: {
    summary: 'A time-bound, fundable initiative with a goal.',
    whenToUse: [
      'Building something with a raise target and milestones',
      'Community-funded programmes with a clear end or phase',
    ],
    notFor: [
      'The standing org itself (use organization)',
      'Ongoing “please donate to our mission” with no project frame (use cause)',
      'One-off products for sale (use product)',
    ],
    relatedTypes: ['organization', 'cause', 'investment'],
    examples: ['Open-source wallet app, goal 0.5 BTC', 'Compatibility placement pilot 2026'],
  },

  product: {
    summary: 'A physical or digital good offered at a price.',
    whenToUse: ['Selling tangible or downloadable items', 'Store inventory with fixed price'],
    notFor: ['Hourly expertise (use service)', 'Donations (use cause)'],
    relatedTypes: ['service', 'organization'],
    examples: ['Handmade ceramic mugs, CHF 45', 'Digital print pack, 0.0003 BTC'],
  },

  service: {
    summary: 'Expertise or labour offered (hourly, fixed, or package).',
    whenToUse: [
      'Consulting, repair, lessons, photography, development',
      'Anything billed as work rather than a SKU',
    ],
    notFor: ['Physical goods (use product)', 'Dated gatherings (use event)'],
    relatedTypes: ['product', 'event', 'organization'],
    examples: ['Portrait photography, CHF 150/h', 'Housing guidance intake session'],
  },

  cause: {
    summary: 'A donor-facing ask — support this mission or need.',
    whenToUse: [
      'Open-ended charitable or mission fundraising',
      '“Help us continue this work” without a project milestone frame',
    ],
    notFor: [
      'The org home / membership shell (use organization)',
      'A scoped build with a raise goal (use project)',
    ],
    relatedTypes: ['organization', 'project'],
    examples: ['Support stable housing transitions', 'Fund open-source maintenance'],
  },

  ai_assistant: {
    summary: 'A supervised AI service you create and can monetize.',
    whenToUse: ['Packaging an AI helper as a productized service on the platform'],
    notFor: ['General Cat chat (built-in)', 'Human consulting (use service)'],
    relatedTypes: ['service', 'document'],
    examples: ['Shop FAQ assistant, CHF 5 per conversation'],
  },

  organization: {
    summary: 'Standing collective identity — nonprofit, company, DAO, cooperative, guild, etc.',
    whenToUse: [
      'A lasting org with members, governance, and optionally a treasury',
      'Public identity for a nonprofit, company, cooperative, or network',
    ],
    notFor: [
      'Loose interest hangouts without governance (prefer circle)',
      'A single fundraising ask without an org shell (use cause)',
      'A one-off initiative (use project)',
    ],
    relatedTypes: ['cause', 'project', 'service', 'event', 'circle'],
    examples: [
      'AOM — housing placement collective (nonprofit label)',
      'Neighbourhood repair cooperative',
      'Zurich Bitcoin builders DAO',
    ],
  },

  circle: {
    summary: 'Lightweight community / interest space — less formal than an organization.',
    whenToUse: [
      'Reading groups, neighbourhood swaps, maker hangouts',
      'Coordination without full governance/treasury machinery',
    ],
    notFor: [
      'Registered-style orgs with roles and treasury (use organization)',
      'Dated public events (use event)',
    ],
    relatedTypes: ['organization', 'event'],
    examples: ['Weekly Bitcoin book circle', 'Parents childcare swap circle'],
  },

  asset: {
    summary: 'Property or valuables you own — rent out or pledge as collateral.',
    whenToUse: ['Listing a flat, bike, camera kit for rent or as loan collateral'],
    notFor: ['Selling the item outright (use product)', 'Requesting a loan (use loan)'],
    relatedTypes: ['loan', 'product'],
    examples: ['Cargo bike for weekend rent', 'Flat as loan collateral'],
  },

  loan: {
    summary: 'Peer-to-peer Bitcoin loan request or offer.',
    whenToUse: ['Borrowing or lending BTC with terms'],
    notFor: ['Equity raises (use investment)', 'Donations (use cause)'],
    relatedTypes: ['asset', 'investment'],
    examples: ['Need 0.05 BTC for 3 months for shop expansion'],
  },

  investment: {
    summary: 'Equity, revenue-share, or structured investment deal.',
    whenToUse: ['Raising capital with investor terms and tickets'],
    notFor: ['Crowdfund gifts (use project/cause)', 'Simple loans (use loan)'],
    relatedTypes: ['project', 'organization'],
    examples: ['Seed round, 0.25 BTC minimum ticket'],
  },

  event: {
    summary: 'A dated gathering — meetup, workshop, hackathon.',
    whenToUse: ['Anything with a start time and attendance'],
    notFor: ['Ongoing services (use service)', 'Standing communities (use organization/circle)'],
    relatedTypes: ['organization', 'circle', 'service'],
    examples: ['Bitcoin meetup Saturday in Bern', 'Online Lightning workshop'],
  },

  research: {
    summary: 'Independent research topic with decentralized funding.',
    whenToUse: ['DeSci-style topics seeking funding and collaborators'],
    notFor: ['Generic projects without a research frame (use project)'],
    relatedTypes: ['project', 'cause'],
    examples: ['Bitcoin adoption study in emerging markets'],
  },

  wishlist: {
    summary: 'Items you want — others can buy them for you.',
    whenToUse: ['Birthday, wedding, personal registries'],
    notFor: ['Selling your own goods (use product)', 'Org fundraising (use cause)'],
    relatedTypes: ['product'],
    examples: ['Birthday wishlist for June'],
  },

  document: {
    summary: 'Personal context for Cat — goals, skills, notes (not a public listing).',
    whenToUse: ['Feeding Cat private context so offers and advice are grounded'],
    notFor: ['Public blog posts or products', 'Org profiles (use organization)'],
    relatedTypes: [],
    examples: ['My skills, rates, and the work I want more of'],
  },
};

/** Fail loudly in tests/dev if a registry type lacks a guide. */
export function getEntityGuide(type: EntityType): EntityGuide {
  return ENTITY_GUIDES[type];
}

/**
 * Legacy names that resolve to a real EntityType.
 * Keep this list for greps, Cat prompts, and docs reviews.
 */
export const LEGACY_ENTITY_ALIASES = {
  /** Old EntityType key / product language. Maps to `organization`. */
  group: 'organization',
  groups: 'organization',
  organisations: 'organization',
  org: 'organization',
} as const;
