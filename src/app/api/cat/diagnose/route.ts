/**
 * Cat Diagnose
 *
 * Authenticated endpoint that hits each configured AI provider with a
 * minimal probe ("ping") and returns the raw upstream status + sanitized
 * error message. Built specifically so users (and us) can answer the
 * question "why isn't Cat answering?" without having to read server
 * logs.
 *
 * Probe logic lives in src/services/cat/health-probes.ts — shared with the
 * Cat's own check_cat_health tool so the Cat can run the same diagnosis
 * in-conversation. No keys, no auth headers, no Bearer strings are ever
 * echoed back — the result is always safe to surface to the user.
 *
 * GET /api/cat/diagnose
 */

import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { apiSuccess } from '@/lib/api/standardResponse';
import { runCatHealthProbes } from '@/services/cat/health-probes';

export const GET = withAuth(async (_request: AuthenticatedRequest) => {
  const report = await runCatHealthProbes();
  return apiSuccess(report);
});
