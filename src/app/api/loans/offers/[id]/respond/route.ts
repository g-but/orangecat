/**
 * POST /api/loans/offers/:id/respond — borrower accepts or rejects an offer.
 */

import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { apiSuccess, apiInternalError } from '@/lib/api/standardResponse';
import { loanDomainFailureResponse, loanWriteRateLimit, parseLoanBody } from '@/lib/api/loanRoutes';
import { respondToLoanOfferSchema } from '@/config/loan-offers';
import { respondToLoanOffer } from '@/domain/loans/offers';
import { logger } from '@/utils/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const POST = withAuth(async (request: AuthenticatedRequest, { params }: RouteContext) => {
  try {
    const { user, supabase } = request;
    const { id: offerId } = await params;

    const limited = await loanWriteRateLimit(user.id);
    if (limited) {
      return limited;
    }

    const parsed = await parseLoanBody(request, respondToLoanOfferSchema);
    if (!parsed.ok) {
      return parsed.response;
    }

    const result = await respondToLoanOffer(user.id, offerId, parsed.data.accept, supabase);
    if (!result.ok) {
      return loanDomainFailureResponse(result, 'Loan offer response');
    }

    return apiSuccess(result.offer);
  } catch (error) {
    logger.error('Unexpected error in POST /api/loans/offers/:id/respond', error, 'LoansAPI');
    return apiInternalError('Internal server error');
  }
});
