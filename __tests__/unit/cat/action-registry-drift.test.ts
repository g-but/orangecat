import { CAT_ACTIONS } from '@/config/cat-actions';
import { ACTION_HANDLERS } from '@/services/cat/handlers';
import {
  buildCatSystemPrompt,
  buildActionCatalogAppendix,
  PROSE_DOCUMENTED_ACTION_IDS,
} from '@/services/cat/system-prompt';
import { CAT_CREATABLE_ENTITY_TYPES } from '@/types/cat';

/**
 * The three parallel registries around Cat actions — CAT_ACTIONS (what exists),
 * ACTION_HANDLERS (what executes), and the system prompt (what the model can
 * SEE) — have drifted apart repeatedly: #542 shipped a verb the executor didn't
 * know, and a 2026-08 audit found 13 enabled actions the model was never told
 * about (effectively unreachable from chat). These tests make every drift a
 * build failure.
 */

const enabledActionIds = Object.values(CAT_ACTIONS)
  .filter(a => a.enabled)
  .map(a => a.id);

describe('Cat action registry drift', () => {
  it('every enabled action has an executable handler', () => {
    const missing = enabledActionIds.filter(id => typeof ACTION_HANDLERS[id] !== 'function');
    expect(missing).toEqual([]);
  });

  it('every handler is a registered action (no orphan handlers)', () => {
    const orphans = Object.keys(ACTION_HANDLERS).filter(id => !CAT_ACTIONS[id]);
    expect(orphans).toEqual([]);
  });

  it('every action id keyed in CAT_ACTIONS matches its declared id', () => {
    for (const [key, action] of Object.entries(CAT_ACTIONS)) {
      expect(action.id).toBe(key);
    }
  });

  it('every creatable entity type has a create path from chat', () => {
    // organization creates via create_organization; document via add_context.
    const CREATE_ACTION_FOR: Record<string, string> = {
      organization: 'create_organization',
      document: 'add_context',
    };
    const missing = CAT_CREATABLE_ENTITY_TYPES.filter(type => {
      const actionId = CREATE_ACTION_FOR[type] ?? `create_${type}`;
      return !CAT_ACTIONS[actionId]?.enabled;
    });
    expect(missing).toEqual([]);
  });

  it('the system prompt mentions EVERY enabled action (prose or appendix)', () => {
    const prompt = buildCatSystemPrompt({});
    const invisible = enabledActionIds.filter(id => !prompt.includes(id));
    expect(invisible).toEqual([]);
  });

  it('prose-documented ids actually exist in the registry', () => {
    const stale = [...PROSE_DOCUMENTED_ACTION_IDS].filter(id => !CAT_ACTIONS[id]);
    expect(stale).toEqual([]);
  });

  it('the appendix is generated (not empty) and lists undocumented actions once each', () => {
    const appendix = buildActionCatalogAppendix();
    expect(appendix).toContain('create_product(');
    expect(appendix).toContain('update_entity(');
    expect(appendix).toContain('create_circle(');
    // Prose-documented actions must NOT be duplicated into the appendix.
    expect(appendix).not.toContain('**send_payment(');
  });
});
