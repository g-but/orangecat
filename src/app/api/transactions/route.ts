import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity, apiRateLimiter } from '@/utils/security'
import { createServerClient } from '@/lib/supabase/server'

const TransactionSchema = z.object({
  projectId: z.string().min(1).max(64),
  amount_sats: z.number().int().positive().max(1_000_000_000_000),
  payment_method: z.enum(['lightning', 'on-chain']),
  message: z.string().max(200).optional().nullable(),
})

type TransactionInput = z.infer<typeof TransactionSchema>

const handler = withSecurity<TransactionInput>(
  async (data) => {
    const supabase = await createServerClient()

    // Require user
    const { data: auth } = await supabase.auth.getUser()
    const user = auth?.user
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify project exists
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, title, bitcoin_address')
      .eq('id', data.projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Create pending transaction
    const insertPayload = {
      amount_sats: data.amount_sats,
      currency: 'sats',
      from_entity_type: 'profile',
      from_entity_id: user.id,
      to_entity_type: 'project',
      to_entity_id: project.id,
      payment_method: data.payment_method,
      status: 'pending',
      anonymous: false,
      message: data.message || null,
      public_visibility: true,
    }

    const { data: created, error: txError } = await supabase
      .from('transactions')
      .insert([insertPayload])
      .select('id')
      .single()
    if (txError) {
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: created.id, project })
  },
  TransactionSchema,
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
    // @ts-expect-error withSecurity expects unknown then validates
    return await handler(body, { ip, userId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create transaction'
    const status =
      message === 'Authentication required'
        ? 401
        : message === 'Rate limit exceeded'
          ? 429
          : 400
    return NextResponse.json({ error: message }, { status })
  }
}
