import { profileSchema, PROFILE_UPDATABLE_FIELDS } from '@/lib/validation';

/**
 * The profile PUT allow-list is DERIVED from profileSchema — this test pins
 * the contract so nobody reintroduces a hand-written copy. The old copy in
 * the API route silently dropped currency, background, and
 * inspiration_statement from every save (the request succeeded, the fields
 * vanished — the worst kind of bug).
 */

describe('PROFILE_UPDATABLE_FIELDS', () => {
  it('is exactly the schema shape — derivation, not a hand list', () => {
    expect([...PROFILE_UPDATABLE_FIELDS].sort()).toEqual(Object.keys(profileSchema.shape).sort());
  });

  it('includes the fields the old hand list silently dropped', () => {
    for (const field of ['currency', 'background', 'inspiration_statement']) {
      expect(PROFILE_UPDATABLE_FIELDS).toContain(field);
    }
  });

  it('never exposes server-managed columns', () => {
    for (const field of ['id', 'email', 'created_at', 'updated_at']) {
      expect(PROFILE_UPDATABLE_FIELDS).not.toContain(field);
    }
  });
});
