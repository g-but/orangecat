import { listProjectsPage } from '@/domain/projects/service';

jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(),
}));

jest.mock('@/services/actors/getOrCreateUserActor', () => ({
  getOrCreateUserActor: jest.fn().mockResolvedValue({ id: 'a1' }),
}));

import { createServerClient } from '@/lib/supabase/server';

describe('Project list workflow', () => {
  const dataRows = [
    {
      id: 'p1',
      user_id: 'u1',
      title: 'A',
      status: 'active',
      raised_amount: null,
      profiles: {
        id: 'u1',
        username: 'alice',
        name: 'Alice',
        avatar_url: null,
        email: 'a@test.dev',
      },
    },
    {
      id: 'p2',
      user_id: 'u2',
      title: 'B',
      status: 'active',
      raised_amount: 1200,
      profiles: { id: 'u2', username: 'bob', name: 'Bob', avatar_url: null, email: 'b@test.dev' },
    },
  ];

  function makeQuery(result: any) {
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue(result),
    } as any;
  }

  function makeCountQuery(count: number) {
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ count }),
    } as any;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists active projects and maps profile info', async () => {
    const dataQuery = makeQuery({ data: dataRows, error: null });
    const countQuery = makeCountQuery(2);

    const from = jest
      .fn()
      .mockReturnValueOnce(dataQuery) // data query with profile join
      .mockReturnValueOnce(countQuery); // count query

    (createServerClient as jest.Mock).mockResolvedValue({ from });

    const result = await listProjectsPage(20, 0);

    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].profiles?.username).toBe('alice');
    expect(result.items[0].raised_amount).toBe(0);
    expect(result.items[1].raised_amount).toBe(1200);
  });

  it('applies user filter when userId is provided', async () => {
    const dataQuery = makeQuery({ data: [dataRows[0]], error: null });
    const countQuery = makeCountQuery(1);

    const from = jest.fn().mockReturnValueOnce(dataQuery).mockReturnValueOnce(countQuery);

    (createServerClient as jest.Mock).mockResolvedValue({ from });

    const result = await listProjectsPage(20, 0, 'u1');

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].user_id).toBe('u1');
  });
});
