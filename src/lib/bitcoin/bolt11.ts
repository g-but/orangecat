/**
 * Minimal BOLT11 reader — enough to tell someone what they are about to pay.
 *
 * Only the human-readable prefix is parsed, which is where BOLT11 puts the
 * network and the amount (`lnbc100u1...` = 100 micro-BTC on mainnet). That is a
 * plain string rule, so it needs no bech32 decoding and no dependency; the
 * signed data payload is left to the wallet that actually settles the invoice.
 *
 * The point is consent: nobody should tap "pay" on an amount we never showed
 * them. When we cannot read an amount, we say so rather than guessing zero.
 */

/** BTC per multiplier suffix, per BOLT11. Absent suffix means whole BTC. */
const MULTIPLIERS: Record<string, number> = {
  m: 1e-3,
  u: 1e-6,
  n: 1e-9,
  p: 1e-12,
};

/** Prefix → network. Order matters: `lnbcrt` must be tested before `lnbc`. */
const NETWORK_PREFIXES: ReadonlyArray<[string, Bolt11Network]> = [
  ['lnbcrt', 'regtest'],
  ['lntbs', 'signet'],
  ['lnbc', 'mainnet'],
  ['lntb', 'testnet'],
];

export type Bolt11Network = 'mainnet' | 'testnet' | 'signet' | 'regtest';

export interface ParsedBolt11 {
  network: Bolt11Network;
  /** Null for a zero-amount ("any amount") invoice — a real, valid case. */
  amountBtc: number | null;
}

/** Strip the scheme a QR or wallet may prepend, and normalise case. */
export function normalizeBolt11(input: string): string {
  return input
    .trim()
    .replace(/^lightning:/i, '')
    .trim()
    .toLowerCase();
}

/**
 * Read network + amount from an invoice. Returns null when the string is not a
 * Lightning invoice at all, so callers can tell "not an invoice" apart from
 * "invoice with no amount".
 */
export function parseBolt11(input: string): ParsedBolt11 | null {
  const invoice = normalizeBolt11(input);

  const match = NETWORK_PREFIXES.find(([prefix]) => invoice.startsWith(prefix));
  if (!match) {
    return null;
  }
  const [prefix, network] = match;

  // The HRP runs to the bech32 separator: the LAST '1', since the data part
  // may contain none but the amount digits before it can.
  const separator = invoice.lastIndexOf('1');
  if (separator <= prefix.length - 1) {
    // No separator, or nothing between the prefix and it — not a usable invoice.
    return separator === -1 ? null : { network, amountBtc: null };
  }

  const amountField = invoice.slice(prefix.length, separator);
  if (amountField === '') {
    return { network, amountBtc: null };
  }

  const suffix = amountField.slice(-1);
  const multiplier = MULTIPLIERS[suffix];
  const digits = multiplier ? amountField.slice(0, -1) : amountField;

  if (!/^\d+$/.test(digits)) {
    return null;
  }

  const amountBtc = Number(digits) * (multiplier ?? 1);
  // Guard the float: 8 decimals is Bitcoin's precision, and sub-satoshi
  // amounts round to 0 rather than showing a misleading dust figure.
  const rounded = Number(amountBtc.toFixed(8));
  return { network, amountBtc: rounded > 0 ? rounded : null };
}

/** True only for an invoice this deployment could actually settle. */
export function isPayableBolt11(input: string): boolean {
  return parseBolt11(input)?.network === 'mainnet';
}
