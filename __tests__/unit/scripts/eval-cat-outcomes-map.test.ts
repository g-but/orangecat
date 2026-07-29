/**
 * SSOT guard: scripts/eval-cat-outcomes.mjs cannot import the TS entity
 * registry at runtime (plain node on the box), so it carries a mirror of the
 * create-action → table mapping. This test parses that mirror out of the
 * script and asserts it matches ENTITY_REGISTRY — if the registry changes,
 * this fails and points at the script.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ENTITY_REGISTRY, type EntityType } from '@/config/entity-registry';

describe('eval-cat-outcomes table map', () => {
  const script = readFileSync(path.join(process.cwd(), 'scripts', 'eval-cat-outcomes.mjs'), 'utf8');
  const block = script.match(/const CREATE_ACTION_TABLES = \{([\s\S]*?)\};/)?.[1] ?? '';
  const scriptMap = Object.fromEntries(
    [...block.matchAll(/create_([a-z_]+):\s*'([a-z_]+)'/g)].map(m => [m[1], m[2]])
  );

  it('parses a non-empty map out of the script', () => {
    expect(Object.keys(scriptMap).length).toBeGreaterThan(0);
  });

  it('matches ENTITY_REGISTRY table names for every mapped type', () => {
    for (const [type, table] of Object.entries(scriptMap)) {
      expect(ENTITY_REGISTRY[type as EntityType]?.tableName).toBe(table);
    }
  });
});
