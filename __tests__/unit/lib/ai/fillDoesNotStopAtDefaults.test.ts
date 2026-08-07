/**
 * A schema default is not something the user typed.
 *
 * `fill` protects what the user already entered — correct, and the reason it
 * exists. But on a create form every select and checkbox already holds a
 * default, and the service cannot tell a default apart from a deliberate
 * choice. Everything non-empty counted as "theirs", so filling a form from a
 * sentence only ever populated the fields that happened to start blank.
 *
 * Seen in production: "rent out my apartment in Basel for 1800 a month" filled
 * Title and Location, then left Asset Type on "Other" and the rental period on
 * "daily" — both contradicting the sentence they came from. The AI had
 * answered `real_estate` and `monthly`; the merge threw both away.
 *
 * The form now sends only the fields it knows the user touched, which is the
 * part it is actually in a position to know.
 */

import { mergePrefillResult } from '@/lib/ai/form-prefill-service';

describe('fill vs schema defaults', () => {
  it('fills a field whose default the user never touched', () => {
    // What the create form now sends: nothing, because nothing was typed.
    const { data, changedFields } = mergePrefillResult(
      { type: 'real_estate', rental_period_type: 'monthly', title: 'Basel Apartment' },
      {},
      'fill'
    );

    expect(data.type).toBe('real_estate');
    expect(data.rental_period_type).toBe('monthly');
    expect(changedFields).toEqual(expect.arrayContaining(['type', 'rental_period_type', 'title']));
  });

  it('still refuses to overwrite a value the user really did type', () => {
    const { data } = mergePrefillResult(
      { title: 'Basel Apartment', location: 'Basel' },
      { title: 'My own title' },
      'fill'
    );

    expect(data.title).toBe('My own title');
    expect(data.location).toBe('Basel');
  });

  it('reproduces the old behaviour when defaults ARE passed as existing', () => {
    // Guards the diagnosis itself: with defaults sent as existingData the AI
    // loses, which is exactly what production was doing.
    const { data } = mergePrefillResult(
      { type: 'real_estate', rental_period_type: 'monthly' },
      { type: 'other', rental_period_type: 'daily' },
      'fill'
    );

    expect(data.type).toBe('other');
    expect(data.rental_period_type).toBe('daily');
  });
});
