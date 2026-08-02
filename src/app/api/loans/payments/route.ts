/**
 * POST /api/loans/payments — record a loan payment (payoff / refinance handoff).
 */
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { apiCreated, apiInternalError } from '@/lib/api/standardResponse';
import { loanDomainFailureResponse, loanWriteRateLimit, parseLoanBody } from '@/lib/api/loanRoutes';
import { createLoanPaymentSchema } from '@/config/loan-payments';
import { createLoanPayment } from '@/domain/loans/payments';
import { logger } from '@/utils/logger';

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { user, supabase } = request;

    const limited = await loanWriteRateLimit(user.id);
    if (limited) {
      return limited;
    }

    const parsed = await parseLoanBody(request, createLoanPaymentSchema);
    if (!parsed.ok) {
      return parsed.response;
    }

    const result = await createLoanPayment(user.id, parsed.data, supabase);
    if (!result.ok) {
      return loanDomainFailureResponse(result, 'Loan payment create');
    }

    return apiCreated(result.payment);
  } catch (error) {
    logger.error('Unexpected error in POST /api/loans/payments', error, 'LoansAPI');
    return apiInternalError('Internal server error');
  }
});
