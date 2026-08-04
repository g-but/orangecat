/**
 * The one place the loans CHECK constraints are asserted as TypeScript unions.
 *
 * Postgres stores `loans.status`, `loans.loan_type`, `loans.fulfillment_type`,
 * `loans.contact_method`, `loan_offers.offer_type` and `loan_offers.status` as
 * `text` guarded by CHECK constraints (see `loans_status_check` et al. in
 * supabase/migrations/20240101000001_baseline_public_schema.sql). The generated
 * schema types can only say `string`, so every read path funnels through these
 * helpers rather than scattering casts across the query files.
 */

import type { Loan, LoanOffer } from '@/types/loans';

export const narrowLoan = (row: unknown): Loan => row as Loan;

export const narrowLoans = (rows: unknown[]): Loan[] => rows as Loan[];

export const narrowLoanOffers = (rows: unknown[]): LoanOffer[] => rows as LoanOffer[];
