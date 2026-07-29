/**
 * AI form assist — merge policy and form-aware adjustments.
 *
 * Regression guard for the bug that made "Adjust" useless: existing form
 * values unconditionally overwrote the AI's output, so asking to rewrite a
 * non-empty description could never change anything.
 */

import { mergePrefillResult } from '@/lib/ai/form-prefill-service';
import {
  AI_ADJUSTMENTS,
  AI_ADJUSTMENT_CHIP_LIMIT,
  USER_OVERRIDABLE_FIELDS,
  getAdjustmentById,
  getAdjustmentsForFields,
  getExampleDescriptions,
} from '@/config/ai-form-assist';
import { ENTITY_TYPES, type EntityType } from '@/config/entity-registry';

describe('mergePrefillResult — intent decides who wins', () => {
  const existing = { title: 'Photography', description: 'I offer photography.', price: 50 };

  describe('intent: refine', () => {
    it('lets the AI overwrite a field the user already filled', () => {
      const ai = { description: 'Portrait and event photography for people who hate posing…' };

      const { data, changedFields } = mergePrefillResult(ai, existing, 'refine');

      expect(data.description).toBe(ai.description);
      expect(changedFields).toEqual(['description']);
    });

    it('keeps fields the AI did not return', () => {
      const { data } = mergePrefillResult({ description: 'new' }, existing, 'refine');

      expect(data.title).toBe('Photography');
      expect(data.price).toBe(50);
    });

    it('reports nothing changed when the AI echoes the current value', () => {
      const { changedFields } = mergePrefillResult(
        { description: existing.description },
        existing,
        'refine'
      );

      expect(changedFields).toEqual([]);
    });

    it('compares structurally, so an identical array is not a change', () => {
      const { changedFields } = mergePrefillResult(
        { tags: ['a', 'b'] },
        { tags: ['a', 'b'] },
        'refine'
      );

      expect(changedFields).toEqual([]);
    });
  });

  describe('intent: fill', () => {
    it('protects what the user typed', () => {
      const ai = { title: 'AI title', description: 'AI description' };

      const { data, changedFields } = mergePrefillResult(ai, existing, 'fill');

      expect(data.title).toBe('Photography');
      expect(data.description).toBe('I offer photography.');
      expect(changedFields).toEqual([]);
    });

    it('fills fields the user left empty', () => {
      const { data, changedFields } = mergePrefillResult(
        { description: 'written copy' },
        { title: 'Photography', description: '' },
        'fill'
      );

      expect(data.description).toBe('written copy');
      expect(changedFields).toEqual(['description']);
    });

    it('lets the AI set price and currency over template defaults', () => {
      const { data, changedFields } = mergePrefillResult(
        { price: 150, currency: 'CHF' },
        { price: 0, currency: 'USD' },
        'fill'
      );

      expect(data.price).toBe(150);
      expect(data.currency).toBe('CHF');
      expect(changedFields).toEqual(expect.arrayContaining(['price', 'currency']));
      // …and that permission is the one list both the prompt and the merge read
      expect(USER_OVERRIDABLE_FIELDS).toEqual(
        expect.arrayContaining(['price', 'currency', 'hourly_rate', 'fixed_price'])
      );
    });

    it('works with no existing data at all', () => {
      const { data, changedFields } = mergePrefillResult({ title: 'x' }, undefined, 'fill');

      expect(data).toEqual({ title: 'x' });
      expect(changedFields).toEqual(['title']);
    });
  });
});

describe('getAdjustmentsForFields — suggestions follow the actual form', () => {
  const descriptionField = { name: 'description', label: 'Description', type: 'textarea' } as const;
  const tagsField = { name: 'tags', label: 'Tags', type: 'tags' } as const;

  it('offers description adjustments only when the form has a description', () => {
    const withDescription = getAdjustmentsForFields([descriptionField]).map(a => a.id);
    const withoutDescription = getAdjustmentsForFields([tagsField]).map(a => a.id);

    expect(withDescription).toContain('description-longer');
    expect(withoutDescription).not.toContain('description-longer');
  });

  it('matches by field type, not just name', () => {
    expect(getAdjustmentsForFields([tagsField]).map(a => a.id)).toContain('tags-suggest');
  });

  it('always offers unscoped adjustments', () => {
    expect(getAdjustmentsForFields([]).map(a => a.id)).toContain('fill-blanks');
  });

  it('caps how many chips a form shows', () => {
    const everyField = AI_ADJUSTMENTS.flatMap(a => [
      ...(a.appliesTo?.fieldNames ?? []).map(name => ({
        name,
        label: name,
        type: 'text' as const,
      })),
      ...(a.appliesTo?.fieldTypes ?? []).map(type => ({ name: type, label: type, type })),
    ]);

    expect(getAdjustmentsForFields(everyField).length).toBeLessThanOrEqual(
      AI_ADJUSTMENT_CHIP_LIMIT
    );
  });

  it('gives every adjustment a unique id and a non-trivial instruction', () => {
    const ids = AI_ADJUSTMENTS.map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const adjustment of AI_ADJUSTMENTS) {
      expect(adjustment.label.length).toBeGreaterThan(0);
      expect(adjustment.instruction.length).toBeGreaterThan(40);
      expect(getAdjustmentById(adjustment.id)).toBe(adjustment);
    }
  });
});

describe('getExampleDescriptions — no entity type falls through to nothing', () => {
  it.each(ENTITY_TYPES.filter(t => t !== 'wallet'))('returns a usable example for %s', type => {
    const examples = getExampleDescriptions(type as EntityType);

    expect(examples.length).toBeGreaterThan(0);
    expect(examples[0].length).toBeGreaterThan(10);
  });
});
