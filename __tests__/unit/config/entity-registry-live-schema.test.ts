/**
 * GUARD: the entity registry must agree with the live database schema.
 *
 * `scripts/db/live-schema.json` is a snapshot of the live self-hosted Postgres
 * (refreshed by the deploy pipeline via scripts/db/dump-live-schema.sh). Because
 * most of the codebase goes through an untyped Supabase client, a registry entry
 * pointing at a missing table or ownership column compiles fine and only fails
 * at runtime — this test catches that class of drift in CI.
 *
 * Context: `src/types/database.ts` (hand-corrected, dated 2025-12-19) had
 * drifted badly from the live schema (missing actor_id on several tables,
 * missing whole tables) and made the registry look wrong when it wasn't. The
 * live snapshot is the ground truth to check against, not database.ts.
 */
import fs from 'fs';
import path from 'path';
import { ENTITY_REGISTRY, ENTITY_TYPES } from '@/config/entity-registry';

const schemaPath = path.join(process.cwd(), 'scripts', 'db', 'live-schema.json');
const liveSchema: Record<string, string[]> = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

describe('entity registry ↔ live schema', () => {
  it.each(ENTITY_TYPES)('%s: tableName exists in the live schema', type => {
    const meta = ENTITY_REGISTRY[type];
    expect(Object.keys(liveSchema)).toContain(meta.tableName);
  });

  it.each(ENTITY_TYPES)('%s: userIdField is a real column of its table', type => {
    const meta = ENTITY_REGISTRY[type];
    const columns = liveSchema[meta.tableName];
    if (!columns) {
      return; // covered by the tableName assertion above
    }
    expect(columns).toContain(meta.userIdField);
  });

  it.each(ENTITY_TYPES)('%s: priceColumn (when declared) is a real column', type => {
    const meta = ENTITY_REGISTRY[type];
    if (!meta.priceColumn) {
      return;
    }
    const columns = liveSchema[meta.tableName];
    if (!columns) {
      return;
    }
    expect(columns).toContain(meta.priceColumn);
  });
});
