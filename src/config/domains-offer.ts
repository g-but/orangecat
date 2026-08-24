/**
 * OrangeCat Domains — SSOT for the hosting offer /domains sells.
 *
 * `CUSTOM_DOMAIN_PRICE_CHF_PER_MONTH === null` means the plan exists but its
 * price is deliberately not announced yet: the page shows the tier with
 * "pricing to be announced" and the payable service entity is held at 0. To
 * launch a price, set the number here AND update the service entity's
 * `fixed_price` to match — they are the display side and the charge side of
 * the same offer, and only the entity actually collects money.
 */

/** The live, payable service entity the /domains page sells. */
export const DOMAINS_SERVICE_URL = '/services/25baeba0-46bc-4666-a2fb-bd845f45fd14';

/** Custom-domain tier price. null = to be announced (free during early access). */
export const CUSTOM_DOMAIN_PRICE_CHF_PER_MONTH: number | null = null;
