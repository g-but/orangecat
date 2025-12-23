// Mock NextResponse to avoid depending on Next.js internals during unit tests
const nextHeaders = () => {
  const store = new Map<string, string>();
  return {
    set: (key: string, value: string) => store.set(key, value),
    get: (key: string) => store.get(key) || null,
  };
};

jest.mock('next/server', () => {
  const buildHeaders = nextHeaders;
  return {
    NextResponse: {
      next: () => ({ headers: buildHeaders() }),
      redirect: (url: URL) => ({
        status: 307,
        headers: {
          get: (key: string) => (key === 'location' ? url.toString() : null),
          set: () => {},
        },
      }),
    },
    NextRequest: class {},
    NextFetchEvent: class {},
  };
});

import { middleware } from '@/middleware';

// Minimal NextRequest stub for middleware tests
function buildRequest(path: string, cookies: Record<string, string> = {}) {
  const cookieMap = new Map(Object.entries(cookies));

  return {
    nextUrl: new URL(`https://example.com${path}`),
    cookies: {
      get: (name: string) =>
        cookieMap.has(name) ? { name, value: cookieMap.get(name) as string } : undefined,
      getAll: () =>
        Array.from(cookieMap.entries()).map(([name, value]) => ({
          name,
          value,
        })),
      set: () => {},
    },
    headers: new Headers(),
    url: `https://example.com${path}`,
  };
}

describe('middleware auth protection', () => {
  const realEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...realEnv };
  });

  afterEach(() => {
    process.env = realEnv;
  });

  it('allows public route without auth', async () => {
    const req = buildRequest('/');
    const res = await middleware(req as any);
    expect(res?.status).toBeUndefined(); // NextResponse.next()
  });

  it('allows protected route through when no token cookie (client-side auth handles it)', async () => {
    // With localStorage-based auth, middleware cannot check auth state server-side
    // It allows through and lets client-side auth redirect if needed
    const req = buildRequest('/dashboard');
    const res = await middleware(req as any);
    expect(res?.status).toBeUndefined(); // NextResponse.next() - allows through
  });
});
