created_date: 2025-12-04
last_modified_date: 2025-12-05
last_modified_summary: Add CHF support + shared currency list; enable real asset CRUD

# OrangeCat Loans Flow (Refinance & Payoff)

## Borrower path
- Create a loan listing with remaining balance, current rate/term, lender mask, minimum acceptable offer, negotiable flag, visibility (public/private), and contact preference.
- Listing appears under `My Loans`; public listings appear in `Available Loans`.
- Borrower can view offers per loan, then accept or reject. Acceptance marks the loan as `refinanced` or `paid_off` and triggers payment handoff.

## Lender path
- Browse `Available Loans`, filter by category/amount/rate, open details to assess risk.
- Submit an offer:
  - Payoff: propose amount to clear the balance.
  - Refinance: propose payoff + new rate/term; monthly payment preview shown.
- Offers are validated (min offer, no self-offers, active/public loans).
- Borrower reviews offers and accepts or rejects.

## Payment handoff (next iteration)
- On accept, record payoff payment (payer, recipient, amount, method). Once completed, the original loan is archived and a new obligation to the offerer is created with the accepted terms.
- Schedule generation and reminders for refinance terms follow the acceptance.

## Implementation notes
- Frontend now loads “My Offers” and borrower offer lists; borrower can accept/reject offers per loan.
- Service layer includes `getUserOffers` and reuses `respondToOffer`; UI uses typed service calls with toasts for feedback.
- RLS and backend validations remain the source of truth; no direct DB access from UI.
- Currency source of truth lives in `src/config/currencies.ts` and is reused by UI, validation, services, and DB constraints (CHF included).
- Assets now use real Supabase CRUD APIs (`/api/assets` and `/api/assets/[id]`) with edit/delete support; entity form drives both create and edit flows.

## Payoff / Refinance Payment Handoff (implementation plan)
- Trigger: borrower accepts an offer.
- Status transitions:
  - Set offer to `accepted` with timestamp.
  - Set loan to `refinanced` (for refinance offers) or `paid_off` (for payoff offers); stamp `paid_off_at` when payoff funds settle.
- Payment record (uses existing `loan_payments`):
  - payer_id: offerer (the new lender)
  - recipient_id: original lender/borrower counterparty (today we treat as borrower for simplicity; extend later for external lender profiles)
  - loan_id: original loan; offer_id: accepted offer
  - amount: offer_amount; payment_type: `payoff` (or `refinance` if reused)
  - currency/method/notes captured from UI
  - status: start as `pending`, move to `completed` when borrower confirms receipt or via webhook in future
- New obligation (refinance path):
  - On payment `completed`, create a new loan row for the borrower with:
    - original_amount & remaining_balance = offer_amount
    - interest_rate/term/monthly_payment from accepted offer
    - status `active`, lender set to the offerer (store as `lender_name` = profile display or a dedicated creditor field)
  - Archive original loan as `refinanced` and keep linkage via a `parent_loan_id` field on the new loan (additive migration when implemented).
- UX steps:
  - After accept: show “Record payoff” dialog to capture payer/recipient/method; allow “mark as completed” once funds clear.
  - Dashboard shows original loan as “Refinancing in progress” until payment completion; then moves to archived and surfaces the new loan.
- Validation & security:
  - UI validation mirrored by service; backend enforces auth/RLS and ownership (only borrower can accept; only parties can mark payment status).
  - No console logging; use structured logger on service side.

## Implemented now
- Borrower can accept an offer and immediately open “Record Payoff” to create and complete a payment record (payer = offerer, recipient = borrower for now).
- Service layer adds `completePayment` and `createObligationLoan` scaffolding for new-loan creation post-payoff (not yet invoked).
- UI uses typed forms with validation, toasts for feedback, and disables controls while processing.

