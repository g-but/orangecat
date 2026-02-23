import { createServerClient } from '@/lib/supabase/server';
import { getTableName } from '@/config/entity-registry';
import { PROJECT_STATUS } from '@/config/project-statuses';

export async function listProjectsPage(limit: number, offset: number, userId?: string) {
  const supabase = await createServerClient();
  const tableName = getTableName('project');

  // Build filter condition (shared between data and count queries)
  const applyFilter = (query: ReturnType<typeof supabase.from>) => {
    if (userId) {
      return query.eq('user_id', userId);
    }
    return query.eq('status', PROJECT_STATUS.ACTIVE);
  };

  // Run data query (with profile join) and count query in parallel
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dataQuery = applyFilter(
    (supabase.from(tableName) as any).select(
      '*, profiles:user_id(id, username, name, avatar_url, email)'
    )
  )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const countQuery = applyFilter(
    (supabase.from(tableName) as any).select('*', { count: 'exact', head: true })
  );

  const [{ data, error }, { count }] = await Promise.all([dataQuery, countQuery]);

  if (error) {
    throw error;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (data || []).map((project: any) => ({
    ...project,
    raised_amount: project.raised_amount ?? 0,
  }));

  return { items, total: count || 0 };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from(getTableName('project')) as any)
    .insert(insertPayload)
    .select('*')
    .single();

  if (error) {
    throw error;
  }
  return data;
}
