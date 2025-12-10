import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { DEFAULT_CURRENCY, CURRENCY_CODES } from '@/config/currencies';

const AssetSchema = z.object({
  title: z.string().min(3).max(100),
  type: z.enum(['real_estate', 'business', 'vehicle', 'equipment', 'securities', 'other']),
  description: z.string().max(2000).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  estimated_value: z.number().positive().optional().nullable(),
  currency: z.enum(CURRENCY_CODES).default(DEFAULT_CURRENCY),
  documents: z.array(z.string().url()).optional().nullable(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = await createServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('assets')
    .select('id, title, type, status, estimated_value, currency, created_at, verification_status, description, location, documents')
    .eq('id', params.id)
    .eq('owner_id', user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  return NextResponse.json({ data });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const supabase = await createServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = AssetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid payload' }, { status: 400 });
  }

  const updatePayload = {
    ...parsed.data,
    documents: parsed.data.documents ?? null,
  };

  const { data, error } = await supabase
    .from('assets')
    .update(updatePayload)
    .eq('id', params.id)
    .eq('owner_id', user.id)
    .select('id, title, type, status, estimated_value, currency, created_at, verification_status, description, location, documents')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = await createServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase.from('assets').delete().eq('id', params.id).eq('owner_id', user.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
















