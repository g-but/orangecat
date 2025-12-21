import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { compose } from '@/lib/api/compose'
import { withRateLimit } from '@/lib/api/withRateLimit'
import { withZodBody } from '@/lib/api/withZod'
import { apiSuccess, apiUnauthorized, apiError } from '@/lib/api/standardResponse'
import { loanSchema } from '@/lib/validation'
import { listLoans, createLoan } from '@/domain/loans/service'
import { rateLimitWrite } from '@/lib/rate-limit'
import { withRequestId } from '@/lib/api/withRequestId'

// GET /api/loans - list available loans (public)
export const GET = compose(withRequestId(), withRateLimit('read'))(async (_req: NextRequest) => {
  try {
    const data = await listLoans()
    return apiSuccess(data, { cache: 'SHORT' })
  } catch {
    return apiSuccess([])
  }
})

// POST /api/loans - create a new loan (mock mode supported)
export const POST = compose(withRequestId(), withZodBody(loanSchema))(async (request: NextRequest, ctx) => {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return apiUnauthorized();
    }

    // per-user write rate limit
    const rl = rateLimitWrite(user.id)
    if (!rl.success) {
      const retryAfter = Math.ceil((rl.resetTime - Date.now()) / 1000)
      return apiError('Rate limit exceeded', 'RATE_LIMITED', 429, { retryAfter })
    }

    const loan = await createLoan(user.id, ctx.body)
    return apiSuccess(loan, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create loan'
    return apiError(message, 'INTERNAL_ERROR', 500)
  }
})
