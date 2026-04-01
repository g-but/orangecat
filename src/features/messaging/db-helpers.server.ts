/**
 * Typed database access helpers for messaging modules.
 *
 * Supabase's `.from()` on a `SupabaseClient<Database>` requires a table name
 * that is a literal key of `Database['public']['Tables']`. When names come
 * from the `DATABASE_TABLES` constant this works correctly (`as const`),
 * but some tables used by messaging may not yet be in the generated
 * `Database` type (e.g. views, or tables added after the last codegen).
 *
 * This helper centralises a single type-assertion so every consumer stays
 * `as any`-free.
 */
import { createAdminClient } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

type PublicTableName = keyof Database['public']['Tables'] & string;

/**
 * Call `.from(table)` on the given admin client.
 *
 * If `table` is a known key of `Database['public']['Tables']` the return
 * type is fully inferred. Otherwise it falls back to `any` — but
 * the assertion lives here, not scattered across every call-site.
 */
export function clientFrom<T extends string>(
  admin: SupabaseClient<Database>,
  table: T
): T extends PublicTableName
  ? ReturnType<SupabaseClient<Database>['from']>
  : ReturnType<SupabaseClient<Database>['from']> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return admin.from(table as any);
}

/**
 * Shorthand: create a fresh admin client and call `.from(table)`.
 */
export function adminFrom<T extends string>(table: T) {
  return clientFrom(createAdminClient(), table);
}
