/**
 * Form values → claim entity.
 *
 * ADR-0004 D8 routes "someone else" through the SAME create form, so this
 * mapping is the seam where a form's field names meet the claim's draft shape.
 * It returns null rather than guessing, because a null is a visible error at
 * submit time while a guess is a bar created with the wrong name.
 */

import { toClaimEntity, canCreateForSomeoneElse } from '@/components/create/owner';

describe('canCreateForSomeoneElse', () => {
  it('allows only the entity types a claim draft can carry', () => {
    expect(canCreateForSomeoneElse('group')).toBe(true);
    expect(canCreateForSomeoneElse('project')).toBe(true);
    // Offering it here would walk a creator through the whole form and fail at
    // the end. A dead end is worse than an absent option.
    expect(canCreateForSomeoneElse('cause')).toBe(false);
    expect(canCreateForSomeoneElse('product')).toBe(false);
  });
});

describe('toClaimEntity', () => {
  it('maps a group form, taking the name from either field', () => {
    expect(toClaimEntity('group', { name: 'Löwenbar', label: 'company' })).toEqual({
      kind: 'group',
      name: 'Löwenbar',
      label: 'company',
      description: undefined,
      tags: undefined,
    });
    // Several create forms call the headline field `title`.
    expect(toClaimEntity('group', { title: 'Löwenbar' })).toMatchObject({
      kind: 'group',
      name: 'Löwenbar',
      label: 'circle',
    });
  });

  it('maps a project form', () => {
    expect(
      toClaimEntity('project', {
        title: 'New taproom',
        description: 'A second room at the back.',
        goal_amount: 5,
        currency: 'CHF',
      })
    ).toMatchObject({
      kind: 'project',
      title: 'New taproom',
      description: 'A second room at the back.',
      goalAmount: 5,
      currency: 'CHF',
    });
  });

  /**
   * The mapping must be at least as strict as `projectSchema`, or a draft
   * validates at creation and fails at MATERIALISATION — after the recipient
   * has already accepted. Every rule below is one the real schema enforces.
   */
  it('refuses a project with no description, because projectSchema requires one', () => {
    expect(toClaimEntity('project', { title: 'New taproom' })).toBeNull();
    expect(toClaimEntity('project', { title: 'New taproom', description: '  ' })).toBeNull();
  });

  it('drops a goal that is not a positive integer rather than passing it on', () => {
    const base = { title: 'New taproom', description: 'Out back.' };
    expect(toClaimEntity('project', { ...base, goal_amount: 0.5 })).toMatchObject({
      goalAmount: undefined,
    });
    expect(toClaimEntity('project', { ...base, goal_amount: -3 })).toMatchObject({
      goalAmount: undefined,
    });
  });

  it('drops a currency the platform does not know', () => {
    const base = { title: 'New taproom', description: 'Out back.' };
    expect(toClaimEntity('project', { ...base, currency: 'XYZ' })).toMatchObject({
      currency: undefined,
    });
  });

  it('falls back to a real group label rather than passing a bogus one through', () => {
    expect(toClaimEntity('group', { name: 'Löwenbar', label: 'not-a-label' })).toMatchObject({
      label: 'circle',
    });
  });

  it('returns null when there is no usable name', () => {
    expect(toClaimEntity('group', {})).toBeNull();
    expect(toClaimEntity('group', { name: '   ' })).toBeNull();
    expect(toClaimEntity('project', {})).toBeNull();
  });

  it('returns null for an entity type a claim cannot carry', () => {
    expect(toClaimEntity('cause', { title: 'Anything' })).toBeNull();
  });
});
