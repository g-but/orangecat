/**
 * A Bitcoin price nobody named must not appear on a listing.
 *
 * Found in production: "rent out my apartment in Basel for 1800 a month" came
 * back as `rental_price_btc: 0.072` — roughly 3,800 francs at the day's rate,
 * more than double what the person said, sitting next to `currency: CHF`
 * contradicting it.
 *
 * The model was cornered. An asset has `rental_price_btc` and no fiat rental
 * field, so the only place the amount could go was a Bitcoin one, and it had no
 * exchange rate to get there honestly. The prompt tells it not to convert;
 * this is the part that does not depend on the model listening.
 *
 * Same rule as everywhere else money is decided here: absent beats invented.
 */

import { sanitizeAiFields } from '@/lib/ai/sanitize-ai-fields';
import type { FieldConfig } from '@/components/create/types';

const FIELDS: FieldConfig[] = [
  { name: 'title', label: 'Title', type: 'text' },
  { name: 'rental_price_btc', label: 'Rental price', type: 'number' },
  { name: 'is_for_rent', label: 'For rent', type: 'checkbox' },
] as unknown as FieldConfig[];

describe('unstated Bitcoin amounts', () => {
  it('drops a BTC price invented from a fiat figure', () => {
    const out = sanitizeAiFields(
      { title: 'Basel Apartment', rental_price_btc: 0.072, is_for_rent: true },
      FIELDS,
      'rent out my apartment in Basel for 1800 a month'
    );

    expect(out.rental_price_btc).toBeUndefined();
    // Everything else survives — the listing is still worth having.
    expect(out.title).toBe('Basel Apartment');
    expect(out.is_for_rent).toBe(true);
  });

  it('keeps a BTC price the user actually stated', () => {
    for (const said of [
      'rent out my flat for 0.01 BTC a month',
      'renting the drone, 0.002 bitcoin per day',
      'rent my van for ₿0.05 a week',
    ]) {
      const out = sanitizeAiFields({ rental_price_btc: 0.01 }, FIELDS, said);
      expect(out.rental_price_btc).toBe(0.01);
    }
  });

  it('drops it for every _btc field, not just the one that was found', () => {
    const out = sanitizeAiFields(
      { sale_price_btc: 1.5, deposit_amount_btc: 0.2, rental_price_btc: 0.072, title: 'Van' },
      FIELDS,
      'selling my van for 40000 francs, 5000 deposit'
    );

    expect(out.sale_price_btc).toBeUndefined();
    expect(out.deposit_amount_btc).toBeUndefined();
    expect(out.rental_price_btc).toBeUndefined();
    expect(out.title).toBe('Van');
  });

  it('leaves non-numeric and non-btc fields alone', () => {
    const out = sanitizeAiFields(
      { currency: 'CHF', estimated_value: 1800, notes_btc: 'paid in btc historically' },
      FIELDS,
      'worth about 1800 francs'
    );

    expect(out.currency).toBe('CHF');
    expect(out.estimated_value).toBe(1800);
    // Only numbers are prices; a string field named *_btc is prose.
    expect(out.notes_btc).toBe('paid in btc historically');
  });
});
