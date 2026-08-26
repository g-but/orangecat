/**
 * A handle is not just a profile address.
 *
 * `utils/markdown.tsx` already tokenizes `@name` and links it to
 * `/profiles/name`, so whoever holds a handle owns every mention of that name
 * across the platform. `@cat` renders as a link today and nobody owns `cat` —
 * which is why reservation has to exist before the Cat is announced anywhere.
 *
 * These also pin the SSOT itself. The rules used to be written three times with
 * three answers: base.ts allowed 3–30, registerSchema 3–20, profileSchema 3–30.
 * A name you could not register was one you could rename to afterwards.
 */

import {
  isReservedUsername,
  reservedReason,
  normalizeUsername,
  isValidUsername,
  USERNAME_MAX_LENGTH,
} from '@/config/usernames';
import { registerSchema } from '@/lib/validation/auth';
import { profileSchema } from '@/lib/validation/base';

describe('reserved handles', () => {
  it('reserves the Cat', () => {
    expect(isReservedUsername('cat')).toBe(true);
    expect(reservedReason('cat')).toMatch(/Cat/);
  });

  it('reserves the spellings a reader would mistake for it', () => {
    // Impersonation only has to fool a human skimming a mention.
    for (const spelling of ['Cat', 'CAT', 'c-a-t', 'c.a.t', 'C_A_T', ' cat ']) {
      expect(isReservedUsername(spelling)).toBe(true);
    }
  });

  it('does not reserve ordinary words that merely contain one', () => {
    // Matching is exact after normalizing, not substring.
    for (const ok of ['category', 'catalog', 'cathy', 'concatenate', 'bobcat']) {
      expect(isReservedUsername(ok)).toBe(false);
    }
  });

  it('reserves the identities used to impersonate the platform', () => {
    for (const name of ['admin', 'support', 'security', 'billing', 'system']) {
      expect(isReservedUsername(name)).toBe(true);
    }
  });

  it('normalizes to the form two handles are compared in', () => {
    expect(normalizeUsername('My-Cat_')).toBe('mycat');
  });
});

describe('one set of username rules', () => {
  const base = { email: 'a@b.com', password: 'Str0ng!passw0rd', confirmPassword: 'Str0ng!passw0rd' };

  it('registration refuses a reserved handle', () => {
    const result = registerSchema.safeParse({ ...base, username: 'cat' });
    expect(result.success).toBe(false);
  });

  it('profile edit refuses it too — reservation cannot be sidestepped by renaming', () => {
    const result = profileSchema.safeParse({ username: 'cat' });
    expect(result.success).toBe(false);
  });

  it('registration and profile edit agree on length', () => {
    const long = 'a'.repeat(USERNAME_MAX_LENGTH);
    const tooLong = 'a'.repeat(USERNAME_MAX_LENGTH + 1);

    // Registration used to cap at 20, so this 30-character name was registerable
    // only by editing a profile afterwards.
    expect(registerSchema.safeParse({ ...base, username: long }).success).toBe(true);
    expect(profileSchema.safeParse({ username: long }).success).toBe(true);

    expect(registerSchema.safeParse({ ...base, username: tooLong }).success).toBe(false);
    expect(profileSchema.safeParse({ username: tooLong }).success).toBe(false);
  });

  it('still accepts an ordinary handle', () => {
    expect(isValidUsername('satoshi_n')).toBe(true);
    expect(registerSchema.safeParse({ ...base, username: 'satoshi_n' }).success).toBe(true);
  });
});
