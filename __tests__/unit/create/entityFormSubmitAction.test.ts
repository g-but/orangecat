/**
 * Unit tests for the generic entity form submit action — the single code
 * path every entity type's create AND edit form goes through.
 *
 * Locks in the SSOT edit convention:
 *   create → POST `config.apiEndpoint`            (+ actor_id when acting as group)
 *   edit   → PUT  `${config.apiEndpoint}/${id}`   (never reassigns actor_id)
 */

import { z } from 'zod';
import { executeEntityFormSubmit } from '@/components/create/EntityForm/hooks/entityFormSubmitAction';
import type { EntityConfig } from '@/components/create/types';

import type { Mock } from 'vitest';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('@/lib/analytics', () => ({
  entityEvents: { created: vi.fn() },
}));
vi.mock('@/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));
vi.mock('@/config/api-routes', () => ({
  API_ROUTES: { ENTITY_WALLETS: '/api/entity-wallets' },
}));

type TestData = { title: string; description?: string };

function makeConfig(overrides: Partial<EntityConfig<TestData>> = {}): EntityConfig<TestData> {
  return {
    type: 'cause',
    name: 'Cause',
    apiEndpoint: '/api/causes',
    successUrl: '/dashboard/causes/[id]',
    validationSchema: z.object({
      title: z.string().min(1),
      description: z.string().optional(),
    }),
    defaultValues: { title: '' },
    fieldGroups: [],
    ...overrides,
  } as unknown as EntityConfig<TestData>;
}

function makeParams(overrides: Record<string, unknown> = {}) {
  return {
    config: makeConfig(),
    formStateData: { title: 'My cause' } as TestData,
    mode: 'create' as const,
    entityId: undefined as string | undefined,
    user: { id: 'user-1' },
    onSuccess: undefined as ((data: TestData & { id: string }) => void) | undefined,
    onError: undefined,
    clearDraft: vi.fn(),
    setSubmitting: vi.fn(),
    setErrors: vi.fn(),
    onEntityCreated: vi.fn(),
    router: { push: vi.fn() },
    existingWalletLinkIdRef: { current: undefined as string | undefined },
    wizardMode: undefined,
    actorId: undefined as string | null | undefined,
    ...overrides,
  };
}

function mockFetchOk(data: Record<string, unknown>) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ success: true, data }),
    clone() {
      return this;
    },
  });
}

describe('executeEntityFormSubmit', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('create mode POSTs to config.apiEndpoint', async () => {
    global.fetch = mockFetchOk({ id: 'new-1', title: 'My cause' }) as unknown as typeof fetch;
    const params = makeParams();

    await executeEntityFormSubmit(params);

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/causes',
      expect.objectContaining({ method: 'POST' })
    );
    const body = JSON.parse((global.fetch as Mock).mock.calls[0][1].body);
    expect(body).toEqual({ title: 'My cause' });
    expect(params.clearDraft).toHaveBeenCalled();
    expect(params.onEntityCreated).toHaveBeenCalledWith({ id: 'new-1', title: 'My cause' });
  });

  it('create mode merges actor_id when acting as a group', async () => {
    global.fetch = mockFetchOk({ id: 'new-1' }) as unknown as typeof fetch;
    const params = makeParams({ actorId: 'actor-9' });

    await executeEntityFormSubmit(params);

    const body = JSON.parse((global.fetch as Mock).mock.calls[0][1].body);
    expect(body.actor_id).toBe('actor-9');
  });

  it('edit mode PUTs to `${apiEndpoint}/${entityId}` and never sends actor_id', async () => {
    global.fetch = mockFetchOk({ id: 'e-42', title: 'My cause' }) as unknown as typeof fetch;
    const onSuccess = vi.fn();
    const params = makeParams({
      mode: 'edit' as const,
      entityId: 'e-42',
      actorId: 'actor-9', // must be ignored in edit mode
      onSuccess,
    });

    await executeEntityFormSubmit(params);

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/causes/e-42',
      expect.objectContaining({ method: 'PUT' })
    );
    const body = JSON.parse((global.fetch as Mock).mock.calls[0][1].body);
    expect(body.actor_id).toBeUndefined();
    // Edit must NOT clear the create-draft or fire the created analytics event
    expect(params.clearDraft).not.toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith({ id: 'e-42', title: 'My cause' });
  });

  it('edit mode redirects via successUrl with tokens filled from the response', async () => {
    global.fetch = mockFetchOk({ id: 'e-42', slug: 'my-slug' }) as unknown as typeof fetch;
    const params = makeParams({
      config: makeConfig({ successUrl: '/groups/[slug]' }),
      mode: 'edit' as const,
      entityId: 'e-42',
    });

    await executeEntityFormSubmit(params);

    expect(params.router.push).toHaveBeenCalledWith('/groups/my-slug');
  });

  it('does not fetch when validation fails; surfaces field errors', async () => {
    global.fetch = vi.fn() as unknown as typeof fetch;
    const params = makeParams({ formStateData: { title: '' } as TestData });

    await executeEntityFormSubmit(params);

    expect(global.fetch).not.toHaveBeenCalled();
    expect(params.setErrors).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.any(String) })
    );
  });

  it('surfaces API errors as a general error without redirecting', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'You can only update your own causes' }),
      clone() {
        return this;
      },
    }) as unknown as typeof fetch;
    const params = makeParams({ mode: 'edit' as const, entityId: 'e-42' });

    await executeEntityFormSubmit(params);

    expect(params.setErrors).toHaveBeenCalledWith({
      general: 'You can only update your own causes',
    });
    expect(params.router.push).not.toHaveBeenCalled();
    expect(params.setSubmitting).toHaveBeenLastCalledWith(false);
  });
});
