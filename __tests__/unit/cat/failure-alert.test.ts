import { readFileSync } from 'fs';
import { join } from 'path';

import { alertCatChatFailure } from '@/services/cat/failure-alert';
import { getAdminClient } from '@/lib/supabase/admin';

jest.mock('@/lib/supabase/admin', () => ({ getAdminClient: jest.fn() }));

/**
 * Alerting a Cat chat failure must never make the failure worse.
 *
 * This runs inside the catch block of a request that has ALREADY failed. If it
 * throws, the user's error response is replaced by a different, worse failure —
 * so "cannot write the alert" has to degrade to silence plus a log line.
 */
describe('Cat failure alerting', () => {
  beforeEach(() => jest.clearAllMocks());

  it('never throws when the alert cannot be written', async () => {
    (getAdminClient as jest.Mock).mockImplementation(() => {
      throw new Error('no service key in this environment');
    });
    await expect(
      alertCatChatFailure({ code: 'ALL_PROVIDERS_DOWN', provider: 'groq', model: 'x' })
    ).resolves.toBeUndefined();
  });

  it('never throws when the insert itself rejects', async () => {
    const rejecting = {
      select: () => rejecting,
      eq: () => rejecting,
      order: () => rejecting,
      limit: () => rejecting,
      maybeSingle: () => Promise.resolve({ data: null }),
      insert: () => Promise.reject(new Error('RLS denied')),
    };
    (getAdminClient as jest.Mock).mockReturnValue({ from: () => rejecting });
    await expect(alertCatChatFailure({ code: 'STREAM_ERROR' })).resolves.toBeUndefined();
  });

  it('coalesces onto an existing unread alert for the same code instead of stacking rows', async () => {
    const update = jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({}) });
    const insert = jest.fn().mockResolvedValue({});
    const chain = {
      select: () => chain,
      eq: () => chain,
      order: () => chain,
      limit: () => chain,
      maybeSingle: () => Promise.resolve({ data: { id: 'n1', metadata: { occurrences: 3 } } }),
      update,
      insert,
    };
    (getAdminClient as jest.Mock).mockReturnValue({ from: () => chain });

    await alertCatChatFailure({ code: 'AI_RATE_LIMITED', provider: 'openrouter' });

    // A capacity outage hits every user at once; one row per request would
    // bury the very signal the alert exists to raise.
    expect(insert).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0][0].metadata.occurrences).toBe(4);
  });

  it('inserts a first alert when none is open', async () => {
    const insert = jest.fn().mockResolvedValue({});
    const chain = {
      select: () => chain,
      eq: () => chain,
      order: () => chain,
      limit: () => chain,
      maybeSingle: () => Promise.resolve({ data: null }),
      update: jest.fn(),
      insert,
    };
    (getAdminClient as jest.Mock).mockReturnValue({ from: () => chain });

    await alertCatChatFailure({ code: 'ALL_PROVIDERS_DOWN', provider: 'groq', model: 'llama' });

    expect(insert).toHaveBeenCalledTimes(1);
    const row = insert.mock.calls[0][0];
    expect(row.metadata.occurrences).toBe(1);
    expect(row.metadata.title).toBe('ALL_PROVIDERS_DOWN');
    expect(row.is_read).toBe(false);
    expect(row.message).toContain('got nothing back');
  });

  it('stays wired into the streaming failure path', () => {
    // Same reasoning as failed-turn.test.ts: the streaming path cannot be
    // unit-booted, and the regression being prevented is "the failure branch
    // silently stops alerting".
    const source = readFileSync(
      join(process.cwd(), 'src/services/cat/chat-orchestrator.ts'),
      'utf8'
    );
    const catchStart = source.indexOf('} catch (err) {', source.indexOf('async start(controller)'));
    const errorEmit = source.indexOf('event: error', catchStart);
    expect(source.slice(catchStart, errorEmit)).toContain('alertCatChatFailure');
  });
});
