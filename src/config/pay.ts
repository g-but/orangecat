/**
 * Public pay links — SSOT for `orangecat.ch/pay/<username>`.
 *
 * This is the artifact you send someone. It is deliberately NOT an invoice:
 * a BOLT11 expires in about an hour, so anything pasted into a chat is dead
 * before it is opened. The link is alias-backed — it mints a fresh invoice at
 * the moment the payer arrives — which is what makes it safe to share, pin in
 * a bio, or print.
 *
 * Prefills are SUGGESTIONS, never commitments: an amount or note in the URL
 * pre-fills the form and the payer can still change it. And a prefill we can't
 * parse is surfaced, not silently dropped — the failure mode where a bad link
 * quietly shows an empty form is the single worst behaviour we found in this
 * class of product.
 */

import { TIP_MAX_BTC, TIP_MIN_BTC } from './tips';
import { SITE_URL } from './brand';

export const PAY_MIN_BTC = TIP_MIN_BTC;
export const PAY_MAX_BTC = TIP_MAX_BTC;

/** Matches what a payment note is for: a reason, not a message thread. */
export const PAY_NOTE_MAX_LENGTH = 80;

export const PAY_PARAMS = { amount: 'amount', note: 'for' } as const;

export interface PayPrefill {
  amountBtc?: number;
  note?: string;
  /** Set when the link carried an amount we could not honour — shown, not swallowed. */
  amountError?: string;
}

/**
 * The origin a shareable pay link should carry.
 *
 * In the browser we use the origin actually being viewed, so links created on a
 * preview or self-hosted deploy point back at that same deploy instead of
 * silently sending the payer to production. On the server there is no such
 * thing to read, so the configured site URL stands in.
 */
export function payLinkOrigin(): string {
  return typeof window === 'undefined' ? SITE_URL : window.location.origin;
}

/**
 * Build the canonical pay URL. The QR, the copy button and the share sheet all
 * render THIS string, so the three can never drift apart.
 */
export function buildPayUrl(
  origin: string,
  username: string,
  options: { amountBtc?: number; note?: string } = {}
): string {
  const url = new URL(`/pay/${encodeURIComponent(username)}`, origin);
  if (options.amountBtc && options.amountBtc > 0) {
    // Trim float noise (0.1+0.2 artefacts) without rounding the value away.
    url.searchParams.set(PAY_PARAMS.amount, String(Number(options.amountBtc.toFixed(8))));
  }
  if (options.note?.trim()) {
    url.searchParams.set(PAY_PARAMS.note, options.note.trim().slice(0, PAY_NOTE_MAX_LENGTH));
  }
  return url.toString();
}

/**
 * Read prefill params. Invalid amounts return an `amountError` so the page can
 * say what happened instead of rendering a blank form and looking broken.
 */
export function parsePayPrefill(params: {
  get(name: string): string | null;
}): PayPrefill {
  const prefill: PayPrefill = {};

  const note = params.get(PAY_PARAMS.note)?.trim();
  if (note) {
    prefill.note = note.slice(0, PAY_NOTE_MAX_LENGTH);
  }

  const rawAmount = params.get(PAY_PARAMS.amount);
  if (rawAmount === null || rawAmount.trim() === '') {
    return prefill;
  }

  const amount = Number(rawAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    prefill.amountError = `"${rawAmount}" isn't an amount we can read. Enter one below.`;
    return prefill;
  }
  if (amount < PAY_MIN_BTC || amount > PAY_MAX_BTC) {
    prefill.amountError = `The amount in this link (${amount} BTC) is outside what we can request. Enter one below.`;
    return prefill;
  }

  prefill.amountBtc = amount;
  return prefill;
}

export const PAY_COPY = {
  title: (name: string) => `Pay ${name}`,
  subtitle: 'Bitcoin, straight to their wallet.',
  requestedFor: (note: string) => `For: ${note}`,
  noWallet: (name: string) =>
    `${name} can't receive Bitcoin payments right now. Nothing was charged — check back later, or let them know.`,
  notFound: "We couldn't find that OrangeCat account.",
  /** Honesty line — the whole point of the alias is that we never hold funds. */
  disclaimer: 'Paid directly to them. OrangeCat takes 0% and never touches your funds.',
  openInWallet: 'Open in wallet',
  shareTitle: 'Get paid',
  shareHint: 'Send this link and they can pay you from any Bitcoin wallet.',
  copyLink: 'Copy link',
  copiedLink: 'Link copied',
} as const;

/** Copy for the public /pay landing page (what pay links ARE). */
export const PAY_LANDING_COPY = {
  title: 'Get paid with a link',
  subtitle:
    'Everyone on OrangeCat has a payment page at orangecat.ch/pay/<username>. Share it anywhere — the person paying you needs a Bitcoin wallet, not an account.',
  points: [
    {
      title: 'No account for the payer',
      description:
        'Send your link in a chat, pin it in a bio, print it on an invoice. Whoever opens it can pay you on the spot — no signup, no app install.',
    },
    {
      title: 'Non-custodial, zero fee',
      description:
        'Payments go straight to your wallet over Bitcoin and Lightning. OrangeCat never holds your funds and takes 0%.',
    },
    {
      title: 'A link that keeps working',
      description:
        'Invoices expire in about an hour; your pay link never does. It mints a fresh invoice the moment someone arrives, so it survives sitting in a thread overnight.',
    },
  ],
  ctaFind: 'Find people to pay',
  ctaOwn: 'Get your own pay link',
  ctaOwnHint: 'Create an account and your page at /pay/<username> works immediately.',
} as const;
