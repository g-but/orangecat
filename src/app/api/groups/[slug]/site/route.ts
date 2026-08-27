/**
 * Group Website API — publish a group as a website, and take it down again.
 *
 * GET    /api/groups/[slug]/site  — is this group published, and where?
 * PUT    /api/groups/[slug]/site  — publish it (admin/founder only)
 * DELETE /api/groups/[slug]/site  — unpublish it (admin/founder only)
 *
 * This endpoint IS the "few clicks": everything underneath it works off one
 * row, so turning a group into a website is this one call — no DNS, no Caddy,
 * no deploy. PUT is an upsert, so it both publishes and reconfigures; two verbs
 * would be two states where the database has one row.
 *
 * HTTP only. What may be published, and what publishing does, lives in
 * `@/services/sites/publish`.
 */

import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { revalidateTag } from 'next/cache';
import {
  apiSuccess,
  apiBadRequest,
  apiForbidden,
  apiNotFound,
  apiRateLimited,
  apiValidationError,
  handleApiError,
} from '@/lib/api/standardResponse';
import { rateLimitWriteAsync, retryAfterSeconds } from '@/lib/rate-limit';
import { logger } from '@/utils/logger';
import { checkGroupAdmin } from '@/domain/groups/helpers.server';
import { siteConfigSchema } from '@/config/hosted-site';
import { HOSTED_SITES_TAG } from '@/services/sites/registry';
import {
  publishRefusal,
  publishSite,
  readSiteFeature,
  resolveGroupForSite,
  siteAddress,
  unpublishSite,
  type SiteGroup,
} from '@/services/sites/publish';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

/** Resolve + authorise in one step; every verb here needs exactly this. */
async function requireAdminGroup(
  req: AuthenticatedRequest,
  slug: string
): Promise<{ group: SiteGroup } | { error: ReturnType<typeof apiNotFound> }> {
  const group = await resolveGroupForSite(req.supabase, slug);
  if (!group) {
    return { error: apiNotFound('Group not found') };
  }
  if (!(await checkGroupAdmin(req.supabase, group.id, req.user.id))) {
    return { error: apiForbidden('Only group admins and founders can manage the website') };
  }
  return { group };
}

export const GET = withAuth(async (req: AuthenticatedRequest, { params }: RouteContext) => {
  const { slug } = await params;
  try {
    const resolved = await requireAdminGroup(req, slug);
    if ('error' in resolved) {
      return resolved.error;
    }
    const { group } = resolved;
    const feature = await readSiteFeature(req.supabase, group.id);
    const refusal = publishRefusal(group);

    return apiSuccess({
      published: feature.enabled,
      // Returned even when unpublished, so the UI can offer "Publish at
      // acme.orangecat.ch" rather than a bare "Publish". It costs nothing.
      ...siteAddress(group, feature.config),
      eligible: refusal === null,
      reason: refusal,
      config: feature.config,
    });
  } catch (error) {
    logger.error('Reading site settings failed', { slug, error: String(error) }, 'Sites');
    return handleApiError(error);
  }
});

export const PUT = withAuth(async (req: AuthenticatedRequest, { params }: RouteContext) => {
  const { slug } = await params;
  try {
    const rl = await rateLimitWriteAsync(req.user.id);
    if (!rl.success) {
      return apiRateLimited('Too many requests. Please slow down.', retryAfterSeconds(rl));
    }

    const resolved = await requireAdminGroup(req, slug);
    if ('error' in resolved) {
      return resolved.error;
    }
    const { group } = resolved;

    const refusal = publishRefusal(group);
    if (refusal) {
      return apiBadRequest(refusal);
    }

    const body = await req.json().catch(() => ({}));
    const parsed = siteConfigSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return apiValidationError('Invalid site configuration', parsed.error.flatten().fieldErrors);
    }

    await publishSite(req.supabase, group, parsed.data, req.user.id);
    // Without this the site is live but the resolver holds its old answer for up
    // to a minute, and a publish button that takes a minute to visibly work
    // reads as a publish button that failed.
    revalidateTag(HOSTED_SITES_TAG, 'max');
    logger.info('Group website published', { group: group.slug }, 'Sites');

    return apiSuccess({ published: true, ...siteAddress(group, parsed.data) });
  } catch (error) {
    logger.error('Publishing a site failed', { slug, error: String(error) }, 'Sites');
    return handleApiError(error);
  }
});

export const DELETE = withAuth(async (req: AuthenticatedRequest, { params }: RouteContext) => {
  const { slug } = await params;
  try {
    const rl = await rateLimitWriteAsync(req.user.id);
    if (!rl.success) {
      return apiRateLimited('Too many requests. Please slow down.', retryAfterSeconds(rl));
    }

    const resolved = await requireAdminGroup(req, slug);
    if ('error' in resolved) {
      return resolved.error;
    }

    await unpublishSite(req.supabase, resolved.group);
    revalidateTag(HOSTED_SITES_TAG, 'max');
    logger.info('Group website unpublished', { group: slug }, 'Sites');

    return apiSuccess({ published: false });
  } catch (error) {
    logger.error('Unpublishing a site failed', { slug, error: String(error) }, 'Sites');
    return handleApiError(error);
  }
});
