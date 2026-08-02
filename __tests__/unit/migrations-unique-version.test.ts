import fs from 'fs';
import path from 'path';

/**
 * Migration version prefixes must be unique.
 *
 * The Supabase CLI records applied migrations keyed by the 14-digit timestamp
 * prefix alone (not the filename), so two files sharing a prefix break every
 * fresh-DB replay with a schema_migrations_pkey violation — exactly what
 * happened when parallel branches both minted 20260731110000 (broke the
 * Migration Replay gate for two days, 2026-07-31 → 2026-08-02). This test
 * moves that failure from post-merge replay to pre-merge CI.
 */

const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations');

describe('supabase migration versions', () => {
  it('every migration file has a unique timestamp prefix', () => {
    const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql'));
    const byVersion = new Map<string, string[]>();
    for (const file of files) {
      const version = file.slice(0, 14);
      byVersion.set(version, [...(byVersion.get(version) ?? []), file]);
    }
    const collisions = [...byVersion.entries()].filter(([, names]) => names.length > 1);
    expect(collisions).toEqual([]);
  });

  it('every migration filename starts with a 14-digit timestamp', () => {
    const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql'));
    const malformed = files.filter(f => !/^\d{14}_/.test(f));
    expect(malformed).toEqual([]);
  });
});
