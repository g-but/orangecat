import { createServerClient } from '@/lib/supabase/server';

export async function listProjectsPage(limit: number, offset: number) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('projects')
    .select(
      `
      *,
      profiles!inner(id, username, name, avatar_url, email)
    `,
      { count: 'exact' }
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  const items = (data || []).map((project: any) => ({
    ...project,
    raised_amount: project.raised_amount ?? 0,
    profiles: Array.isArray(project.profiles) ? project.profiles[0] : project.profiles,
  }));

  // Supabase count is returned in header when using the select count:'exact'
  // However, the JS client returns it as part of the response if head is true; we issue range so count may be omitted
  // To ensure total, run a lightweight count query
  const { count } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  return { items, total: count || 0 };
}

export async function createProject(userId: string, payload: any) {
  const supabase = await createServerClient();
  const insertPayload = {
    user_id: userId,
    title: payload.title,
    description: payload.description,
    goal_amount: payload.goal_amount ?? null,
    currency: payload.currency ?? 'SATS',
    funding_purpose: payload.funding_purpose ?? null,
    bitcoin_address: payload.bitcoin_address ?? null,
    lightning_address: payload.lightning_address ?? null,
    website_url: payload.website_url ?? null,
    category: payload.category ?? null,
    tags: payload.tags ?? [],
    status: 'draft' as const,
  };

  const { data, error } = await supabase
    .from('projects')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error) {
    throw error;
  }
  return data;
}
