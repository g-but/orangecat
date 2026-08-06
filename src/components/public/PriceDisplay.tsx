/**
 * PriceDisplay — a price with its converted equivalent.
 *
 * A bare "₿0.0005" is meaningless to most people; a bare "CHF 86" hides that
 * it's payable in Bitcoin. This renders the stored price in its own currency
 * plus a live-rate equivalent in the other denomination:
 *   - BTC-priced  → "₿0.0005  ≈ CHF 43.00"   (fiat for the 99% who don't think in sats)
 *   - fiat-priced → "CHF 86.00  ≈ ₿0.001"     (signals Bitcoin-payable)
 *
 * Async server component: awaits the rate cache (CoinGecko-backed, 1-min TTL).
 * If the rate is unavailable for a currency, the equivalent is silently
 * dropped — never fabricated (a wrong rate is a money-correctness bug).
 */

import { formatCurrency } from '@/services/currency';
import { convertBtcToOrNull, convertToBtcOrNull } from '@/services/currency/rates.server';
import { PLATFORM_DEFAULT_CURRENCY, type CurrencyCode } from '@/config/currencies';

interface PriceDisplayProps {
  /** Amount in `currency` units. */
  amount: number;
  /** Currency the amount is stored in (e.g. 'BTC', 'CHF'). */
  currency: string;
  /** Tailwind classes for the primary amount. */
  className?: string;
  /**
   * Per-unit suffix appended after both amounts (e.g. ' / hr', ' / message').
   * Include the leading space. Rendered muted so the amount stays the focus.
   */
  suffix?: string;
}

export default async function PriceDisplay({
  amount,
  currency,
  className = 'text-2xl font-bold text-fg-primary',
  suffix,
}: PriceDisplayProps) {
  // Show the opposite denomination: Bitcoin prices get a fiat equivalent,
  // fiat prices get the Bitcoin equivalent.
  const secondaryCurrency: CurrencyCode = currency === 'BTC' ? PLATFORM_DEFAULT_CURRENCY : 'BTC';

  let secondary: number | null = null;
  try {
    secondary =
      currency === 'BTC'
        ? await convertBtcToOrNull(amount, secondaryCurrency)
        : await convertToBtcOrNull(amount, currency as CurrencyCode);
  } catch {
    secondary = null;
  }

  return (
    <p className={className}>
      {formatCurrency(amount, currency)}
      {secondary !== null && secondary > 0 && (
        <span className="ml-2 text-base font-normal text-fg-secondary">
          ≈ {formatCurrency(secondary, secondaryCurrency)}
        </span>
      )}
      {suffix && <span className="text-base font-normal text-fg-secondary">{suffix}</span>}
    </p>
  );
}
