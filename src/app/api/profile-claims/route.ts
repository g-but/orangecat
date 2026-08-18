/**
 * POST /api/profile-claims — draft a profile for someone else, get back a
 *   claim link (/claim/[id]) to send them.
 * GET  /api/profile-claims — list the claims the caller has created.
 *
 * Thin HTTP layer — business rules live in @/domain/profileClaims/service.
 */

import { z } from 'zod';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import {
  apiCreated,
  apiSuccess,
  apiValidationError,
  apiRateLimited,
  handleApiError,
} from '@/lib/api/standardResponse';
import { rateLimitWriteAsync, retryAfterSeconds } from '@/lib/rate-limit';
import { logger } from '@/utils/logger';
import { createProfileClaim, listProfileClaimsCreatedBy } from '@/domain/profileClaims/service';
import { ROUTES } from '@/config/routes';

const socialLinkSchema = z.object({
  platform: z.string().trim().min(1).max(40),
  label: z.string().trim().max(60).optional(),
  value: z.string().trim().min(1).max(300),
});

const createClaimSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  bio: z.string().trim().max(1000).optional(),
  avatarUrl: z.string().trim().url().max(2000).optional(),
  bannerUrl: z.string().trim().url().max(2000).optional(),
  website: z.string().trim().url().max(2000).optional(),
  socialLinks: z.array(socialLinkSchema).max(10).optional(),
  suggestedUsername: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Usernames can only contain letters, numbers, - and _')
    .optional(),
});

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { user } = req;

    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {
      return apiRateLimited('Too many requests. Please slow down.', retryAfterSeconds(rl));
    }

    const parsed = createClaimSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return apiValidationError('Invalid request', {
        fields: parsed.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })),
      });
    }
    const { name, bio, avatarUrl, bannerUrl, website, socialLinks, suggestedUsername } =
      parsed.data;

    const result = await createProfileClaim({
      createdBy: user.id,
      draft: { name, bio, avatarUrl, bannerUrl, website, socialLinks },
      suggestedUsername,
    });

    if (!result.ok) {
      return handleApiError('dbError' in result ? result.dbError : result);
    }

    return apiCreated({
      id: result.data.id,
      claimUrl: ROUTES.CLAIM(result.data.id),
    });
  } catch (error) {
    logger.error('profile-claims create failed', error, 'ProfileClaims');
    return handleApiError(error);
  }
});

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { user } = req;
    const result = await listProfileClaimsCreatedBy(user.id);
    if (!result.ok) {
      return handleApiError('dbError' in result ? result.dbError : result);
    }

    return apiSuccess({
      claims: result.data.map(claim => ({
        id: claim.id,
        name: claim.draft.name,
        status: claim.status,
        suggestedUsername: claim.suggested_username,
        claimUrl: ROUTES.CLAIM(claim.id),
        createdAt: claim.created_at,
        claimedAt: claim.claimed_at,
        expiresAt: claim.expires_at,
      })),
    });
  } catch (error) {
    logger.error('profile-claims list failed', error, 'ProfileClaims');
    return handleApiError(error);
  }
});
