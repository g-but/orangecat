import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { apiSuccess, apiUnauthorized, apiError } from '@/lib/api/standardResponse'
import { compose } from '@/lib/api/compose'
import { withZodBody } from '@/lib/api/withZod'
import { withRateLimit } from '@/lib/api/withRateLimit'
import { assetSchema } from '@/domain/assets/schema'
import { createAsset, listAssets, listAssetsPage } from '@/domain/assets/service'
import { withRequestId } from '@/lib/api/withRequestId'
import { getPagination } from '@/lib/api/query'
import { rateLimitWrite } from '@/lib/rate-limit'
import { logger } from '@/utils/logger'

// GET /api/assets -> list current user's assets
export const GET = compose(withRequestId(), withRateLimit('read'))(async (req: NextRequest) => {
  const supabase = await createServerClient()
  const { data: auth } = await supabase.auth.getUser()
  const user = auth?.user
  if (!user) {
    return apiUnauthorized()
  }

  try {
    const { limit, offset } = getPagination(req.url, { defaultLimit: 12, maxLimit: 100 })
    const { items, total } = await listAssetsPage(user.id, limit, offset)
    return apiSuccess(items, { cache: 'SHORT', page: Math.floor(offset/limit)+1, limit, total })
  } catch (error) {
    return apiError('Failed to load assets', 'INTERNAL_ERROR', 500)
  }
})

// POST /api/assets -> create asset (owner scoped)
export const POST = compose(withZodBody(assetSchema))(async (req: NextRequest, ctx) => {
  const supabase = await createServerClient()
  const { data: auth } = await supabase.auth.getUser()
  const user = auth?.user
  if (!user) {
    return apiUnauthorized()
  }

  // Per-user write rate limit
  const rl = rateLimitWrite(user.id)
  if (!rl.success) {
    const retryAfter = Math.ceil((rl.resetTime - Date.now()) / 1000)
    return apiError('Rate limit exceeded', 'RATE_LIMITED', 429, { retryAfter })
  }

  try {
    const created = await createAsset(user.id, ctx.body)
    logger.info('Asset created', { assetId: created.id })
    return apiSuccess(created, { status: 201 })
  } catch (error) {
    return apiError('Failed to create asset', 'INTERNAL_ERROR', 500)
  }
})
