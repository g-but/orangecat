/**
 * The amount field and the server must agree on what a payable amount is.
 *
 * When they disagree the failure is silent and lands on the payer: the form
 * accepts a number, enables the button, and the request comes back rejected
 * after they have already decided to pay. The public support panel shipped
 * with the range written out by hand in three places (two input attributes and
 * a disabled-check) against a fourth copy in the Zod schema — four numbers that
 * were only equal by luck.
 *
 * There is now one pair of constants. This asserts the server still uses it.
 */

import { publicSupportCreateSchema } from '@/lib/validation/finance';
import { PAY_MAX_BTC, PAY_MIN_BTC } from '@/config/pay';

const valid = { entity_type: 'cause', entity_id: '00000000-0000-4000-8000-000000000000' };

describe('public support amount bounds', () => {
  it('accepts exactly what the amount field offers', () => {
    for (const amount_btc of [PAY_MIN_BTC, PAY_MAX_BTC]) {
      expect(publicSupportCreateSchema.safeParse({ ...valid, amount_btc }).success).toBe(true);
    }
  });

  it('rejects just outside the range the field enforces', () => {
    // Below the minimum the wallet cannot invoice it; above the maximum this is
    // not the product a stranger should be able to trigger from a public page.
    for (const amount_btc of [PAY_MIN_BTC / 2, PAY_MAX_BTC * 1.000001]) {
      expect(publicSupportCreateSchema.safeParse({ ...valid, amount_btc }).success).toBe(false);
    }
  });
});
