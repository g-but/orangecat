import {
  isValidUUID,
  isValidLightningAddress,
  isValidEmail,
  isValidUsername,
} from '@/lib/validation';

describe('isValidUUID', () => {
  it('accepts a valid v4 UUID', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('accepts uppercase UUID', () => {
    expect(isValidUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
  });

  it('accepts UUID with leading/trailing whitespace', () => {
    expect(isValidUUID('  550e8400-e29b-41d4-a716-446655440000  ')).toBe(true);
  });

  it('rejects a string without dashes', () => {
    expect(isValidUUID('550e8400e29b41d4a716446655440000')).toBe(false);
  });

  it('rejects a string that is too short', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidUUID('')).toBe(false);
  });

  it('rejects null (cast to any)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isValidUUID(null as any)).toBe(false);
  });

  it('rejects undefined (cast to any)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isValidUUID(undefined as any)).toBe(false);
  });

  it('rejects a random word', () => {
    expect(isValidUUID('not-a-uuid')).toBe(false);
  });
});

describe('isValidLightningAddress', () => {
  it('accepts a valid lightning address', () => {
    expect(isValidLightningAddress('user@domain.com')).toBe(true);
  });

  it('accepts alice@orangecat.app', () => {
    expect(isValidLightningAddress('alice@orangecat.app')).toBe(true);
  });

  it('accepts address with underscores and dashes in local part', () => {
    expect(isValidLightningAddress('test_user-1@strike.me')).toBe(true);
  });

  it('accepts address with subdomain', () => {
    expect(isValidLightningAddress('satoshi@wallet.getalby.com')).toBe(true);
  });

  it('rejects just a username with no @', () => {
    expect(isValidLightningAddress('user')).toBe(false);
  });

  it('rejects @domain.com with no local part', () => {
    expect(isValidLightningAddress('@domain.com')).toBe(false);
  });

  it('rejects user@ with no domain', () => {
    expect(isValidLightningAddress('user@')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidLightningAddress('')).toBe(false);
  });

  it('rejects null (cast to any)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isValidLightningAddress(null as any)).toBe(false);
  });
});

describe('isValidEmail', () => {
  it('accepts a standard email', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('accepts email with subdomain', () => {
    expect(isValidEmail('user@mail.example.com')).toBe(true);
  });

  it('accepts email with plus addressing', () => {
    expect(isValidEmail('user+tag@example.com')).toBe(true);
  });

  it('rejects email with no @', () => {
    expect(isValidEmail('userexample.com')).toBe(false);
  });

  it('rejects email with no domain', () => {
    expect(isValidEmail('user@')).toBe(false);
  });

  it('rejects email with spaces', () => {
    expect(isValidEmail('user @example.com')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('rejects null (cast to any)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isValidEmail(null as any)).toBe(false);
  });
});

describe('isValidUsername', () => {
  it('accepts a simple alphanumeric username', () => {
    expect(isValidUsername('alice123')).toBe(true);
  });

  it('accepts username with underscores and dashes', () => {
    expect(isValidUsername('alice_bob-99')).toBe(true);
  });

  it('accepts a 3-character username (minimum length)', () => {
    expect(isValidUsername('abc')).toBe(true);
  });

  it('accepts a 30-character username (maximum length)', () => {
    expect(isValidUsername('a'.repeat(30))).toBe(true);
  });

  it('rejects a 2-character username (too short)', () => {
    expect(isValidUsername('ab')).toBe(false);
  });

  it('rejects a 31-character username (too long)', () => {
    expect(isValidUsername('a'.repeat(31))).toBe(false);
  });

  it('rejects username with spaces', () => {
    expect(isValidUsername('alice bob')).toBe(false);
  });

  it('rejects username with special characters', () => {
    expect(isValidUsername('alice@bob')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidUsername('')).toBe(false);
  });

  it('rejects null (cast to any)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isValidUsername(null as any)).toBe(false);
  });
});
