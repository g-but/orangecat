/**
 * FleetCrown passes — OrangeCat-side SSOT for the Bitcoin entitlement rail.
 *
 * FleetCrown (the execution layer) sells its paid plans as Bitcoin-payable
 * OrangeCat products. A "pass" is an ordinary `user_products` row carrying two
 * marker tags the settlement notifier reads:
 *
 *     fleetcrown-plan:<personal|pro|team>   fleetcrown-days:<n>
 *
 * On a settled payment for such a product, notifyFleetCrownEntitlement()
 * (src/services/fleetcrown/entitlement-notify.ts) POSTs a signed grant to
 * FleetCrown, which flips users.plan for `periodDays` — Bitcoin has no native
 * recurring, so a pass is a renewable time-box.
 *
 * This file is the ONE place that knows the plan set, the tag format, the
 * parser, and the canonical pass catalogue:
 *   - the seed (scripts/seed-fleetcrown-passes.ts) WRITES tags via passTags()
 *   - the notifier READS them via parseFleetCrownPass()
 * Same source → they cannot drift (guarded by __tests__/unit/fleetcrown).
 *
 * Prices mirror FleetCrown's /pricing (CHF 15/40/90 per month); OrangeCat
 * converts CHF → BTC at checkout. Change a price here and re-run the seed.
 */

/** The paid FleetCrown tiers sold as OrangeCat passes (excludes the free tier). */
export const FLEETCROWN_PLANS = ['personal', 'pro', 'team'] as const;
export type FleetCrownPlan = (typeof FLEETCROWN_PLANS)[number];

/** Default pass length. BTC has no native recurring — a pass is a time-box. */
export const FLEETCROWN_PASS_PERIOD_DAYS = 30;

const PLAN_SET = new Set<string>(FLEETCROWN_PLANS);

/**
 * The two marker tags a FleetCrown-pass product must carry. This is the SSOT
 * for the tag format; parseFleetCrownPass() below is its exact inverse.
 */
export function passTags(plan: FleetCrownPlan, periodDays: number): [string, string] {
  return [`fleetcrown-plan:${plan}`, `fleetcrown-days:${periodDays}`];
}

/** Extract {plan, periodDays} from a product's tags, or null if not a pass. */
export function parseFleetCrownPass(
  tags: unknown,
): { plan: FleetCrownPlan; periodDays: number } | null {
  if (!Array.isArray(tags)) {
    return null;
  }
  let plan: FleetCrownPlan | null = null;
  let periodDays: number | null = null;
  for (const raw of tags) {
    if (typeof raw !== 'string') {
      continue;
    }
    const t = raw.trim();
    const p = /^fleetcrown-plan:([a-z]+)$/.exec(t);
    if (p && PLAN_SET.has(p[1])) {
      plan = p[1] as FleetCrownPlan;
    }
    const d = /^fleetcrown-days:(\d{1,4})$/.exec(t);
    if (d) {
      periodDays = parseInt(d[1], 10);
    }
  }
  return plan && periodDays ? { plan, periodDays } : null;
}

export interface FleetCrownPass {
  plan: FleetCrownPlan;
  title: string;
  description: string;
  /** Price in `currency`; OrangeCat converts to BTC at checkout. */
  price: number;
  currency: 'CHF';
  periodDays: number;
  /** The marker tags stored on the product (built from passTags()). */
  tags: string[];
}

/**
 * Actor that sells the passes. There is no dedicated "FleetCrown" platform
 * actor — the founder's `mao` actor already owns the OrangeCat and FleetCrown
 * projects, so it sells the passes too and its wallet receives the BTC. Swap to
 * a dedicated actor/group later by changing this slug and re-running the seed.
 */
export const OWNER_ACTOR_SLUG = 'mao';

interface PassSpec {
  plan: FleetCrownPlan;
  title: string;
  description: string;
  price: number;
}

const PASS_SPECS: PassSpec[] = [
  {
    plan: 'personal',
    title: 'FleetCrown Pass — Personal',
    description:
      'One month of FleetCrown Personal, paid in Bitcoin. Room for a real ' +
      'project portfolio, the full captain dashboard, and your own runner and ' +
      'agent keys. Renewable — pay again to extend.',
    price: 15,
  },
  {
    plan: 'pro',
    title: 'FleetCrown Pass — Pro',
    description:
      'One month of FleetCrown Pro, paid in Bitcoin. For operators running many ' +
      'projects at once — no ceiling as your fleet grows. Renewable.',
    price: 40,
  },
  {
    plan: 'team',
    title: 'FleetCrown Pass — Team',
    description:
      'One month of FleetCrown Team, paid in Bitcoin. Shared projects and fleet ' +
      'visibility for a studio. Renewable.',
    price: 90,
  },
];

/** The canonical pass catalogue the seed inserts and the notifier honours. */
export const FLEETCROWN_PASSES: FleetCrownPass[] = PASS_SPECS.map((s) => ({
  plan: s.plan,
  title: s.title,
  description: s.description,
  price: s.price,
  currency: 'CHF',
  periodDays: FLEETCROWN_PASS_PERIOD_DAYS,
  tags: passTags(s.plan, FLEETCROWN_PASS_PERIOD_DAYS),
}));
