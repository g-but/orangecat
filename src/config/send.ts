/**
 * Sending — SSOT for the outbound payment surface (/send).
 *
 * The mirror of src/config/receive.ts. Bounds are shared with pay links so a
 * link someone can create is always a link someone can pay.
 */

export const SEND_NOTE_MAX_LENGTH = 120;

export const SEND_COPY = {
  title: 'Send Bitcoin',
  subtitle: 'Pay a person, or an invoice someone gave you.',

  personTab: 'To a person',
  invoiceTab: 'Paste invoice',

  recipientLabel: 'Username or Lightning address',
  recipientPlaceholder: 'lena or lena@orangecat.ch',
  memoLabel: 'Note (optional)',
  memoPlaceholder: "What's it for?",

  invoiceLabel: 'Lightning invoice',
  invoicePlaceholder: 'Paste an invoice starting with lnbc…',
  /** Shown once we have read the invoice — consent before spending. */
  invoiceReads: (amount: string) => `This invoice is for ${amount}.`,
  invoiceUnreadable: "We can't read an amount from that invoice.",

  review: 'Review',
  confirm: 'Send payment',
  sending: 'Sending…',

  sentTitle: 'Sent',
  sentBody: (destination: string) => `Paid to ${destination}.`,
  again: 'Send another',

  noWalletTitle: 'Connect a wallet to send',
  noWalletBody:
    'Sending needs a wallet OrangeCat can ask to pay — any NWC-compatible Lightning wallet. Your keys stay yours.',
  noWalletCta: 'Set up a wallet',

  /** Honesty line: we ask the user's own wallet to pay; we never hold funds. */
  disclaimer: 'Paid from your own wallet. OrangeCat never holds your Bitcoin.',
} as const;
