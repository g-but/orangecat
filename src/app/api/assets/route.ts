import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity, apiRateLimiter } from '@/utils/security'
import { createServerClient } from '@/lib/supabase/server'
import { DEFAULT_CURRENCY, CURRENCY_CODES } from '@/config/currencies'

const AssetSchema = z.object({
  title: z.string().min(3).max(100),
  type: z.enum(['real_estate', 'business', 'vehicle', 'equipment', 'securities', 'other']),
  description: z.string().max(2000).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  estimated_value: z.number().positive().optional().nullable(),
  currency: z.enum(CURRENCY_CODES).default(DEFAULT_CURRENCY),
  documents: z.array(z.string().url()).optional().nullable(),
})

type AssetInput = z.infer<typeof AssetSchema>

// POST /api/assets -> create asset (owner scoped)
const postHandler = withSecurity<AssetInput>(
  async (data) => {
    const supabase = await createServerClient()
    const { data: auth } = await supabase.auth.getUser()
    const user = auth?.user
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const insertPayload = {
      owner_id: user.id,
      type: data.type,
      title: data.title,
      description: data.description || null,
      location: data.location || null,
      estimated_value: data.estimated_value ?? null,
      currency: data.currency || DEFAULT_CURRENCY,
      documents: data.documents ?? null,
      verification_status: 'unverified' as const,
      status: 'draft' as const,
      public_visibility: false,
    }

    const { data: created, error } = await supabase
      .from('assets')
      .insert([insertPayload])
      .select('id, title, type, status, estimated_value, currency, created_at, verification_status')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 })
    }
    return NextResponse.json({ success: true, data: created })
  },
  AssetSchema,
  { rateLimiter: apiRateLimiter, requireAuth: true, logActivity: true }
)

// GET /api/assets -> list current user's assets
export async function GET(req: Request) {
  const supabase = await createServerClient()
  const { data: auth } = await supabase.auth.getUser()
  const user = auth?.user
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('assets')
    .select('id, title, type, status, estimated_value, currency, created_at, verification_status')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to load assets' }, { status: 500 })
  }
  return NextResponse.json({ data: data || [] })
}

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
    // @ts-expect-error withSecurity handles validation
    return await postHandler(body, { ip, userId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create asset'
    const status =
      message === 'Authentication required'
        ? 401
        : message === 'Rate limit exceeded'
          ? 429
          : 400
    return NextResponse.json({ error: message }, { status })
  }
}
