/**
 * Contract test for the FleetCrown Bitcoin entitlement rail.
 *
 * Proves the seed's product tags (what OrangeCat WRITES) are exactly what the
 * settlement notifier PARSES, and that the derived webhook payload satisfies
 * FleetCrown's receiver contract. FleetCrown's verifier
 * (src/app/api/orangecat/entitlement/route.ts in the FleetCrown repo) enforces:
 *   plan ∈ its plan enum · externalId 1..200 chars · periodDays a positive int ≤ 3660.
 * If the tag format, the plan set, or a price ever drifts, this fails before a
 * dormant rail ships.
 */
import {
  FLEETCROWN_PASSES,
  FLEETCROWN_PLANS,
  parseFleetCrownPass,
  passTags,
} from '@/config/fleetcrown-passes';

describe('FleetCrown passes — tag/parse contract', () => {
  it('every catalogued pass round-trips through parseFleetCrownPass', () => {
    for (const pass of FLEETCROWN_PASSES) {
      expect(parseFleetCrownPass(pass.tags)).toEqual({
        plan: pass.plan,
        periodDays: pass.periodDays,
      });
    }
  });

  it('covers exactly the paid plans, once each', () => {
    const plans = FLEETCROWN_PASSES.map((p) => p.plan).sort();
    expect(plans).toEqual([...FLEETCROWN_PLANS].sort());
    expect(new Set(plans).size).toBe(FLEETCROWN_PASSES.length);
  });

  it('passTags is the exact inverse of parseFleetCrownPass', () => {
    for (const plan of FLEETCROWN_PLANS) {
      expect(parseFleetCrownPass(passTags(plan, 30))).toEqual({ plan, periodDays: 30 });
    }
  });

  it('rejects non-pass / malformed tags', () => {
    expect(parseFleetCrownPass(null)).toBeNull();
    expect(parseFleetCrownPass(['random', 'tags'])).toBeNull();
    expect(parseFleetCrownPass(['fleetcrown-plan:pro'])).toBeNull(); // missing days
    expect(parseFleetCrownPass(['fleetcrown-days:30'])).toBeNull(); // missing plan
    expect(parseFleetCrownPass(['fleetcrown-plan:bogus', 'fleetcrown-days:30'])).toBeNull();
  });

  it('derived entitlement payload satisfies FleetCrown’s receiver constraints', () => {
    for (const pass of FLEETCROWN_PASSES) {
      const parsed = parseFleetCrownPass(pass.tags);
      expect(parsed).not.toBeNull();
      // plan is a bounded token FleetCrown's zod enum accepts
      expect(FLEETCROWN_PLANS).toContain(parsed!.plan);
      // periodDays: positive int ≤ 3660
      expect(Number.isInteger(parsed!.periodDays)).toBe(true);
      expect(parsed!.periodDays).toBeGreaterThan(0);
      expect(parsed!.periodDays).toBeLessThanOrEqual(3660);
    }
  });

  it('prices match FleetCrown /pricing (CHF 15/40/90), guarding accidental drift', () => {
    const byPlan = Object.fromEntries(FLEETCROWN_PASSES.map((p) => [p.plan, p.price]));
    expect(byPlan).toEqual({ personal: 15, pro: 40, team: 90 });
    for (const p of FLEETCROWN_PASSES) {
      expect(p.currency).toBe('CHF');
    }
  });
});
