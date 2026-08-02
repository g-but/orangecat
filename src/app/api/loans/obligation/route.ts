/**
 * POST /api/loans/obligation — create an active obligation loan after refinance acceptance.
 *
 * Session-authenticated; only the borrower may create an obligation for their own
 * source loan. Replaces the browser Supabase write in createObligationLoan.
 */
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import {
  apiCreated,
  apiBadRequest,
  apiValidationError,
  apiForbidden,
  apiNotFound,
  apiInternalError,
} from '@/lib/api/standardResponse';
import { loanWriteRateLimit } from '@/lib/api/loanRoutes';
import { createObligationLoanSchema } from '@/config/loan-obligation';
import { createObligationLoan } from '@/domain/loans/obligation';
import { logger } from '@/utils/logger';

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { user, supabase } = request;

    const limited = await loanWriteRateLimit(user.id);
    if (limited) {
      return limited;
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiBadRequest('Invalid JSON body');
    }

    const parsed = createObligationLoanSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError('Invalid request', parsed.error.flatten());
    }

    if (parsed.data.borrowerId !== user.id) {
      return apiForbidden('You can only create obligation loans for yourself');
    }

    const result = await createObligationLoan(
      user.id,
      {
        lenderProfileName: parsed.data.lenderProfileName,
        offer: parsed.data.offer,
      },
      supabase
    );

    if (!result.ok) {
      switch (result.reason) {
        case 'source_loan_not_found':
          return apiNotFound(result.message);
        case 'forbidden':
          return apiForbidden(result.message);
        default:
          logger.error('Obligation loan create failed', { message: result.message }, 'LoansAPI');
          return apiInternalError(result.message);
      }
    }

    return apiCreated(result.loan);
  } catch (error) {
    logger.error('Unexpected error in POST /api/loans/obligation', error, 'LoansAPI');
    return apiInternalError('Internal server error');
  }
});
