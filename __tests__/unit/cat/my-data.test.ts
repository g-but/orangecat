import { queryMyData } from '@/services/cat/my-data';
import { MY_DATA_TOPICS } from '@/services/cat/my-data-topics';
import { PLATFORM_TOOL_DEFINITION, messageMightNeedTools } from '@/services/cat/tool-use-detection';
import type { AnySupabaseClient } from '@/lib/supabase/types';

/**
 * query_my_data is Cat's read surface — the answer to "how much did I earn?"
 * must come from live rows, phrased honestly, and a failing sub-query must
 * degrade to "could not be read" instead of throwing away the whole report.
 */

type QueryResponse = { data?: unknown; error?: unknown; count?: number | null };

/**
 * Chainable supabase mock: every filter/order method returns the builder, and
 * awaiting it pops the next queued response for that table (FIFO — several
 * sections may query the same table more than once).
 */
function supabaseWithTables(queues: Record<string, QueryResponse[]>) {
  const client = {
    from: (table: string) => {
      const builder: Record<string, unknown> = {};
      const chain = () => builder;
      for (const m of ['select', 'eq', 'in', 'gte', 'order', 'limit']) {
        builder[m] = chain;
      }
      builder.then = (resolve: (v: QueryResponse) => void) => {
        const queue = queues[table] ?? [];
        const next = queue.length > 0 ? queue.shift()! : { data: [], error: null, count: 0 };
        resolve({ data: next.data ?? [], error: next.error ?? null, count: next.count ?? null });
      };
      return builder;
    },
  } as unknown as AnySupabaseClient;
  return client;
}

describe('queryMyData', () => {
  it('lists entities per type and counts unpublished drafts', async () => {
    const client = supabaseWithTables({
      actors: [{ data: [{ id: 'actor-1' }] }],
      user_products: [
        {
          data: [
            { title: 'Ceramic mug', status: 'active' },
            { title: 'Sketchbook', status: 'draft' },
          ],
        },
      ],
    });
    const report = await queryMyData(client, 'u1', 'listings');
    expect(report).toContain('Products');
    expect(report).toContain('"Ceramic mug" (active)');
    expect(report).toContain('"Sketchbook" (draft)');
    expect(report).toContain('1 draft(s) are not published yet');
  });

  it('reports empty listings honestly', async () => {
    const client = supabaseWithTables({ actors: [{ data: [{ id: 'actor-1' }] }] });
    const report = await queryMyData(client, 'u1', 'listings');
    expect(report).toContain('none yet');
  });

  it('sums earnings from paid orders and settled payment intents', async () => {
    const client = supabaseWithTables({
      orders: [
        {
          data: [
            { entity_title: 'Mug', amount_btc: 0.001 },
            { entity_title: 'Print', amount_btc: 0.002 },
          ],
        },
      ],
      payment_intents: [{ data: [{ amount_btc: 0.0005, intent_kind: 'tip' }] }],
    });
    const report = await queryMyData(client, 'u1', 'earnings');
    expect(report).toContain('2 paid order(s) totaling 0.003 BTC');
    expect(report).toContain('1 settled tip payment(s) totaling 0.0005 BTC');
  });

  it('reports zero earnings honestly', async () => {
    const client = supabaseWithTables({});
    const report = await queryMyData(client, 'u1', 'earnings');
    expect(report).toContain('none recorded');
  });

  it('shows unread notification count with latest messages', async () => {
    const client = supabaseWithTables({
      notifications: [
        { data: [], count: 3 },
        { data: [{ message: 'Alice funded your project' }, { message: 'New follower' }] },
      ],
    });
    const report = await queryMyData(client, 'u1', 'notifications');
    expect(report).toContain('3 unread');
    expect(report).toContain('Alice funded your project');
  });

  it('flags overdue tasks', async () => {
    const client = supabaseWithTables({
      tasks: [
        {
          data: [
            { title: 'Ship order', priority: 'high', due_date: '2020-01-01', is_reminder: false },
            { title: 'Call back', priority: 'normal', due_date: null, is_reminder: true },
          ],
        },
      ],
    });
    const report = await queryMyData(client, 'u1', 'tasks');
    expect(report).toContain('2 open, 1 overdue');
    expect(report).toContain('[high]');
    expect(report).toContain('⏰ Call back');
  });

  it('degrades a failing section to an honest line instead of throwing', async () => {
    const client = supabaseWithTables({
      wallets: [{ data: null, error: { message: 'permission denied' } }],
    });
    const report = await queryMyData(client, 'u1', 'wallets');
    expect(report).toBe('WALLETS: could not be read right now.');
  });

  it('overview stitches all sections together', async () => {
    const client = supabaseWithTables({ actors: [{ data: [] }, { data: [] }] });
    const report = await queryMyData(client, 'u1', 'overview');
    for (const header of [
      'LISTINGS',
      'EARNINGS',
      'BOOKINGS',
      'WALLETS',
      'NOTIFICATIONS',
      'TASKS',
    ]) {
      expect(report).toContain(header);
    }
  });
});

describe('query_my_data wiring', () => {
  it('is declared as a platform tool with the topic enum', () => {
    const def = PLATFORM_TOOL_DEFINITION.find(t => t.function.name === 'query_my_data');
    expect(def).toBeDefined();
    const topicEnum = (
      def!.function.parameters as {
        properties: { topic: { enum: string[] } };
      }
    ).properties.topic.enum;
    expect(topicEnum).toEqual([...MY_DATA_TOPICS]);
  });

  it('read-style questions pass the tool prefilter', () => {
    for (const msg of [
      'How much did I earn this month?',
      'Show me my listings',
      'Any unread notifications?',
      'What is my wallet balance?',
      'Catch me up on my sales',
    ]) {
      expect(messageMightNeedTools(msg)).toBe(true);
    }
  });
});
