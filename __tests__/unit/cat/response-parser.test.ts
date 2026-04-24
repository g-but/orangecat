/**
 * Unit tests for parseActionsFromResponse.
 * Covers action block extraction, entity type validation, and group name normalisation.
 */

import { parseActionsFromResponse } from '@/services/cat/response-parser';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function wrap(json: object, blockType = 'action'): string {
  return `\`\`\`${blockType}\n${JSON.stringify(json, null, 2)}\n\`\`\``;
}

function response(text: string, block: object, blockType = 'action'): string {
  return `${text}\n\n${wrap(block, blockType)}`;
}

// ─── create_entity parsing ────────────────────────────────────────────────────

describe('parseActionsFromResponse — create_entity', () => {
  it('parses a standard product action with title', () => {
    const content = response('Here is a product:', {
      type: 'create_entity',
      entityType: 'product',
      prefill: { title: 'Handmade Soap', description: 'Natural soap.', price_btc: 0.0005 },
    });

    const { message, actions } = parseActionsFromResponse(content);
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe('create_entity');
    const action = actions[0] as import('@/types/cat').SuggestedAction;
    expect(action.entityType).toBe('product');
    expect(action.prefill.title).toBe('Handmade Soap');
    expect(message).not.toContain('create_entity');
  });

  it('parses a group action using name as primary field and normalises to title', () => {
    const content = response('Let\'s create a group:', {
      type: 'create_entity',
      entityType: 'group',
      prefill: { name: 'Local Builders Guild', label: 'guild', description: 'We build stuff.' },
    });

    const { actions } = parseActionsFromResponse(content);
    expect(actions).toHaveLength(1);
    const action = actions[0] as import('@/types/cat').SuggestedAction;
    expect(action.entityType).toBe('group');
    // name should be promoted to title for UI rendering
    expect(action.prefill.title).toBe('Local Builders Guild');
    expect(action.prefill.name).toBe('Local Builders Guild');
  });

  it('parses a group action that has both title and name', () => {
    const content = response('Group time:', {
      type: 'create_entity',
      entityType: 'group',
      prefill: { title: 'Circle of Trust', name: 'Circle of Trust', label: 'circle' },
    });

    const { actions } = parseActionsFromResponse(content);
    expect(actions).toHaveLength(1);
    const action = actions[0] as import('@/types/cat').SuggestedAction;
    expect(action.prefill.title).toBe('Circle of Trust');
    expect(action.prefill.name).toBe('Circle of Trust');
  });

  it('rejects create_entity with neither title nor name', () => {
    const content = response('Bad block:', {
      type: 'create_entity',
      entityType: 'product',
      prefill: { description: 'No title here' },
    });

    const { actions } = parseActionsFromResponse(content);
    expect(actions).toHaveLength(0);
  });

  it('rejects create_entity for unknown entity type', () => {
    const content = response('Unknown:', {
      type: 'create_entity',
      entityType: 'unknown_type',
      prefill: { title: 'Something' },
    });

    const { actions } = parseActionsFromResponse(content);
    expect(actions).toHaveLength(0);
  });

  it('accepts all CAT_CREATABLE_ENTITY_TYPES including group', () => {
    const { CAT_CREATABLE_ENTITY_TYPES } = require('@/types/cat');
    expect(CAT_CREATABLE_ENTITY_TYPES).toContain('group');
    expect(CAT_CREATABLE_ENTITY_TYPES).toContain('product');
    expect(CAT_CREATABLE_ENTITY_TYPES).toContain('service');
    expect(CAT_CREATABLE_ENTITY_TYPES).toContain('project');
    expect(CAT_CREATABLE_ENTITY_TYPES).toContain('event');
  });
});

// ─── update_entity / publish_entity ──────────────────────────────────────────

describe('parseActionsFromResponse — update_entity', () => {
  it('parses an update_entity block', () => {
    const content = response('Here is an update:', {
      type: 'update_entity',
      entityType: 'product',
      entityId: 'abc-123',
      updates: { description: 'Better description.' },
    });

    const { actions } = parseActionsFromResponse(content);
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe('update_entity');
  });

  it('rejects update_entity without entityId', () => {
    const content = response('Bad update:', {
      type: 'update_entity',
      entityType: 'product',
      updates: { description: 'Whoops' },
    });

    const { actions } = parseActionsFromResponse(content);
    expect(actions).toHaveLength(0);
  });
});

describe('parseActionsFromResponse — publish_entity', () => {
  it('parses a publish_entity block', () => {
    const content = response('Publishing:', {
      type: 'publish_entity',
      entityType: 'service',
      entityId: 'svc-456',
    });

    const { actions } = parseActionsFromResponse(content);
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe('publish_entity');
  });
});

// ─── exec_action ─────────────────────────────────────────────────────────────

describe('parseActionsFromResponse — exec_action', () => {
  it('parses a set_reminder exec_action', () => {
    const content = response('Setting reminder:', {
      type: 'exec_action',
      actionId: 'set_reminder',
      parameters: { title: 'Call dentist', due_date: 'in 2 days' },
    }, 'exec_action');

    const { actions } = parseActionsFromResponse(content);
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe('exec_action');
    const exec = actions[0] as import('@/types/cat').ExecAction;
    expect(exec.actionId).toBe('set_reminder');
  });

  it('rejects exec_action with empty actionId', () => {
    const content = response('Bad exec:', {
      type: 'exec_action',
      actionId: '',
      parameters: {},
    }, 'exec_action');

    const { actions } = parseActionsFromResponse(content);
    expect(actions).toHaveLength(0);
  });
});

// ─── message cleaning ─────────────────────────────────────────────────────────

describe('parseActionsFromResponse — message cleaning', () => {
  it('removes action blocks from the message text', () => {
    const block = wrap({ type: 'create_entity', entityType: 'service', prefill: { title: 'Design Work' } });
    const content = `Here is my suggestion:\n\n${block}\n\nLet me know!`;

    const { message } = parseActionsFromResponse(content);
    expect(message).toContain('Here is my suggestion');
    expect(message).toContain('Let me know!');
    expect(message).not.toContain('create_entity');
  });

  it('handles invalid JSON blocks gracefully', () => {
    const content = 'Some text\n\n```action\nnot valid json\n```';
    expect(() => parseActionsFromResponse(content)).not.toThrow();
    const { actions } = parseActionsFromResponse(content);
    expect(actions).toHaveLength(0);
  });

  it('handles multiple action blocks in one response', () => {
    const block1 = wrap({ type: 'create_entity', entityType: 'service', prefill: { title: 'Service A' } });
    const block2 = wrap({ type: 'create_entity', entityType: 'product', prefill: { title: 'Product B' } });
    const content = `First:\n\n${block1}\n\nSecond:\n\n${block2}`;

    const { actions } = parseActionsFromResponse(content);
    expect(actions).toHaveLength(2);
  });
});
