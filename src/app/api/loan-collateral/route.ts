import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity, apiRateLimiter } from '@/utils/security'
import { createServerClient } from '@/lib/supabase/server'

const CollateralSchema = z.object({
  loan_id: z.string().min(1),
  asset_id: z.string().min(1),
  pledged_value: z.number().positive().optional().nullable(),
  currency: z.string().min(3).max(6).optional().default('USD'),
})

type CollateralInput = z.infer<typeof CollateralSchema>

const postHandler = withSecurity<CollateralInput>(
  async (data) => {
    const supabase = await createServerClient()
    const { data: auth } = await supabase.auth.getUser()
    const user = auth?.user
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership of loan and asset
    const { data: loan, error: loanErr } = await supabase
      .from('loans')
      .select('id, user_id')
      .eq('id', data.loan_id)
      .single()
    if (loanErr || !loan || loan.user_id !== user.id) {
      return NextResponse.json({ error: 'Loan not found or not owned' }, { status: 403 })
    }

    const { data: asset, error: assetErr } = await supabase
      .from('assets')
      .select('id, owner_id')
      .eq('id', data.asset_id)
      .single()
    if (assetErr || !asset || asset.owner_id !== user.id) {
      return NextResponse.json({ error: 'Asset not found or not owned' }, { status: 403 })
    }

    // Insert collateral link
    const { data: created, error } = await supabase
      .from('loan_collateral')
      .insert({
        loan_id: data.loan_id,
        asset_id: data.asset_id,
        owner_id: user.id,
        pledged_value: data.pledged_value ?? null,
        currency: data.currency || 'USD',
        status: 'pending',
      })
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to attach collateral' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: created.id })
  },
  CollateralSchema,
  { rateLimiter: apiRateLimiter, requireAuth: true, logActivity: true }
)

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const supabase = await createServerClient()
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth?.user?.id

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  try {
    // @ts-expect-error wrapper handles validation
    return await postHandler(body, { ip, userId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to attach collateral'
    const status =
      message === 'Authentication required'
        ? 401
        : message === 'Rate limit exceeded'
          ? 429
          : 400
    return NextResponse.json({ error: message }, { status })
  }
}

