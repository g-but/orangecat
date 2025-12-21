import { createServerClient } from '@/lib/supabase/server'
import type { AssetInput } from './schema'
import { DEFAULT_CURRENCY } from '@/config/currencies'

export async function listAssets(userId: string) {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('assets')
    .select('id, title, type, status, estimated_value, currency, created_at, verification_status')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function listAssetsPage(userId: string, limit: number, offset: number) {
  const supabase = await createServerClient()
  const itemsQuery = supabase
    .from('assets')
    .select('id, title, type, status, estimated_value, currency, created_at, verification_status')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const countQuery = supabase
    .from('assets')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', userId)

  const [{ data, error }, { count, error: countError }] = await Promise.all([itemsQuery, countQuery])
  if (error) throw error
  if (countError) throw countError
  return { items: data || [], total: count || 0 }
}

export async function createAsset(userId: string, input: AssetInput) {
  const supabase = await createServerClient()
  const insertPayload = {
    owner_id: userId,
    type: input.type,
    title: input.title,
    description: input.description || null,
    location: input.location || null,
    estimated_value: input.estimated_value ?? null,
    currency: input.currency ?? DEFAULT_CURRENCY,
    documents: input.documents ?? null,
    verification_status: 'unverified' as const,
    status: 'draft' as const,
    public_visibility: false,
  }
  const { data, error } = await supabase
    .from('assets')
    .insert([insertPayload])
    .select('id, title, type, status, estimated_value, currency, created_at, verification_status')
    .single()
  if (error) throw error
  return data
}
