/**
 * Program blueprints must be *creatable*.
 *
 * The runner POSTs each step straight at the entity's own API endpoint, so a
 * payload that misses a required field or uses an off-registry enum value fails
 * at runtime with a 400 the user cannot fix. These tests validate every step of
 * every blueprint against the exact Zod schema its endpoint uses — at default
 * params and at edited ones — so that class of bug cannot ship.
 */

import { PROGRAM_BLUEPRINTS, defaultParamValues } from '@/config/program-blueprints';
import { ENTITY_REGISTRY, type EntityType } from '@/config/entity-registry';
import {
  aiAssistantSchema,
  documentSchema,
  eventSchema,
  projectSchema,
  userCauseSchema,
  userProductSchema,
  wishlistItemSchema,
  wishlistSchema,
} from '@/lib/validation';
import { createGroupSchema } from '@/services/groups/validation';
import type { ZodSchema } from 'zod';

/** The schema each entity's POST route validates against. */
const SCHEMA_BY_ENTITY: Partial<Record<EntityType, ZodSchema>> = {
  ai_assistant: aiAssistantSchema,
  cause: userCauseSchema,
  document: documentSchema,
  event: eventSchema,
  group: createGroupSchema,
  product: userProductSchema,
  project: projectSchema,
  wishlist: wishlistSchema,
};

describe('program blueprints', () => {
  it('registers at least one blueprint with a unique id', () => {
    expect(PROGRAM_BLUEPRINTS.length).toBeGreaterThan(0);
    const ids = PROGRAM_BLUEPRINTS.map(b => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  describe.each(PROGRAM_BLUEPRINTS.map(b => [b.id, b] as const))('%s', (_id, blueprint) => {
    const defaults = defaultParamValues(blueprint);
    const steps = blueprint.buildSteps(defaults);

    it('has unique step keys and known entity types', () => {
      const keys = steps.map(s => s.key);
      expect(new Set(keys).size).toBe(keys.length);
      for (const step of steps) {
        expect(ENTITY_REGISTRY[step.entityType]).toBeDefined();
      }
    });

    it('every param has a default the builder can consume', () => {
      for (const param of blueprint.params) {
        expect(defaults[param.key]).toBeDefined();
        if (param.type === 'number') {
          expect(typeof defaults[param.key]).toBe('number');
        }
      }
    });

    it.each(steps.map(s => [`${s.key} (${s.entityType})`, s] as const))(
      'step %s validates against its endpoint schema',
      (_label, step) => {
        const schema = SCHEMA_BY_ENTITY[step.entityType];
        // A step whose entity type has no mapped schema here is a gap in this
        // test, not a licence to skip — fail loudly so the map stays complete.
        expect(schema).toBeDefined();
        const result = schema!.safeParse(step.payload);
        if (!result.success) {
          throw new Error(
            `${step.key}: ${result.error.errors.map(e => `${e.path.join('.')} ${e.message}`).join('; ')}`
          );
        }
      }
    );

    it('child payloads validate too', () => {
      for (const step of steps) {
        if (!step.children) {
          continue;
        }
        // Wishlist items are the only child resource today; assert the shape
        // rather than silently accepting an unvalidated new one.
        expect(step.entityType).toBe('wishlist');
        expect(step.children.payloads.length).toBeGreaterThan(0);
        for (const child of step.children.payloads) {
          const result = wishlistItemSchema.safeParse(child);
          expect(result.success).toBe(true);
        }
      }
    });
  });
});

describe('computers-to-kids economics', () => {
  const blueprint = PROGRAM_BLUEPRINTS.find(b => b.id === 'computers-to-kids')!;

  it('defaults to the founding run: 10 machines, 5 sponsored, 5 funded', () => {
    const steps = blueprint.buildSteps(defaultParamValues(blueprint));
    const wishlist = steps.find(s => s.entityType === 'wishlist')!;
    const product = steps.find(s => s.entityType === 'product')!;

    expect(wishlist.children!.payloads).toHaveLength(10);
    expect(product.payload.inventory_count).toBe(5);
    expect(product.payload.title).toContain('India');
  });

  it('prices a sponsored seat at two machines so each sale funds a matched one', () => {
    const values = { ...defaultParamValues(blueprint), seatCost: 500 };
    const product = blueprint.buildSteps(values).find(s => s.entityType === 'product')!;
    expect(product.payload.price).toBe(1000);
  });

  it('the AI tutor is free and unmetered for every recipient', () => {
    const steps = blueprint.buildSteps(defaultParamValues(blueprint));
    const assistant = steps.find(s => s.entityType === 'ai_assistant')!;
    expect(assistant.payload.pricing_model).toBe('free');
    expect(assistant.payload.price_per_message).toBe(0);
  });

  it('scales to a different run without code changes', () => {
    const steps = blueprint.buildSteps({
      destination: 'Nairobi',
      sponsoredSeats: 12,
      fundedSeats: 18,
      seatCost: 300,
      seatCostBtc: 0.003,
      timezone: 'Africa/Nairobi',
    });

    const wishlist = steps.find(s => s.entityType === 'wishlist')!;
    const project = steps.find(s => s.entityType === 'project')!;
    const cause = steps.find(s => s.entityType === 'cause')!;
    const event = steps.find(s => s.entityType === 'event')!;

    expect(wishlist.children!.payloads).toHaveLength(30);
    expect(project.payload.goal_amount).toBe(30 * 300);
    expect(cause.payload.goal_amount).toBe(18 * 300);
    expect(event.payload.venue_country).toBe('Nairobi');
    expect(event.payload.timezone).toBe('Africa/Nairobi');
  });

  it('every step still validates after the params are edited', () => {
    const steps = blueprint.buildSteps({
      destination: 'Nairobi',
      sponsoredSeats: 12,
      fundedSeats: 18,
      seatCost: 300,
      seatCostBtc: 0.003,
      timezone: 'Africa/Nairobi',
    });
    for (const step of steps) {
      const schema = SCHEMA_BY_ENTITY[step.entityType]!;
      const result = schema.safeParse(step.payload);
      expect(result.success).toBe(true);
    }
  });

  it('falls back to defaults when a param is cleared in the form', () => {
    // Number inputs hand back NaN while the user is mid-edit; the program must
    // still build something valid rather than emitting NaN goals.
    const steps = blueprint.buildSteps({
      destination: '   ',
      sponsoredSeats: Number.NaN,
      fundedSeats: Number.NaN,
      seatCost: Number.NaN,
      seatCostBtc: Number.NaN,
      timezone: '',
    });
    for (const step of steps) {
      const schema = SCHEMA_BY_ENTITY[step.entityType]!;
      expect(schema.safeParse(step.payload).success).toBe(true);
    }
    const project = steps.find(s => s.entityType === 'project')!;
    expect(project.payload.title).toContain('India');
  });
});
