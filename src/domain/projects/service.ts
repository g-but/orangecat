import { createServerClient } from '@/lib/supabase/server';

export async function listProjectsPage(limit: number, offset: number, userId?: string) {
  const supabase = await createServerClient();
  
  // Build base query
  let query = supabase
    .from('projects')
    .select('*', { count: 'exact' });

  // If filtering by user_id, return all statuses (including drafts)
  // Otherwise, only return active projects
  if (userId) {
    query = query.eq('user_id', userId);
  } else {
    query = query.eq('status', 'active');
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  // Fetch profiles separately for better error handling
  const userIds = [...new Set((data || []).map((p: any) => p.user_id).filter(Boolean))];
  const profilesMap = new Map();
  
  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, name, avatar_url, email')
      .in('id', userIds);
    
    if (!profilesError && profiles) {
      profiles.forEach((profile: any) => {
        profilesMap.set(profile.id, profile);
      });
    }
  }

  const items = (data || []).map((project: any) => ({
    ...project,
    raised_amount: project.raised_amount ?? 0,
    profiles: project.user_id ? profilesMap.get(project.user_id) || null : null,
  }));

  // Supabase count is returned in header when using the select count:'exact'
  // However, the JS client returns it as part of the response if head is true; we issue range so count may be omitted
  // To ensure total, run a lightweight count query
  let countQuery = supabase
    .from('projects')
    .select('*', { count: 'exact', head: true });

  if (userId) {
    countQuery = countQuery.eq('user_id', userId);
  } else {
    countQuery = countQuery.eq('status', 'active');
  }

  const { count } = await countQuery;

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
