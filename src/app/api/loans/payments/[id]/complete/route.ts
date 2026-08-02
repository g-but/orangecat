/**
 * POST /api/loans/payments/:id/complete — mark a payment completed.
 *
 * Optionally creates an obligation loan when `createObligation` is supplied on
 * refinance payments (payoff handoff — see docs/development/loans-flow.md).
 */
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { apiSuccess, apiInternalError } from '@/lib/api/standardResponse';
import { loanDomainFailureResponse, loanWriteRateLimit, parseLoanBody } from '@/lib/api/loanRoutes';
import { completeLoanPaymentSchema } from '@/config/loan-payments';
import { completeLoanPayment } from '@/domain/loans/payments';
import { logger } from '@/utils/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const POST = withAuth(async (request: AuthenticatedRequest, { params }: RouteContext) => {
  try {
    const { user, supabase } = request;
    const { id: paymentId } = await params;

    const limited = await loanWriteRateLimit(user.id);
    if (limited) {
      return limited;
    }

    // An empty body is valid here — completion without obligation creation.
    const parsed = await parseLoanBody(request, completeLoanPaymentSchema, { allowEmpty: true });
    if (!parsed.ok) {
      return parsed.response;
    }

    const result = await completeLoanPayment(user.id, paymentId, parsed.data, supabase);
    if (!result.ok) {
      return loanDomainFailureResponse(result, 'Loan payment complete');
    }

    return apiSuccess({
      payment: result.payment,
      ...(result.obligationLoan ? { obligationLoan: result.obligationLoan } : {}),
    });
  } catch (error) {
    logger.error('Unexpected error in POST /api/loans/payments/:id/complete', error, 'LoansAPI');
    return apiInternalError('Internal server error');
  }
});
