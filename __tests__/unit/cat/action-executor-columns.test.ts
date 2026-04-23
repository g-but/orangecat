/**
 * Cat Action Executor — DB Column Name Regression Tests
 *
 * These tests verify that each entity create handler sends the correct
 * column names to Supabase. They exist to catch the class of bug found
 * in April 2026, where 5 handlers used non-existent column names
 * (price_btc, hourly_rate_btc, goal_btc, category-vs-cause_category, etc.)
 * causing every Cat entity-creation action to fail at runtime.
 *
 * Strategy: mock Supabase + CatPermissionService, call executeAction,
 * then assert that the insert sent to the entity table used correct column names.
 * The action log insert (cat_action_log) is separated by table name so we
 * only verify the entity-specific payload.
 */

import { CatActionExecutor } from '@/services/cat/action-executor';
import { ENTITY_REGISTRY } from '@/config/entity-registry';

// ── Mock CatPermissionService ─────────────────────────────────────────────────
// Auto-allow every action: allowed=true, requiresConfirmation=false
jest.mock('@/services/cat/permission-service', () => ({
  CatPermissionService: jest.fn().mockImplementation(() => ({
    checkPermission: jest.fn().mockResolvedValue({ allowed: true, requiresConfirmation: false }),
  })),
}));

// ── Mock logger (suppress noise) ─────────────────────────────────────────────
jest.mock('@/utils/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

// ── Supabase mock factory ─────────────────────────────────────────────────────
// Tracks insert and update payloads per table so tests can inspect what was sent.
function buildMockSupabase() {
  const insertsByTable: Record<string, unknown[]> = {};
  const updatesByTable: Record<string, unknown[]> = {};

  const makeChain = (tableName: string) => {
    const chain = {
      insert: jest.fn((payload: unknown) => {
        if (!insertsByTable[tableName]) insertsByTable[tableName] = [];
        insertsByTable[tableName].push(payload);
        return chain;
      }),
      update: jest.fn((payload: unknown) => {
        if (!updatesByTable[tableName]) updatesByTable[tableName] = [];
        updatesByTable[tableName].push(payload);
        return chain;
      }),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'mock-id', title: 'mock' },
        error: null,
      }),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
    };
    return chain;
  };

  const supabase = {
    from: jest.fn((table: string) => makeChain(table)),
    _insertsByTable: insertsByTable,
    _updatesByTable: updatesByTable,
  };

  return supabase;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const USER_ID = 'user-123';
const ACTOR_ID = 'actor-456';

async function run(
  supabase: ReturnType<typeof buildMockSupabase>,
  actionId: string,
  parameters: Record<string, unknown>
) {
  const executor = new CatActionExecutor(supabase as never);
  return executor.executeAction(USER_ID, ACTOR_ID, { actionId, parameters });
}

function getEntityInsert(
  supabase: ReturnType<typeof buildMockSupabase>,
  tableName: string
): Record<string, unknown> | undefined {
  const rows = supabase._insertsByTable[tableName];
  return rows?.[0] as Record<string, unknown> | undefined;
}

function getEntityUpdate(
  supabase: ReturnType<typeof buildMockSupabase>,
  tableName: string
): Record<string, unknown> | undefined {
  const rows = supabase._updatesByTable[tableName];
  return rows?.[0] as Record<string, unknown> | undefined;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Cat action-executor — correct DB column names', () => {
  // ── create_product ──────────────────────────────────────────────────────────
  describe('create_product', () => {
    it('uses `price` (not price_btc) and includes required defaults', async () => {
      const supabase = buildMockSupabase();
      const result = await run(supabase, 'create_product', {
        title: 'My Widget',
        price_btc: 0.001,
        category: 'electronics',
      });

      expect(result.status).toBe('completed');
      const insert = getEntityInsert(supabase, ENTITY_REGISTRY.product.tableName);
      expect(insert).toBeDefined();

      // Correct column used
      expect(insert!.price).toBe(0.001);
      // Wrong column must NOT appear
      expect(insert!.price_btc).toBeUndefined();

      // Required defaults
      expect(insert!.currency).toBe('BTC');
      expect(insert!.product_type).toBe('physical');
      expect(insert!.fulfillment_type).toBe('manual');
      expect(Array.isArray(insert!.images)).toBe(true);
      expect(insert!.actor_id).toBe(ACTOR_ID);
      expect(insert!.status).toBe('draft');
    });

    it('falls back to `price` param when no price_btc provided', async () => {
      const supabase = buildMockSupabase();
      await run(supabase, 'create_product', { title: 'T', price: 0.005 });
      const insert = getEntityInsert(supabase, ENTITY_REGISTRY.product.tableName);
      expect(insert!.price).toBe(0.005);
    });

    it('sets status to active when publish=true', async () => {
      const supabase = buildMockSupabase();
      await run(supabase, 'create_product', { title: 'T', publish: true });
      const insert = getEntityInsert(supabase, ENTITY_REGISTRY.product.tableName);
      expect(insert!.status).toBe('active');
    });
  });

  // ── create_service ──────────────────────────────────────────────────────────
  describe('create_service', () => {
    it('uses `hourly_rate` (not hourly_rate_btc) for hourly pricing', async () => {
      const supabase = buildMockSupabase();
      await run(supabase, 'create_service', {
        title: 'Consulting',
        hourly_rate_btc: 0.0005,
      });

      const insert = getEntityInsert(supabase, ENTITY_REGISTRY.service.tableName);
      expect(insert!.hourly_rate).toBe(0.0005);
      expect(insert!.hourly_rate_btc).toBeUndefined();
      expect(insert!.currency).toBe('BTC');
      expect(insert!.service_location_type).toBe('remote');
      expect(Array.isArray(insert!.images)).toBe(true);
      expect(Array.isArray(insert!.portfolio_links)).toBe(true);
    });

    it('uses `fixed_price` (not fixed_price_btc) for fixed pricing', async () => {
      const supabase = buildMockSupabase();
      await run(supabase, 'create_service', {
        title: 'Logo Design',
        fixed_price_btc: 0.01,
      });

      const insert = getEntityInsert(supabase, ENTITY_REGISTRY.service.tableName);
      expect(insert!.fixed_price).toBe(0.01);
      expect(insert!.fixed_price_btc).toBeUndefined();
    });

    it('prefers hourly_rate over fixed_price when both present', async () => {
      const supabase = buildMockSupabase();
      await run(supabase, 'create_service', {
        title: 'Svc',
        hourly_rate: 0.001,
        fixed_price: 0.05,
      });

      const insert = getEntityInsert(supabase, ENTITY_REGISTRY.service.tableName);
      expect(insert!.hourly_rate).toBe(0.001);
      expect(insert!.fixed_price).toBeUndefined();
    });
  });

  // ── create_project ──────────────────────────────────────────────────────────
  describe('create_project', () => {
    it('uses `goal_amount` (not goal_btc) and includes currency', async () => {
      const supabase = buildMockSupabase();
      await run(supabase, 'create_project', {
        title: 'Open Source Tool',
        goal_btc: 1.5,
        category: 'technology',
      });

      const insert = getEntityInsert(supabase, ENTITY_REGISTRY.project.tableName);
      expect(insert!.goal_amount).toBe(1.5);
      expect((insert as Record<string, unknown>).goal_btc).toBeUndefined();
      expect(insert!.currency).toBe('BTC');
      expect(insert!.actor_id).toBe(ACTOR_ID);
    });

    it('falls back to goal_amount param when no goal_btc', async () => {
      const supabase = buildMockSupabase();
      await run(supabase, 'create_project', { title: 'P', goal_amount: 0.5 });
      const insert = getEntityInsert(supabase, ENTITY_REGISTRY.project.tableName);
      expect(insert!.goal_amount).toBe(0.5);
    });
  });

  // ── create_cause ────────────────────────────────────────────────────────────
  describe('create_cause', () => {
    it('uses `cause_category` (not category) and includes goal_amount + currency', async () => {
      const supabase = buildMockSupabase();
      await run(supabase, 'create_cause', {
        title: 'Feed the World',
        category: 'hunger',
        goal_btc: 10,
      });

      const insert = getEntityInsert(supabase, ENTITY_REGISTRY.cause.tableName);
      expect(insert!.cause_category).toBe('hunger');
      // `category` must NOT appear — it's not a DB column on causes
      expect(insert!.category).toBeUndefined();
      expect(insert!.goal_amount).toBe(10);
      expect(insert!.currency).toBe('BTC');
      expect(insert!.actor_id).toBe(ACTOR_ID);
    });

    it('accepts explicit cause_category param', async () => {
      const supabase = buildMockSupabase();
      await run(supabase, 'create_cause', {
        title: 'Cause',
        cause_category: 'education',
      });
      const insert = getEntityInsert(supabase, ENTITY_REGISTRY.cause.tableName);
      expect(insert!.cause_category).toBe('education');
      expect(insert!.category).toBeUndefined();
    });

    it('falls back to goal_amount param when no goal_btc', async () => {
      const supabase = buildMockSupabase();
      await run(supabase, 'create_cause', { title: 'C', goal_amount: 5 });
      const insert = getEntityInsert(supabase, ENTITY_REGISTRY.cause.tableName);
      expect(insert!.goal_amount).toBe(5);
    });
  });

  // ── create_event ────────────────────────────────────────────────────────────
  describe('create_event', () => {
    it('uses start_date and location with actor_id', async () => {
      const supabase = buildMockSupabase();
      await run(supabase, 'create_event', {
        title: 'Bitcoin Meetup',
        start_date: '2026-06-01T18:00:00Z',
        location: 'Zurich',
      });

      const insert = getEntityInsert(supabase, ENTITY_REGISTRY.event.tableName);
      expect(insert!.start_date).toBe('2026-06-01T18:00:00Z');
      expect(insert!.location).toBe('Zurich');
      expect(insert!.actor_id).toBe(ACTOR_ID);
      expect(insert!.status).toBe('draft');
    });
  });

  // ── create_asset ────────────────────────────────────────────────────────────
  describe('create_asset', () => {
    it('includes verification_status, currency, and public_visibility defaults', async () => {
      const supabase = buildMockSupabase();
      await run(supabase, 'create_asset', {
        title: 'My Apartment',
        asset_type: 'real_estate',
        location: 'Geneva',
      });

      const insert = getEntityInsert(supabase, ENTITY_REGISTRY.asset.tableName);
      expect(insert!.type).toBe('real_estate');
      expect(insert!.location).toBe('Geneva');
      expect(insert!.currency).toBe('BTC');
      expect(insert!.verification_status).toBe('unverified');
      expect(insert!.public_visibility).toBe(false);
      expect(insert!.actor_id).toBe(ACTOR_ID);
    });
  });

  // ── update_entity ───────────────────────────────────────────────────────────
  describe('update_entity', () => {
    it('passes cause_category through to causes table (not silently dropped)', async () => {
      const supabase = buildMockSupabase();
      const result = await run(supabase, 'update_entity', {
        entity_type: 'cause',
        entity_id: 'cause-abc',
        updates: { cause_category: 'environment' },
      });

      // Must succeed — not "No valid fields to update"
      expect(result.status).toBe('completed');
      const update = getEntityUpdate(supabase, ENTITY_REGISTRY.cause.tableName);
      expect(update).toBeDefined();
      expect(update!.cause_category).toBe('environment');
      // `category` must NOT appear in the update payload
      expect(update!.category).toBeUndefined();
    });

    it('passes common safe fields through for any entity', async () => {
      const supabase = buildMockSupabase();
      await run(supabase, 'update_entity', {
        entity_type: 'product',
        entity_id: 'prod-123',
        updates: { title: 'New Title', description: 'Updated', status: 'active' },
      });

      const update = getEntityUpdate(supabase, ENTITY_REGISTRY.product.tableName);
      expect(update!.title).toBe('New Title');
      expect(update!.description).toBe('Updated');
      expect(update!.status).toBe('active');
    });

    it('rejects updates with only non-safe fields', async () => {
      const supabase = buildMockSupabase();
      const result = await run(supabase, 'update_entity', {
        entity_type: 'product',
        entity_id: 'prod-123',
        // price is intentionally NOT in safeFields (financial field)
        updates: { price: 9999 },
      });

      expect(result.status).toBe('failed');
      expect(result.error).toMatch(/no valid fields/i);
    });
  });
});
