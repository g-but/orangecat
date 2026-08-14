/**
 * The blueprint runner posts to the entity's real endpoint and reports per-step
 * outcomes. These tests pin the two things a user notices when they break: the
 * endpoint/child paths it calls, and the fact that one failed step does not
 * silently look like success.
 */

import { runBlueprintStep } from '@/services/programs/runBlueprint';
import { ENTITY_REGISTRY } from '@/config/entity-registry';
import type { BlueprintStep } from '@/config/program-blueprints';

const causeStep: BlueprintStep = {
  key: 'cause',
  entityType: 'cause',
  role: 'test',
  payload: { title: 'Funded seats' },
};

const wishlistStep: BlueprintStep = {
  key: 'wishlist',
  entityType: 'wishlist',
  role: 'test',
  payload: { title: 'Machines' },
  children: {
    pathSuffix: '/items',
    label: 'machines',
    payloads: [{ title: 'Machine 01' }, { title: 'Machine 02' }],
  },
};

function jsonResponse(body: unknown, ok = true, status = ok ? 201 : 400): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as unknown as Response;
}

describe('runBlueprintStep', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('posts to the entity endpoint from the registry and returns the created id', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: { id: 'cause-1' } }));

    const result = await runBlueprintStep(causeStep);

    expect(fetchMock).toHaveBeenCalledWith(
      ENTITY_REGISTRY.cause.apiEndpoint,
      expect.objectContaining({ method: 'POST' })
    );
    expect(result).toMatchObject({ status: 'created', id: 'cause-1' });
    expect(result.href).toBe(`${ENTITY_REGISTRY.cause.publicBasePath}/cause-1`);
  });

  it('passes a selected actor through so a program can be created as a group', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: { id: 'cause-1' } }));

    await runBlueprintStep(causeStep, { actorId: 'actor-9' });

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.actor_id).toBe('actor-9');
  });

  it('omits actor_id entirely when creating personally', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: { id: 'cause-1' } }));

    await runBlueprintStep(causeStep, { actorId: null });

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect('actor_id' in body).toBe(false);
  });

  it('creates children under the parent id and counts them', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ success: true, data: { id: 'wl-1' } }))
      .mockResolvedValueOnce(jsonResponse({ success: true, data: { id: 'item-1' } }))
      .mockResolvedValueOnce(jsonResponse({ success: false }, false, 400));

    const result = await runBlueprintStep(wishlistStep);

    expect(fetchMock.mock.calls[1][0]).toBe(`${ENTITY_REGISTRY.wishlist.apiEndpoint}/wl-1/items`);
    expect(result).toMatchObject({
      status: 'created',
      childrenCreated: 1,
      childrenFailed: 1,
    });
  });

  it('surfaces the API error message instead of pretending it worked', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ success: false, error: { message: 'Goal must be positive' } }, false, 400)
    );

    const result = await runBlueprintStep(causeStep);

    expect(result.status).toBe('failed');
    expect(result.error).toBe('Goal must be positive');
  });

  it('reports a network failure as a failed step rather than throwing', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));

    await expect(runBlueprintStep(causeStep)).resolves.toMatchObject({
      status: 'failed',
      error: 'offline',
    });
  });

  it('addresses a created group by slug in the link but by id for children', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { id: 'group-1', slug: 'ten-computers' } })
    );

    const result = await runBlueprintStep({
      key: 'group',
      entityType: 'group',
      role: 'test',
      payload: { name: 'Ten Computers' },
    });

    expect(result.href).toBe(`${ENTITY_REGISTRY.group.publicBasePath}/ten-computers`);
  });
});
