/**
 * POST /api/loans/offers — create a refinance or payoff offer.
 */

import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { apiCreated, apiInternalError } from '@/lib/api/standardResponse';
import { loanDomainFailureResponse, loanWriteRateLimit, parseLoanBody } from '@/lib/api/loanRoutes';
import { createLoanOfferSchema } from '@/config/loan-offers';
import { createLoanOffer } from '@/domain/loans/offers';
import { logger } from '@/utils/logger';

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { user, supabase } = request;

    const limited = await loanWriteRateLimit(user.id);
    if (limited) {
      return limited;
    }

    const parsed = await parseLoanBody(request, createLoanOfferSchema);
    if (!parsed.ok) {
      return parsed.response;
    }

    const result = await createLoanOffer(user.id, parsed.data, supabase);
    if (!result.ok) {
      return loanDomainFailureResponse(result, 'Loan offer create');
    }

    return apiCreated(result.offer);
  } catch (error) {
    logger.error('Unexpected error in POST /api/loans/offers', error, 'LoansAPI');
    return apiInternalError('Internal server error');
  }
});
