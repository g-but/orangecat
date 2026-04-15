import {
  isValidUUID,
  isValidBitcoinAddress,
  isValidLightningInvoice,
  isValidLightningAddress,
  isValidEmail,
  isValidUsername,
} from '@/utils/validation';

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

describe('isValidBitcoinAddress', () => {
  // Synthetic addresses that conform to the regex (Base58: uppercase A-H, J-N, P-Z, 0-9)
  // The validation regex uses Base58 uppercase charset for the body of each address type.
  const B58BODY = 'ABCDEFGHJKMNPQRSTUVWXYZ01234'; // 28 uppercase Base58 chars

  // Mainnet P2PKH (legacy, starts with '1')
  it('accepts a valid mainnet P2PKH address', () => {
    expect(isValidBitcoinAddress('1' + B58BODY)).toBe(true);
  });

  // Mainnet P2SH (starts with '3')
  it('accepts a valid mainnet P2SH address', () => {
    expect(isValidBitcoinAddress('3' + B58BODY)).toBe(true);
  });

  // Mainnet bech32 (starts with 'bc1')
  it('accepts a valid mainnet bech32 address', () => {
    expect(isValidBitcoinAddress('bc1qar0srrr7xfkvy5l643lydnw9re59gt')).toBe(true);
  });

  // Testnet addresses rejected by default
  it('rejects a testnet legacy address (m-prefix) when allowTestnet is false', () => {
    expect(isValidBitcoinAddress('m' + B58BODY)).toBe(false);
  });

  it('rejects a testnet legacy address (n-prefix) when allowTestnet is false', () => {
    expect(isValidBitcoinAddress('n' + B58BODY)).toBe(false);
  });

  it('rejects a testnet P2SH address (starts with 2) when allowTestnet is false', () => {
    expect(isValidBitcoinAddress('2' + B58BODY)).toBe(false);
  });

  it('rejects a testnet bech32 address (tb1) when allowTestnet is false', () => {
    expect(isValidBitcoinAddress('tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx')).toBe(false);
  });

  // Testnet addresses accepted when allowTestnet=true
  it('accepts a testnet legacy (m-prefix) address when allowTestnet=true', () => {
    expect(isValidBitcoinAddress('m' + B58BODY, true)).toBe(true);
  });

  it('accepts a testnet legacy (n-prefix) address when allowTestnet=true', () => {
    expect(isValidBitcoinAddress('n' + B58BODY, true)).toBe(true);
  });

  it('accepts a testnet P2SH address (starts with 2) when allowTestnet=true', () => {
    expect(isValidBitcoinAddress('2' + B58BODY, true)).toBe(true);
  });

  it('accepts a testnet bech32 address (tb1) when allowTestnet=true', () => {
    expect(isValidBitcoinAddress('tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx', true)).toBe(true);
  });

  // Invalid cases
  it('rejects an empty string', () => {
    expect(isValidBitcoinAddress('')).toBe(false);
  });

  it('rejects a random string', () => {
    expect(isValidBitcoinAddress('notabitcoinaddress')).toBe(false);
  });

  it('rejects an address that is too short', () => {
    expect(isValidBitcoinAddress('1abc')).toBe(false);
  });

  it('rejects null (cast to any)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isValidBitcoinAddress(null as any)).toBe(false);
  });
});

describe('isValidLightningInvoice', () => {
  it('accepts a mainnet invoice starting with lnbc', () => {
    expect(isValidLightningInvoice('lnbc1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdpl2pkx2ctnv5sxxmmwwd5kgetjypeh2ursdae8g6twvusx7mje')).toBe(true);
  });

  it('accepts a testnet invoice starting with lntb', () => {
    expect(isValidLightningInvoice('lntb100n1p3zj8r5pp5test')).toBe(true);
  });

  it('accepts an invoice with lnbcrt prefix (regtest)', () => {
    expect(isValidLightningInvoice('lnbcrt1p3test123abc')).toBe(true);
  });

  it('is case-insensitive (LNBC uppercase)', () => {
    expect(isValidLightningInvoice('LNBC1pvjluezpp5abc123')).toBe(true);
  });

  it('rejects a random string', () => {
    expect(isValidLightningInvoice('notaninvoice')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidLightningInvoice('')).toBe(false);
  });

  it('rejects null (cast to any)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isValidLightningInvoice(null as any)).toBe(false);
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
