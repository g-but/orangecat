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
  incomingEmpty: 'Nobody has asked you for anything.',
  outgoingEmpty: "You haven't asked anyone yet.",

  pay: 'Pay',
  decline: 'Decline',
  cancel: 'Cancel',

  /** Confirmations for actions that finish quietly, in the background. */
  declined: 'Request declined.',
  cancelled: 'Request withdrawn.',
  /** Neither side is named on a row until we know who they are. */
  unknownParty: 'Someone',
  from: (name: string) => `From ${name}`,
  to: (name: string) => `To ${name}`,

  statusLabels: {
    pending: 'Pending',
    paid: 'Paid',
    declined: 'Declined',
    cancelled: 'Cancelled',
  },

  /** Honesty: a request is an ask, not a charge. Nothing moves without them. */
  disclaimer: 'A request is just an ask — no Bitcoin moves until they choose to pay.',
} as const;
