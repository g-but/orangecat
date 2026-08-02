/**
 * Payment requests — SSOT for asking a specific person for money.
 *
 * Bounds are shared with pay links, so anything you can request is something
 * the payer can actually pay.
 */

export const REQUEST_NOTE_MAX_LENGTH = 80;

export const REQUEST_COPY = {
  tab: 'Request',
  title: 'Request from someone',
  subtitle: 'Ask another OrangeCat account for Bitcoin. They can pay or decline.',

  payerLabel: 'From',
  payerPlaceholder: 'Their username',
  noteLabel: "What's it for? (optional)",
  notePlaceholder: 'Dinner, rent, tickets…',

  submit: 'Send request',
  submitting: 'Sending…',
  sent: 'Request sent',
  sentBody: (name: string) => `${name} has been notified and can pay in one tap.`,

  incomingTitle: 'Waiting on you',
  outgoingTitle: 'You asked for',
  empty: 'No requests yet.',

  pay: 'Pay',
  decline: 'Decline',
  cancel: 'Cancel',

  statusLabels: {
    pending: 'Pending',
    paid: 'Paid',
    declined: 'Declined',
    cancelled: 'Cancelled',
  },

  /** Honesty: a request is an ask, not a charge. Nothing moves without them. */
  disclaimer: 'A request is just an ask — no Bitcoin moves until they choose to pay.',
} as const;
