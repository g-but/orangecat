import {
  generateTransparencyReport,
  getTransparencyCriteriaForDisplay,
  type TransparencyData,
} from '@/services/transparency';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { apiSuccess, apiError, apiRateLimited } from '@/lib/api/standardResponse';
import { rateLimitWriteAsync } from '@/lib/rate-limit';

const TRANSPARENCY_KEYS: (keyof TransparencyData)[] = [
  'isOpenSource',
  'hasContributionGuidelines',
  'hasIssueTracking',
  'hasMissionStatement',
  'hasKPIs',
  'hasProgressUpdates',
  'hasTransactionHistory',
  'hasTransactionComments',
  'hasFinancialReports',
  'hasPublicChannels',
  'hasCommunityUpdates',
  'isResponsiveToFeedback',
];

/**
 * POST /api/transparency/compute
 * Computes a weighted transparency score from provided boolean criteria.
 * Uses the config-driven weighted calculation from src/config/transparency.ts.
 */
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { user } = request;

    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {
      const retryAfter = Math.ceil((rl.resetTime - Date.now()) / 1000);
      return apiRateLimited('Too many requests. Please slow down.', retryAfter);
    }

    const body = await request.json();

    // Build TransparencyData from request body, defaulting missing keys to false
    const data: TransparencyData = {} as TransparencyData;
    for (const key of TRANSPARENCY_KEYS) {
      data[key] = Boolean(body[key]);
    }

    const report = await generateTransparencyReport(data);

    return apiSuccess(report);
  } catch {
    return apiError('Failed to compute transparency score', 'COMPUTATION_ERROR', 400);
  }
});

/**
 * GET /api/transparency/compute
 * Returns the transparency criteria definition (categories, weights, labels).
 * Useful for rendering the criteria checklist in UI.
 */
export async function GET() {
  const criteria = getTransparencyCriteriaForDisplay();

  return apiSuccess({ criteria }, { cache: 'LONG' });
}
