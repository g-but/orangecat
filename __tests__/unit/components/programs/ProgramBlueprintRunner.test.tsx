/**
 * The program runner is the "users can do this too" surface: it has to render
 * every step, let a user drop one, and create the rest through the ordinary
 * entity endpoints. These tests drive it the way a user does.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProgramBlueprintRunner } from '@/components/programs/ProgramBlueprintRunner';
import { COMPUTERS_TO_KIDS } from '@/config/program-blueprints';
import { ENTITY_REGISTRY } from '@/config/entity-registry';

// The actor switcher fetches the user's groups; it renders nothing for a
// single-actor user, which is the case under test.
jest.mock('@/components/create/ActorSelector', () => ({
  ActorSelector: () => null,
}));

const stepCount = COMPUTERS_TO_KIDS.buildSteps({}).length;

function mockFetchOk() {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: true,
    status: 201,
    json: async () => ({ success: true, data: { id: 'new-id' } }),
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

describe('ProgramBlueprintRunner', () => {
  it('lists every entity the program will create', () => {
    render(<ProgramBlueprintRunner blueprintId={COMPUTERS_TO_KIDS.id} />);

    expect(screen.getAllByRole('checkbox')).toHaveLength(stepCount);
    expect(screen.getByRole('button', { name: `Create ${stepCount} entities` })).toBeEnabled();
  });

  it('posts each enabled step to its own entity endpoint', async () => {
    const fetchMock = mockFetchOk();
    const user = userEvent.setup();
    render(<ProgramBlueprintRunner blueprintId={COMPUTERS_TO_KIDS.id} />);

    await user.click(screen.getByRole('button', { name: `Create ${stepCount} entities` }));

    // Every step, plus the wishlist's 10 machines.
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(stepCount + 10));
    const calledPaths = fetchMock.mock.calls.map(call => call[0] as string);
    expect(calledPaths).toContain(ENTITY_REGISTRY.product.apiEndpoint);
    expect(calledPaths).toContain(ENTITY_REGISTRY.cause.apiEndpoint);
    expect(calledPaths).toContain(ENTITY_REGISTRY.ai_assistant.apiEndpoint);
    // The wishlist's 10 machines are posted to the item sub-resource.
    expect(
      calledPaths.filter(path => path.startsWith(`${ENTITY_REGISTRY.wishlist.apiEndpoint}/`))
    ).toHaveLength(10);
  });

  it('skips a step the user unchecks', async () => {
    const fetchMock = mockFetchOk();
    const user = userEvent.setup();
    render(<ProgramBlueprintRunner blueprintId={COMPUTERS_TO_KIDS.id} />);

    await user.click(screen.getByRole('checkbox', { name: /include the group/i }));
    await user.click(screen.getByRole('button', { name: `Create ${stepCount - 1} entities` }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(stepCount - 1 + 10));
    const calledPaths = fetchMock.mock.calls.map(call => call[0] as string);
    expect(calledPaths).not.toContain(ENTITY_REGISTRY.group.apiEndpoint);
  });

  it('shows the failure against the step that failed', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ success: false, error: { message: 'Title is required' } }),
    }) as unknown as typeof fetch;
    const user = userEvent.setup();
    render(<ProgramBlueprintRunner blueprintId={COMPUTERS_TO_KIDS.id} />);

    await user.click(screen.getByRole('button', { name: `Create ${stepCount} entities` }));

    await waitFor(() => expect(screen.getAllByText('Title is required')).toHaveLength(stepCount));
  });
});
