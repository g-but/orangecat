/**
 * SSRF guard tests — webhook URLs must never point at internal addresses.
 * DNS is injected so no test performs real lookups.
 */
import { isPrivateAddress, checkPublicUrl } from '@/lib/security/ssrfGuard';

const resolvesTo =
  (...addresses: string[]) =>
  async () =>
    addresses.map(address => ({ address }));

const neverResolves = async (): Promise<Array<{ address: string }>> => {
  throw new Error('ENOTFOUND');
};

describe('isPrivateAddress', () => {
  it.each([
    '127.0.0.1',
    '10.0.0.5',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.1',
    '169.254.169.254', // cloud metadata
    '100.64.0.1', // CGNAT
    '0.0.0.0',
    '198.18.0.1',
    '224.0.0.1',
    '255.255.255.255',
    '::1',
    '::',
    'fc00::1',
    'fd12:3456::1',
    'fe80::1',
    '::ffff:192.168.1.1', // v4-mapped v6
  ])('%s is private/reserved', ip => {
    expect(isPrivateAddress(ip)).toBe(true);
  });

  it.each(['8.8.8.8', '1.1.1.1', '172.32.0.1', '100.128.0.1', '2606:4700::1111'])(
    '%s is public',
    ip => {
      expect(isPrivateAddress(ip)).toBe(false);
    }
  );
});

describe('checkPublicUrl', () => {
  it('accepts a public https URL', async () => {
    const result = await checkPublicUrl('https://example.com/hook', resolvesTo('93.184.216.34'));
    expect(result).toEqual({ ok: true });
  });

  it('rejects non-http(s) schemes', async () => {
    expect((await checkPublicUrl('ftp://example.com', resolvesTo('93.184.216.34'))).ok).toBe(false);
    expect((await checkPublicUrl('file:///etc/passwd', resolvesTo('93.184.216.34'))).ok).toBe(
      false
    );
  });

  it('rejects malformed URLs', async () => {
    expect((await checkPublicUrl('not a url', resolvesTo('93.184.216.34'))).ok).toBe(false);
  });

  it('rejects localhost by name without resolving', async () => {
    expect((await checkPublicUrl('https://localhost/hook', neverResolves)).ok).toBe(false);
    expect((await checkPublicUrl('https://foo.localhost/hook', neverResolves)).ok).toBe(false);
  });

  it('rejects literal private IPs without resolving', async () => {
    expect((await checkPublicUrl('https://127.0.0.1/hook', neverResolves)).ok).toBe(false);
    expect((await checkPublicUrl('https://169.254.169.254/latest/', neverResolves)).ok).toBe(false);
    expect((await checkPublicUrl('https://[::1]/hook', neverResolves)).ok).toBe(false);
  });

  it('rejects hostnames that resolve to a private address', async () => {
    const result = await checkPublicUrl(
      'https://rebind.example.com/hook',
      resolvesTo('93.184.216.34', '10.0.0.7')
    );
    expect(result.ok).toBe(false);
  });

  it('rejects hostnames that do not resolve', async () => {
    expect((await checkPublicUrl('https://nope.example.com/hook', neverResolves)).ok).toBe(false);
  });

  it('accepts a literal public IP', async () => {
    expect((await checkPublicUrl('https://8.8.8.8/hook', neverResolves)).ok).toBe(true);
  });
});
