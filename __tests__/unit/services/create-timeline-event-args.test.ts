/**
 * The app and the database agree on a function's ARGUMENT NAMES, or nothing works.
 *
 * PostgREST resolves an RPC by the set of named arguments in the request body.
 * Send a key the function does not declare and you get PGRST202 — "could not
 * find the function" — the *same* error as a function that does not exist at
 * all. So a rename on either side degrades into the exact failure that left
 * replies and reposts dead for eight months, and it degrades silently.
 *
 * check-rpc-exists.mjs guards the function NAME. This guards the arguments,
 * which is the other half of the same contract. Both files are read from disk
 * so neither can drift without this failing.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '../../..');
const MIGRATION = join(
  ROOT,
  'supabase/migrations/20260826020000_create_timeline_event_function.sql'
);
const SERVICE = join(ROOT, 'src/services/timeline/mutations/events-create.ts');

/** Parameter names declared by CREATE FUNCTION create_timeline_event(...). */
function declaredParams(): Set<string> {
  const sql = readFileSync(MIGRATION, 'utf8');
  const start = sql.indexOf('CREATE OR REPLACE FUNCTION public.create_timeline_event(');
  expect(start).toBeGreaterThan(-1);
  const body = sql.slice(start, sql.indexOf('RETURNS uuid', start));
  return new Set([...body.matchAll(/^\s*(p_[a-z_]+)\s+\w/gm)].map(m => m[1]));
}

/** Argument names the service actually sends in its eventData literal. */
function sentArgs(): Set<string> {
  const src = readFileSync(SERVICE, 'utf8');
  const start = src.indexOf('const eventData = {');
  expect(start).toBeGreaterThan(-1);
  const body = src.slice(start, src.indexOf('\n    };', start));
  return new Set([...body.matchAll(/^\s*(p_[a-z_]+):/gm)].map(m => m[1]));
}

describe('create_timeline_event argument contract', () => {
  it('declares every argument the service sends', () => {
    const declared = declaredParams();
    const sent = sentArgs();
    expect(sent.size).toBeGreaterThan(10);
    const undeclared = [...sent].filter(a => !declared.has(a));
    expect(undeclared).toEqual([]);
  });

  it('sends the actor and parent arguments the repair depends on', () => {
    const sent = sentArgs();
    // Without p_actor_id the function cannot check impersonation; without
    // p_parent_event_id a reply is just another top-level post.
    expect(sent.has('p_actor_id')).toBe(true);
    expect(sent.has('p_parent_event_id')).toBe(true);
    expect(sent.has('p_thread_id')).toBe(true);
  });

  it('gives every declared parameter a default, so callers may omit any of them', () => {
    // Only p_event_type is required; everything else defaults. A parameter
    // added later without a DEFAULT would break every existing call site.
    const sql = readFileSync(MIGRATION, 'utf8');
    const start = sql.indexOf('CREATE OR REPLACE FUNCTION public.create_timeline_event(');
    const body = sql.slice(start, sql.indexOf('RETURNS uuid', start));
    const withoutDefault = [...body.matchAll(/^\s*(p_[a-z_]+)\s+[\w[\]]+\s*(.*)$/gm)]
      .filter(m => !/DEFAULT/i.test(m[2]))
      .map(m => m[1]);
    expect(withoutDefault).toEqual(['p_event_type']);
  });
});
