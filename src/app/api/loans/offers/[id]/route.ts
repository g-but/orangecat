/**
 * PUT /api/loans/offers/:id — offerer-side offer updates.
 */

import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { apiSuccess, apiInternalError } from '@/lib/api/standardResponse';
import { loanDomainFailureResponse, loanWriteRateLimit, parseLoanBody } from '@/lib/api/loanRoutes';
import { updateLoanOfferSchema } from '@/config/loan-offers';
import { updateLoanOffer } from '@/domain/loans/offers';
import { logger } from '@/utils/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const PUT = withAuth(async (request: AuthenticatedRequest, { params }: RouteContext) => {
  try {
    const { user, supabase } = request;
    const { id: offerId } = await params;

    const limited = await loanWriteRateLimit(user.id);
    if (limited) {
      return limited;
    }

    const parsed = await parseLoanBody(request, updateLoanOfferSchema);
    if (!parsed.ok) {
      return parsed.response;
    }

    const result = await updateLoanOffer(user.id, offerId, parsed.data, supabase);
    if (!result.ok) {
      return loanDomainFailureResponse(result, 'Loan offer update');
    }

    return apiSuccess(result.offer);
  } catch (error) {
    logger.error('Unexpected error in PUT /api/loans/offers/:id', error, 'LoansAPI');
    return apiInternalError('Internal server error');
  }
});
