import type { AnySupabaseClient } from '@/lib/supabase/types';

export type ActionHandler = (
  supabase: AnySupabaseClient,
  userId: string,
  actorId: string,
  params: Record<string, unknown>
) => Promise<{ success: boolean; data?: unknown; error?: string }>;
