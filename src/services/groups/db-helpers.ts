/**
 * Groups Service Database Helpers
 *
 * Consolidates the single `as any` escape hatch needed for dynamic table names
 * into one file, instead of scattering it across 50+ call sites.
 *
 * WHY: Supabase's TypeScript client types `from()` against a generated schema.
 * When table names come from runtime constants (TABLES.group_events, etc.),
 * TypeScript can't narrow the return type. Rather than casting at every call
 * site, we centralize the cast here.
 *
 * Created: 2026-03-31
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnySupabaseClient = SupabaseClient<any, any, any>;

/**
 * Call `supabase.from(table)` with a dynamic table name.
 *
 * Returns an untyped query builder so callers don't need individual `as any` casts.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromTable(sb: AnySupabaseClient, table: string): any {
  return sb.from(table);
}

/**
 * Call `supabase.rpc(fn, params)` with a dynamic function name.
 *
 * Returns an untyped result so callers don't need individual `as any` casts.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function callRpc(sb: AnySupabaseClient, fn: string, params?: Record<string, unknown>): any {
  return sb.rpc(fn as never, params as never);
}
